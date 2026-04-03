import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Rect as KonvaRect, Circle as KonvaCircle, Line as KonvaLine, TextPath as KonvaTextPath, Group as KonvaGroup } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { XenoLayer, XenoState, XenoBlendMode, XenoMaskSettings, XenoEffect, XenoTextData } from '../types';
import { soundService } from '../services/soundService';

const GUIDELINE_OFFSET = 5;

const getLineGuideStops = (skipShape: any, stage: Konva.Stage) => {
  const vertical = [0, stage.width() / 2, stage.width()];
  const horizontal = [0, stage.height() / 2, stage.height()];

  stage.find('.object').forEach((guideItem: any) => {
    if (guideItem === skipShape) return;
    const box = guideItem.getClientRect();
    vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
    horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
  });

  return { vertical, horizontal };
};

const getObjectSnappingEdges = (node: any) => {
  const box = node.getClientRect();
  const absPos = node.getAbsolutePosition();

  return {
    vertical: [
      { guide: Math.round(box.x), offset: Math.round(absPos.x - box.x), snap: 'start' },
      { guide: Math.round(box.x + box.width / 2), offset: Math.round(absPos.x - box.x - box.width / 2), snap: 'center' },
      { guide: Math.round(box.x + box.width), offset: Math.round(absPos.x - box.x - box.width), snap: 'end' },
    ],
    horizontal: [
      { guide: Math.round(box.y), offset: Math.round(absPos.y - box.y), snap: 'start' },
      { guide: Math.round(box.y + box.height / 2), offset: Math.round(absPos.y - box.y - box.height / 2), snap: 'center' },
      { guide: Math.round(box.y + box.height), offset: Math.round(absPos.y - box.y - box.height), snap: 'end' },
    ],
  };
};

const getGuides = (lineGuideStops: any, itemBounds: any) => {
  const resultV: any[] = [];
  const resultH: any[] = [];

  lineGuideStops.vertical.forEach((line: number) => {
    itemBounds.vertical.forEach((item: any) => {
      const diff = Math.abs(line - item.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({ line, diff, snap: item.snap, offset: item.offset });
      }
    });
  });

  lineGuideStops.horizontal.forEach((line: number) => {
    itemBounds.horizontal.forEach((item: any) => {
      const diff = Math.abs(line - item.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({ line, diff, snap: item.snap, offset: item.offset });
      }
    });
  });

  const guides: any[] = [];
  const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

  if (minV) guides.push({ line: minV.line, orientation: 'V', snap: minV.snap, offset: minV.offset });
  if (minH) guides.push({ line: minH.line, orientation: 'H', snap: minH.snap, offset: minH.offset });

  return guides;
};

const applyXenoEffects = (node: any, effects?: XenoEffect[]) => {
  if (!effects || effects.length === 0) return;
  const filters: any[] = [];
  
  effects.forEach(effect => {
    if (!effect.enabled) return;
    if (effect.type === 'blur') filters.push(Konva.Filters.Blur);
    if (effect.type === 'noise') filters.push(Konva.Filters.Noise);
    if (effect.type === 'pixelate') filters.push(Konva.Filters.Pixelate);
    if (effect.type === 'invert') filters.push(Konva.Filters.Invert);
    if (effect.type === 'sepia') filters.push(Konva.Filters.Sepia);
    if (effect.type === 'glow') filters.push(Konva.Filters.Blur); // Glow is often blur + offset
  });

  node.filters(filters);
  effects.forEach(effect => {
    if (!effect.enabled) return;
    if (effect.type === 'blur') node.blurRadius(effect.params.radius || 10);
    if (effect.type === 'noise') node.noise(effect.params.amount || 0.2);
    if (effect.type === 'pixelate') node.pixelSize(effect.params.size || 10);
  });
  node.cache();
};

const mapBlendMode = (mode?: XenoBlendMode): any => {
  if (!mode || mode === 'normal') return 'source-over';
  return mode;
};

interface XenoCanvasProps {
  width: number;
  height: number;
  layers: XenoLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<XenoLayer>) => void;
  onDragMove?: (e: any) => void;
  onTransformMove?: (e: any) => void;
  backgroundColor?: string;
  backgroundGradient?: XenoState['backgroundGradient'];
  isDrawing?: boolean;
  brushSettings?: XenoState['brushSettings'];
  onDrawEnd?: (points: number[]) => void;
  onTriggerParticles?: (x: number, y: number, type?: 'spark' | 'glitch' | 'ghost', count?: number) => void;
  visualEffects?: XenoState['visualEffects'];
  snappingEnabled?: boolean;
  guidesEnabled?: boolean;
  isLassoing?: boolean;
  onLassoEnd?: (points: number[]) => void;
  inpaintMask?: number[][];
}

const useXenoAnimation = (nodeRef: React.RefObject<any>, layer: XenoLayer) => {
  useEffect(() => {
    if (!layer.animation || layer.animation === 'none') return;
    const node = nodeRef.current;
    if (!node) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      if (layer.animation === 'pulse') {
        const scale = 1 + Math.sin(frame.time / 500) * 0.05;
        node.scale({ x: layer.scaleX * scale, y: layer.scaleY * scale });
      } else if (layer.animation === 'flicker') {
        node.opacity(layer.opacity * (Math.random() > 0.9 ? 0.5 : 1));
      } else if (layer.animation === 'glitch') {
        if (Math.random() > 0.95) {
          node.x(layer.x + (Math.random() - 0.5) * 5);
          node.opacity(layer.opacity * 0.8);
        } else {
          node.x(layer.x);
          node.opacity(layer.opacity);
        }
      }
    }, node.getLayer());
    anim.start();
    return () => { anim.stop(); };
  }, [layer.animation, layer.scaleX, layer.scaleY, layer.opacity, layer.x]);
};

const getClipFunc = (layer: XenoLayer) => {
  const mask = layer.mask;
  if (!mask || !mask.enabled || mask.type === 'none') return undefined;

  return (ctx: any) => {
    const mx = mask.x;
    const my = mask.y;
    
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate((mask.rotation * Math.PI) / 180);
    ctx.translate(-mx, -my);

    if (mask.type === 'circle') {
      ctx.beginPath();
      ctx.arc(mx, my, mask.width / 2, 0, Math.PI * 2, false);
    } else if (mask.type === 'rect') {
      ctx.beginPath();
      ctx.rect(mx - mask.width / 2, my - mask.height / 2, mask.width, mask.height);
    } else if (mask.type === 'star') {
      const spikes = 5;
      const outerRadius = mask.width / 2;
      const innerRadius = outerRadius / 2.5;
      const cx = mx;
      const cy = my;
      
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    } else if (mask.type === 'custom' && mask.points) {
      ctx.beginPath();
      ctx.moveTo(mx + mask.points[0], my + mask.points[1]);
      for (let i = 2; i < mask.points.length; i += 2) {
        ctx.lineTo(mx + mask.points[i], my + mask.points[i+1]);
      }
      ctx.closePath();
    }
    ctx.restore();
  };
};

const BrushLayer = ({ layer, isSelected, onSelect, onUpdate, onTriggerParticles, onDragMove, onDragEnd }: { 
  layer: XenoLayer; 
  isSelected: boolean; 
  onSelect: () => void;
  onUpdate: (updates: Partial<XenoLayer>) => void;
  onTriggerParticles?: (x: number, y: number, type?: 'spark' | 'glitch' | 'ghost', count?: number) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
}) => {
  const shapeRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  useXenoAnimation(shapeRef, layer);

  useEffect(() => {
    if (shapeRef.current) {
      applyXenoEffects(shapeRef.current, layer.effectsStack);
    }
  }, [layer.effectsStack]);

  return (
    <>
      <KonvaLine
        ref={shapeRef}
        id={layer.id}
        points={layer.data.points}
        stroke={layer.data.color}
        strokeWidth={layer.data.size}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={layer.data.mode === 'eraser' ? 'destination-out' : mapBlendMode(layer.blendMode)}
        opacity={layer.opacity}
        visible={layer.visible}
        draggable={!layer.locked}
        clipFunc={getClipFunc(layer)}
        onClick={onSelect}
        onTap={onSelect}
        shadowColor={layer.data.effect === 'neon' ? layer.data.color : 'transparent'}
        shadowBlur={layer.data.effect === 'neon' ? 15 : 0}
        name="object"
        onDragMove={(e) => {
          if (layer.locked) return;
          onDragMove?.(e);
        }}
        onDragEnd={(e: any) => {
          onDragEnd?.(e);
          soundService.playCanvas();
          onTriggerParticles?.(e.target.x(), e.target.y(), 'spark', 10);
          onUpdate({ x: e.target.x(), y: e.target.y() });
        }}
      />
      {isSelected && !layer.locked && (
        <Transformer ref={trRef} />
      )}
    </>
  );
};

const ImageLayer = ({ layer, isSelected, onSelect, onUpdate, onTriggerParticles, onDragMove, onDragEnd, onTransformEnd }: { 
  layer: XenoLayer; 
  isSelected: boolean; 
  onSelect: () => void;
  onUpdate: (updates: Partial<XenoLayer>) => void;
  onTriggerParticles?: (x: number, y: number, type?: 'spark' | 'glitch' | 'ghost', count?: number) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
  onTransformEnd?: (e: any) => void;
}) => {
  const [image] = useImage(layer.data.src || '');
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const applyFilters = (node: Konva.Image) => {
    if (!layer.filters) return;
    const filters = [];
    if (layer.filters.brightness !== 0) filters.push(Konva.Filters.Brighten);
    if (layer.filters.contrast !== 0) filters.push(Konva.Filters.Contrast);
    if (layer.filters.saturation !== 0 || layer.filters.hue !== 0) filters.push(Konva.Filters.HSL);
    if (layer.filters.blur > 0) filters.push(Konva.Filters.Blur);
    if (layer.filters.grayscale) filters.push(Konva.Filters.Grayscale);
    if (layer.filters.pixelate > 0) filters.push(Konva.Filters.Pixelate);
    if (layer.filters.noise > 0) filters.push(Konva.Filters.Noise);
    if (layer.filters.sharpen > 0) filters.push(Konva.Filters.Enhance);
    if (layer.filters.invert) filters.push(Konva.Filters.Invert);
    if (layer.filters.sepia) filters.push(Konva.Filters.Sepia);
    
    node.filters(filters);
    node.brightness(layer.filters.brightness / 100);
    node.contrast(layer.filters.contrast);
    node.saturation(layer.filters.saturation / 100);
    node.hue(layer.filters.hue);
    node.blurRadius(layer.filters.blur);
    node.pixelSize(layer.filters.pixelate);
    node.noise(layer.filters.noise / 100);
    node.cache();
  };

  useXenoAnimation(shapeRef, layer);

  useEffect(() => {
    if (shapeRef.current) {
      applyFilters(shapeRef.current);
      applyXenoEffects(shapeRef.current, layer.effectsStack);
    }
  }, [layer.filters, layer.effectsStack, image]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        id={layer.id}
        image={image}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rotation={layer.rotation}
        scaleX={layer.scaleX}
        scaleY={layer.scaleY}
        opacity={layer.opacity}
        visible={layer.visible}
        draggable={!layer.locked}
        name="object"
        globalCompositeOperation={mapBlendMode(layer.blendMode)}
        clipFunc={getClipFunc(layer)}
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          soundService.playCanvas();
          onTriggerParticles?.(e.target.x(), e.target.y(), 'spark', 10);
          onUpdate({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          onTriggerParticles?.(node.x(), node.y(), 'glitch', 15);
          onUpdate({
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && !layer.locked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

const TextLayer = ({ layer, isSelected, onSelect, onUpdate, onTriggerParticles, onDragMove, onDragEnd, onTransformEnd }: { 
  layer: XenoLayer; 
  isSelected: boolean; 
  onSelect: () => void;
  onUpdate: (updates: Partial<XenoLayer>) => void;
  onTriggerParticles?: (x: number, y: number, type?: 'spark' | 'glitch' | 'ghost', count?: number) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
  onTransformEnd?: (e: any) => void;
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  useXenoAnimation(shapeRef, layer);

  useEffect(() => {
    if (shapeRef.current) {
      applyXenoEffects(shapeRef.current, layer.effectsStack);
    }
  }, [layer.effectsStack]);

  const isCurved = layer.data.curved;
  const usePath = layer.data.usePath;
  const radius = layer.data.curveRadius || 200;
  
  // Simple arc path for curved text
  // We use a path that curves based on the radius
  const path = isCurved 
    ? `M 0,${radius} A ${radius},${radius} 0 0,1 ${layer.width},${radius}`
    : (usePath ? layer.data.path : null);

  const commonProps = {
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    opacity: layer.opacity,
    visible: layer.visible,
    draggable: !layer.locked,
    name: "object",
    globalCompositeOperation: mapBlendMode(layer.blendMode),
    clipFunc: getClipFunc(layer),
    onClick: onSelect,
    onTap: onSelect,
    onDragMove: onDragMove,
    onDragEnd: (e: any) => {
      onDragEnd?.(e);
      soundService.playCanvas();
      onTriggerParticles?.(e.target.x(), e.target.y(), 'spark', 10);
      onUpdate({ x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: () => {
      const node = shapeRef.current!;
      onTriggerParticles?.(node.x(), node.y(), 'glitch', 15);
      onUpdate({
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      });
    },
  };

  const textData = layer.data as XenoTextData;
  const textProps = {
    text: textData.text,
    fontSize: textData.fontSize,
    fontFamily: textData.fontFamily || 'Inter',
    fontStyle: textData.fontStyle || 'normal',
    textDecoration: textData.textDecoration || 'none',
    letterSpacing: textData.letterSpacing || 0,
    lineHeight: textData.lineHeight || 1,
    fill: textData.fill || '#00ff41',
    stroke: textData.stroke || 'transparent',
    strokeWidth: textData.strokeWidth || 0,
    align: textData.align || 'left',
    shadowColor: textData.shadow?.enabled ? textData.shadow.color : (textData.glow?.enabled ? (textData.glow.color || textData.fill) : 'transparent'),
    shadowBlur: textData.shadow?.enabled ? textData.shadow.blur : (textData.glow?.enabled ? (textData.glow.blur || 20) : 0),
    shadowOffsetX: textData.shadow?.enabled ? textData.shadow.offsetX : 0,
    shadowOffsetY: textData.shadow?.enabled ? textData.shadow.offsetY : 0,
    shadowOpacity: textData.shadow?.enabled ? textData.shadow.opacity : (textData.glow?.enabled ? 0.8 : 0),
  };

  const renderText = (props: any, extraProps: any = {}) => {
    if (path) {
      return (
        <KonvaTextPath
          id={layer.id}
          {...props}
          {...extraProps}
          data={path}
        />
      );
    }
    return (
      <KonvaText
        id={layer.id}
        {...props}
        {...extraProps}
        width={layer.width}
        height={layer.height}
      />
    );
  };

  return (
    <>
      <KonvaGroup ref={shapeRef} {...commonProps}>
        {textData.chromaticAberration?.enabled ? (
          <>
            {renderText(textProps, { fill: '#ff0000', x: -textData.chromaticAberration.offset, opacity: 0.5, globalCompositeOperation: 'screen' })}
            {renderText(textProps, { fill: '#0000ff', x: textData.chromaticAberration.offset, opacity: 0.5, globalCompositeOperation: 'screen' })}
            {renderText(textProps, { globalCompositeOperation: 'screen' })}
          </>
        ) : (
          renderText(textProps)
        )}
      </KonvaGroup>
      {isSelected && !layer.locked && (
        <Transformer
          ref={trRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
          }}
        />
      )}
    </>
  );
};

const ShapeLayer = ({ layer, isSelected, onSelect, onUpdate, onTriggerParticles, onDragMove, onDragEnd, onTransformEnd }: { 
  layer: XenoLayer; 
  isSelected: boolean; 
  onSelect: () => void;
  onUpdate: (updates: Partial<XenoLayer>) => void;
  onTriggerParticles?: (x: number, y: number, type?: 'spark' | 'glitch' | 'ghost', count?: number) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
  onTransformEnd?: (e: any) => void;
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  useXenoAnimation(shapeRef, layer);

  useEffect(() => {
    if (shapeRef.current) {
      applyXenoEffects(shapeRef.current, layer.effectsStack);
    }
  }, [layer.effectsStack]);

  const commonProps = {
    ref: shapeRef,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    fill: layer.data.fill || '#00ff41',
    stroke: layer.data.stroke || 'transparent',
    strokeWidth: layer.data.strokeWidth || 0,
    rotation: layer.rotation,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    opacity: layer.opacity,
    visible: layer.visible,
    draggable: !layer.locked,
    name: "object",
    globalCompositeOperation: mapBlendMode(layer.blendMode),
    clipFunc: getClipFunc(layer),
    onClick: onSelect,
    onTap: onSelect,
    onDragMove: onDragMove,
    onDragEnd: (e: any) => {
      onDragEnd?.(e);
      soundService.playCanvas();
      onTriggerParticles?.(e.target.x(), e.target.y(), 'spark', 10);
      onUpdate({ x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: () => {
      const node = shapeRef.current!;
      onTriggerParticles?.(node.x(), node.y(), 'glitch', 15);
      onUpdate({
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      });
    },
  };

  return (
    <>
      {layer.data.shapeType === 'circle' ? (
        <KonvaCircle {...commonProps} id={layer.id} radius={layer.width / 2} />
      ) : layer.data.shapeType === 'polygon' ? (
        <KonvaLine 
          {...commonProps} 
          id={layer.id}
          points={layer.data.points || [0, 0, 100, 0, 100, 100, 0, 100]} 
          closed 
        />
      ) : (
        <KonvaRect {...commonProps} id={layer.id} cornerRadius={layer.data.cornerRadius || 0} />
      )}
      {isSelected && !layer.locked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

const XenoCanvas = forwardRef<any, XenoCanvasProps>(({ 
  width, 
  height, 
  layers, 
  selectedLayerId, 
  onSelectLayer, 
  onUpdateLayer,
  onDragMove,
  onTransformMove,
  backgroundColor,
  backgroundGradient,
  isDrawing,
  isLassoing,
  onLassoEnd,
  brushSettings,
  onDrawEnd,
  onTriggerParticles,
  visualEffects,
  snappingEnabled = true,
  guidesEnabled = true,
  inpaintMask = []
}, ref) => {
  const [lines, setLines] = useState<number[][]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const isDrawingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    toCanvas: () => stageRef.current?.toCanvas()
  }));

  const handleDragMove = (e: any) => {
    if (!snappingEnabled) return;
    
    const stage = e.target.getStage();
    const lineGuideStops = getLineGuideStops(e.target, stage);
    const itemBounds = getObjectSnappingEdges(e.target);
    const guides = getGuides(lineGuideStops, itemBounds);

    setGuides(guides);

    if (guides.length === 0) return;

    guides.forEach((lg) => {
      if (lg.orientation === 'V') {
        e.target.x(lg.line + lg.offset);
      } else if (lg.orientation === 'H') {
        e.target.y(lg.line + lg.offset);
      }
    });
  };

  const handleDragEnd = (e: any) => {
    setGuides([]);
  };

  useEffect(() => {
    if (visualEffects?.screenShake) {
      const interval = setInterval(() => {
        if (containerRef.current && Math.random() > 0.8) {
          const x = (Math.random() - 0.5) * 4;
          const y = (Math.random() - 0.5) * 4;
          containerRef.current.style.transform = `translate(${x}px, ${y}px)`;
          setTimeout(() => {
            if (containerRef.current) containerRef.current.style.transform = 'translate(0, 0)';
          }, 50);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [visualEffects?.screenShake]);

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      onSelectLayer(null);
    }
  };

  const handleMouseDown = (e: any) => {
    if (!isDrawing && !isLassoing) return;
    soundService.playCanvas();
    isDrawingRef.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, [pos.x, pos.y]]);
  };

  const handleMouseMove = (e: any) => {
    if ((!isDrawing && !isLassoing) || !isDrawingRef.current) return;
    if (Math.random() > 0.9) soundService.playCanvas();
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    if (!lastLine) return;
    lastLine = lastLine.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    if (!isDrawing && !isLassoing) return;
    isDrawingRef.current = false;
    if (lines.length > 0) {
      if (isLassoing && onLassoEnd) {
        onLassoEnd(lines[lines.length - 1]);
      } else if (isDrawing && onDrawEnd) {
        onDrawEnd(lines[lines.length - 1]);
      }
      setLines([]);
    }
  };

  const filterStyle = {
    filter: [
      visualEffects?.chromaticAberration ? 'drop-shadow(2px 0px 0px rgba(255,0,0,0.5)) drop-shadow(-2px 0px 0px rgba(0,255,255,0.5))' : '',
      visualEffects?.distortion ? 'contrast(1.2) saturate(1.1)' : '',
    ].filter(Boolean).join(' ')
  };

  return (
    <div 
      ref={containerRef}
      className={`relative glass-panel rounded-xl overflow-hidden shadow-2xl transition-transform duration-75 ${visualEffects?.screenShake ? '' : 'animate-breathe'}`}
      style={filterStyle}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="bg-void"
      >
        <Layer>
          {/* Background */}
          {backgroundGradient ? (
            <KonvaRect
              width={width}
              height={height}
              fillLinearGradientStartPoint={backgroundGradient.type === 'linear' ? { x: 0, y: 0 } : undefined}
              fillLinearGradientEndPoint={backgroundGradient.type === 'linear' ? { x: width, y: height } : undefined}
              fillLinearGradientColorStops={[0, backgroundGradient.start, 1, backgroundGradient.end]}
              fillRadialGradientStartPoint={backgroundGradient.type === 'radial' ? { x: width / 2, y: height / 2 } : undefined}
              fillRadialGradientEndPoint={backgroundGradient.type === 'radial' ? { x: width / 2, y: height / 2 } : undefined}
              fillRadialGradientStartRadius={0}
              fillRadialGradientEndRadius={Math.max(width, height)}
              fillRadialGradientColorStops={[0, backgroundGradient.start, 1, backgroundGradient.end]}
            />
          ) : (
            <KonvaRect
              width={width}
              height={height}
              fill={backgroundColor || '#0a0a0a'}
            />
          )}

          {layers.filter(l => !l.parentId).map((layer) => {
            const renderLayer = (l: XenoLayer) => {
              if (!l.visible) return null;
              if (l.type === 'image' || l.type === 'sticker' || l.type === 'logo') {
                return (
                  <ImageLayer
                    key={l.id}
                    layer={l}
                    isSelected={l.id === selectedLayerId}
                    onSelect={() => onSelectLayer(l.id)}
                    onUpdate={(updates) => onUpdateLayer(l.id, updates)}
                    onTriggerParticles={onTriggerParticles}
                    onDragMove={onDragMove}
                    onDragEnd={handleDragEnd}
                  />
                );
              }
              if (l.type === 'text') {
                return (
                  <TextLayer
                    key={l.id}
                    layer={l}
                    isSelected={l.id === selectedLayerId}
                    onSelect={() => onSelectLayer(l.id)}
                    onUpdate={(updates) => onUpdateLayer(l.id, updates)}
                    onTriggerParticles={onTriggerParticles}
                    onDragMove={onDragMove}
                    onDragEnd={handleDragEnd}
                  />
                );
              }
              if (l.type === 'shape') {
                return (
                  <ShapeLayer
                    key={l.id}
                    layer={l}
                    isSelected={l.id === selectedLayerId}
                    onSelect={() => onSelectLayer(l.id)}
                    onUpdate={(updates) => onUpdateLayer(l.id, updates)}
                    onTriggerParticles={onTriggerParticles}
                    onDragMove={onDragMove}
                    onDragEnd={handleDragEnd}
                  />
                );
              }
              if (l.type === 'brush') {
                return (
                  <BrushLayer
                    key={l.id}
                    layer={l}
                    isSelected={l.id === selectedLayerId}
                    onSelect={() => onSelectLayer(l.id)}
                    onUpdate={(updates) => onUpdateLayer(l.id, updates)}
                    onTriggerParticles={onTriggerParticles}
                    onDragMove={onDragMove}
                    onDragEnd={handleDragEnd}
                  />
                );
              }
              if (l.type === 'group') {
                const children = layers.filter(child => child.parentId === l.id);
                return (
                  <KonvaGroup 
                    key={l.id} 
                    x={l.x} 
                    y={l.y}
                    draggable={!l.locked}
                    onClick={() => onSelectLayer(l.id)}
                    onTap={() => onSelectLayer(l.id)}
                    onDragEnd={(e) => {
                      soundService.playCanvas();
                      onTriggerParticles?.(e.target.x(), e.target.y(), 'spark', 10);
                      onUpdateLayer(l.id, { x: e.target.x(), y: e.target.y() });
                    }}
                  >
                    {children.map(child => renderLayer(child))}
                  </KonvaGroup>
                );
              }
              return null;
            };
            return renderLayer(layer);
          })}

          {/* Inpaint Mask */}
          {inpaintMask.map((line, i) => (
            <KonvaLine
              key={`inpaint-${i}`}
              points={line}
              stroke="#00d4ff"
              strokeWidth={brushSettings?.size || 20}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={0.4}
              globalCompositeOperation="source-over"
            />
          ))}

          {/* Current Drawing Line or Lasso */}
          {(isDrawing || isLassoing) && lines.map((line, i) => (
            <KonvaLine
              key={i}
              points={line}
              stroke={isLassoing ? "#00ff41" : brushSettings?.color}
              strokeWidth={isLassoing ? 1 : brushSettings?.size}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              dash={isLassoing ? [5, 5] : undefined}
              globalCompositeOperation={!isLassoing && brushSettings?.mode === 'eraser' ? 'destination-out' : 'source-over'}
              opacity={isLassoing ? 0.8 : brushSettings?.opacity}
            />
          ))}
          {/* Guides */}
          {guidesEnabled && guides.map((g, i) => (
            <KonvaLine
              key={i}
              points={g.orientation === 'V' ? [g.line, 0, g.line, height] : [0, g.line, width, g.line]}
              stroke="#00ff41"
              strokeWidth={1}
              dash={[5, 5]}
              opacity={0.5}
            />
          ))}
        </Layer>
      </Stage>

      {/* Overlays */}
      {visualEffects?.vignette && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
      )}
      {visualEffects?.scanlines && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      )}
      {visualEffects?.distortion && (
        <div className="absolute inset-0 pointer-events-none animate-flicker opacity-[0.02] bg-white" />
      )}
    </div>
  );
});

export default XenoCanvas;
