import { XenoState, XenoLayer, XenoEffect } from './types';

export interface Command {
  execute(state: XenoState): XenoState;
  undo(state: XenoState): XenoState;
  label: string;
}

export class UpdateLayerCommand implements Command {
  constructor(
    private layerId: string,
    private updates: Partial<XenoLayer>,
    private previousState: Partial<XenoLayer>,
    public label: string = 'Update Layer'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => l.id === this.layerId ? { ...l, ...this.updates } : l)
    };
  }

  undo(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => l.id === this.layerId ? { ...l, ...this.previousState } : l)
    };
  }
}

export class TransformLayerCommand implements Command {
  constructor(
    private layerId: string,
    private updates: { x: number; y: number; scaleX: number; scaleY: number; rotation: number },
    private previousState: { x: number; y: number; scaleX: number; scaleY: number; rotation: number },
    public label: string = 'Transform Layer'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => l.id === this.layerId ? { ...l, ...this.updates } : l)
    };
  }

  undo(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => l.id === this.layerId ? { ...l, ...this.previousState } : l)
    };
  }
}

export class ApplyEffectCommand implements Command {
  constructor(
    private layerId: string,
    private effect: XenoEffect,
    private previousEffects: XenoEffect[],
    public label: string = 'Apply Effect'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => {
        if (l.id === this.layerId) {
          const effectsStack = l.effectsStack || [];
          const index = effectsStack.findIndex(e => e.id === this.effect.id);
          const newStack = index !== -1 
            ? effectsStack.map((e, i) => i === index ? this.effect : e)
            : [...effectsStack, this.effect];
          return { ...l, effectsStack: newStack };
        }
        return l;
      })
    };
  }

  undo(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => l.id === this.layerId ? { ...l, effectsStack: this.previousEffects } : l)
    };
  }
}

export class GroupLayersCommand implements Command {
  constructor(
    private groupId: string,
    private groupLayer: XenoLayer,
    private childIds: string[],
    private previousParents: Record<string, string | undefined>,
    private previousPositions: Record<string, { x: number; y: number }>,
    public label: string = 'Group Layers'
  ) {}

  execute(state: XenoState): XenoState {
    const newLayers = state.layers.map(l => {
      if (this.childIds.includes(l.id)) {
        return { 
          ...l, 
          parentId: this.groupId, 
          x: l.x - this.groupLayer.x, 
          y: l.y - this.groupLayer.y 
        };
      }
      return l;
    });
    return {
      ...state,
      layers: [...newLayers, this.groupLayer],
      selectedLayerId: this.groupId,
      selectedLayerIds: [this.groupId]
    };
  }

  undo(state: XenoState): XenoState {
    const newLayers = state.layers
      .filter(l => l.id !== this.groupId)
      .map(l => {
        if (this.childIds.includes(l.id)) {
          return { 
            ...l, 
            parentId: this.previousParents[l.id],
            x: this.previousPositions[l.id].x,
            y: this.previousPositions[l.id].y
          };
        }
        return l;
      });
    return {
      ...state,
      layers: newLayers,
      selectedLayerId: this.childIds[0],
      selectedLayerIds: this.childIds
    };
  }
}

export class DeleteLayerCommand implements Command {
  constructor(
    private layerIds: string[],
    private deletedLayers: XenoLayer[],
    private previousIndices: Record<string, number>,
    public label: string = 'Delete Layer'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.filter(l => !this.layerIds.includes(l.id)),
      selectedLayerId: null,
      selectedLayerIds: []
    };
  }

  undo(state: XenoState): XenoState {
    const newLayers = [...state.layers];
    // Sort deleted layers by their original index to restore correctly
    const sortedDeleted = [...this.deletedLayers].sort((a, b) => this.previousIndices[a.id] - this.previousIndices[b.id]);
    
    sortedDeleted.forEach(layer => {
      newLayers.splice(this.previousIndices[layer.id], 0, layer);
    });

    return {
      ...state,
      layers: newLayers,
      selectedLayerId: this.layerIds[0],
      selectedLayerIds: this.layerIds
    };
  }
}

export class AddLayerCommand implements Command {
  constructor(
    private layer: XenoLayer,
    public label: string = 'Add Layer'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      layers: [...state.layers, this.layer],
      selectedLayerId: this.layer.id,
      selectedLayerIds: [this.layer.id]
    };
  }

  undo(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.filter(l => l.id !== this.layer.id),
      selectedLayerId: null,
      selectedLayerIds: []
    };
  }
}

export class UpdateGlobalCommand implements Command {
  constructor(
    private updates: Partial<XenoState>,
    private previousState: Partial<XenoState>,
    public label: string = 'Update Global'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      ...this.updates
    };
  }

  undo(state: XenoState): XenoState {
    return {
      ...state,
      ...this.previousState
    };
  }
}

export class DuplicateLayersCommand implements Command {
  constructor(
    private originalIds: string[],
    private duplicatedLayers: XenoLayer[],
    private insertIndices: Record<string, number>,
    public label: string = 'Duplicate Layers'
  ) {}

  execute(state: XenoState): XenoState {
    const newLayers = [...state.layers];
    this.duplicatedLayers.forEach(layer => {
      newLayers.splice(this.insertIndices[layer.id], 0, layer);
    });
    return {
      ...state,
      layers: newLayers,
      selectedLayerId: this.duplicatedLayers[0].id,
      selectedLayerIds: this.duplicatedLayers.map(l => l.id)
    };
  }

  undo(state: XenoState): XenoState {
    const duplicatedIds = this.duplicatedLayers.map(l => l.id);
    return {
      ...state,
      layers: state.layers.filter(l => !duplicatedIds.includes(l.id)),
      selectedLayerId: this.originalIds[0],
      selectedLayerIds: this.originalIds
    };
  }
}

export class BatchUpdateLayersCommand implements Command {
  constructor(
    private updates: Record<string, Partial<XenoLayer>>,
    private previousStates: Record<string, Partial<XenoLayer>>,
    public label: string = 'Batch Update Layers'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => this.updates[l.id] ? { ...l, ...this.updates[l.id] } : l)
    };
  }

  undo(state: XenoState): XenoState {
    return {
      ...state,
      layers: state.layers.map(l => this.previousStates[l.id] ? { ...l, ...this.previousStates[l.id] } : l)
    };
  }
}

export class BatchAddLayersCommand implements Command {
  constructor(
    private layers: XenoLayer[],
    public label: string = 'Batch Add Layers'
  ) {}

  execute(state: XenoState): XenoState {
    return {
      ...state,
      layers: [...state.layers, ...this.layers],
      selectedLayerId: this.layers[this.layers.length - 1].id,
      selectedLayerIds: this.layers.map(l => l.id)
    };
  }

  undo(state: XenoState): XenoState {
    const layerIds = this.layers.map(l => l.id);
    return {
      ...state,
      layers: state.layers.filter(l => !layerIds.includes(l.id)),
      selectedLayerId: null,
      selectedLayerIds: []
    };
  }
}
