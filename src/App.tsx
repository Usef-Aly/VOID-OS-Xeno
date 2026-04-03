import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import XenoBackground from './components/XenoBackground';
import XenoSidebar from './components/XenoSidebar';
import XenoCanvas from './components/XenoCanvas';
import XenoSignature from './components/XenoSignature';
import XenoButton from './components/XenoButton';
import XenoTerminal from './components/XenoTerminal';
import XenoParticles from './components/XenoParticles';
import XenoCommandPalette, { CommandItem } from './components/XenoCommandPalette';
import { XenoLayer, XenoMode, XenoImage, XenoState, DEFAULT_FILTERS, XENO_PRESETS, XenoHistoryItem, XenoMacro } from './types';
import * as Commands from './commands';
import { RotateCcw, RotateCw, Plus, Terminal, Sparkles, Layout, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Copy, Group, Unlock, Lock, Zap, History, Search } from 'lucide-react';
import { soundService } from './services/soundService';
import { neuralService } from './services/neuralService';
import { ImageProcessingService } from './services/imageProcessingService';
import { useShortcuts } from './hooks/useShortcuts';
import XenoTooltip from './components/XenoTooltip';
import XenoFeaturePanel from './components/XenoFeaturePanel';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [mode, setMode] = useState<XenoMode>('QUICK');
  const [images, setImages] = useState<XenoImage[]>([]);
  const [state, setState] = useState<XenoState>({
    layers: [],
    selectedLayerId: null,
    selectedLayerIds: [],
    selectedNeuralIds: [],
    canvasWidth: 1080,
    canvasHeight: 1080,
    backgroundColor: '#0a0a0a',
    neuralBuffer: [],
    library: [],
    isGenerating: false,
    brushSettings: {
      size: 10,
      color: '#00ff41',
      opacity: 1,
      mode: 'brush',
      effect: 'none'
    },
    visualEffects: {
      screenShake: false,
      chromaticAberration: true,
      distortion: false,
      vignette: true,
      scanlines: true
    },
    historyTimeline: [],
    historyIndex: -1,
    snappingEnabled: true,
    guidesEnabled: true,
    isRecordingMacro: false,
    macroBuffer: [],
    macros: []
  });
  const [activeTab, setActiveTab] = useState<'layers' | 'adjust' | 'presets' | 'neural' | 'global' | 'draw' | 'social' | 'yt' | 'history' | 'macros' | 'text' | 'export'>('neural');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showGhost, setShowGhost] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<number[]>([]);
  const [particleTrigger, setParticleTrigger] = useState<{ x: number; y: number; type: 'spark' | 'glitch' | 'ghost'; count: number } | undefined>();
  const canvasRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  const triggerParticles = (x: number, y: number, type: 'spark' | 'glitch' | 'ghost' = 'spark', count: number = 20) => {
    setParticleTrigger({ x, y, type, count });
    // Reset trigger after a short delay to allow re-triggering
    setTimeout(() => setParticleTrigger(undefined), 100);
  };

  const addTerminalLog = useCallback((log: string) => {
    setTerminalLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${log}`]);
  }, []);

  const runCommand = useCallback((command: Commands.Command) => {
    setState(prev => {
      const newState = command.execute(prev);
      
      const newTimeline = prev.historyTimeline.slice(0, prev.historyIndex + 1);
      newTimeline.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        label: command.label,
        command: command,
        state: {
          layers: newState.layers,
          canvasWidth: newState.canvasWidth,
          canvasHeight: newState.canvasHeight,
          backgroundColor: newState.backgroundColor,
          backgroundGradient: newState.backgroundGradient,
          visualEffects: newState.visualEffects
        }
      });
      if (newTimeline.length > 50) newTimeline.shift();
      
      const newMacroBuffer = prev.isRecordingMacro 
        ? [...prev.macroBuffer, command]
        : prev.macroBuffer;

      return {
        ...newState,
        historyTimeline: newTimeline,
        historyIndex: newTimeline.length - 1,
        macroBuffer: newMacroBuffer
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= 0) {
        const command = prev.historyTimeline[prev.historyIndex].command;
        const newState = command.undo(prev);
        return {
          ...newState,
          historyIndex: prev.historyIndex - 1,
          historyTimeline: prev.historyTimeline
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.historyTimeline.length - 1) {
        const nextIndex = prev.historyIndex + 1;
        const command = prev.historyTimeline[nextIndex].command;
        const newState = command.execute(prev);
        return {
          ...newState,
          historyIndex: nextIndex,
          historyTimeline: prev.historyTimeline
        };
      }
      return prev;
    });
  }, []);

  const startRecordingMacro = () => {
    setState(prev => ({ ...prev, isRecordingMacro: true, macroBuffer: [] }));
    addTerminalLog("Macro recording started");
  };

  const stopRecordingMacro = (name: string) => {
    setState(prev => {
      const newMacro: XenoMacro = { 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        commands: prev.macroBuffer 
      };
      return { ...prev, isRecordingMacro: false, macros: [...prev.macros, newMacro] };
    });
    addTerminalLog(`Macro saved: ${name}`);
  };

  const playMacro = async (macroId: string) => {
    const macro = state.macros.find(m => m.id === macroId);
    if (!macro || macro.commands.length === 0) return;
    
    addTerminalLog(`Playing macro: ${macro.name} (${macro.commands.length} commands)`);
    
    for (const command of macro.commands) {
      runCommand(command);
      soundService.playCanvas();
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    addTerminalLog(`Macro ${macro.name} completed.`);
  };

  const handleLassoEnd = (points: number[]) => {
    setIsLassoing(false);
    setLassoPoints([]);
    
    if (points.length < 6) return; // Need at least 3 points (6 coordinates)

    const isPointInPolygon = (px: number, py: number, poly: number[]) => {
      let inside = false;
      for (let i = 0, j = poly.length - 2; i < poly.length; i += 2) {
        const xi = poly[i], yi = poly[i + 1];
        const xj = poly[j], yj = poly[j + 1];
        const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
        j = i;
      }
      return inside;
    };

    const selectedIds = state.layers
      .filter(l => {
        // Check if layer center is in polygon
        const cx = l.x + l.width / 2;
        const cy = l.y + l.height / 2;
        return isPointInPolygon(cx, cy, points);
      })
      .map(l => l.id);

    if (selectedIds.length > 0) {
      setState(prev => ({ ...prev, selectedLayerIds: selectedIds, selectedLayerId: selectedIds[0] }));
      addTerminalLog(`Lasso selected ${selectedIds.length} units`);
      soundService.playClick();
    }
  };

  const jumpToHistoryState = (index: number) => {
    setState(prev => {
      const historyItem = prev.historyTimeline[index];
      if (historyItem) {
        return {
          ...prev,
          ...historyItem.state,
          historyIndex: index,
          historyTimeline: prev.historyTimeline
        };
      }
      return prev;
    });
  };

  const duplicateLayers = () => {
    const selectedIds = state.selectedLayerId ? [state.selectedLayerId] : state.selectedLayerIds;
    if (selectedIds.length === 0) return;

    const duplicatedLayers: XenoLayer[] = [];
    const insertIndices: Record<string, number> = {};

    selectedIds.forEach(id => {
      const index = state.layers.findIndex(l => l.id === id);
      if (index !== -1) {
        const original = state.layers[index];
        const duplicate: XenoLayer = {
          ...original,
          id: Math.random().toString(36).substr(2, 9),
          name: `${original.name} (Copy)`,
          x: original.x + 20,
          y: original.y + 20,
        };
        duplicatedLayers.push(duplicate);
        insertIndices[duplicate.id] = index + 1;
      }
    });

    if (duplicatedLayers.length > 0) {
      runCommand(new Commands.DuplicateLayersCommand(selectedIds, duplicatedLayers, insertIndices));
      addTerminalLog(`Duplicated ${selectedIds.length} layers`);
    }
  };

  const groupLayers = () => {
    const selectedIds = state.selectedLayerIds.length > 0 ? state.selectedLayerIds : (state.selectedLayerId ? [state.selectedLayerId] : []);
    if (selectedIds.length < 2) return;

    const groupId = Math.random().toString(36).substr(2, 9);
    const selectedLayers = state.layers.filter(l => selectedIds.includes(l.id));
    
    const minX = Math.min(...selectedLayers.map(l => l.x));
    const minY = Math.min(...selectedLayers.map(l => l.y));
    const maxX = Math.max(...selectedLayers.map(l => l.x + l.width));
    const maxY = Math.max(...selectedLayers.map(l => l.y + l.height));

    const groupLayer: XenoLayer = {
      id: groupId,
      type: 'group' as const,
      name: 'New Group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      data: {},
    };

    const previousParents: Record<string, string | undefined> = {};
    const previousPositions: Record<string, { x: number; y: number }> = {};
    selectedLayers.forEach(l => {
      previousParents[l.id] = l.parentId;
      previousPositions[l.id] = { x: l.x, y: l.y };
    });

    runCommand(new Commands.GroupLayersCommand(groupId, groupLayer, selectedIds, previousParents, previousPositions));
    addTerminalLog(`Grouped ${selectedIds.length} layers`);
  };

  const alignLayers = (type: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle', relativeTo: 'canvas' | 'selection') => {
    const selectedIds = state.selectedLayerIds.length > 0 ? state.selectedLayerIds : (state.selectedLayerId ? [state.selectedLayerId] : []);
    if (selectedIds.length === 0) return;

    const selectedLayers = state.layers.filter(l => selectedIds.includes(l.id));
    let bounds = { x: 0, y: 0, width: state.canvasWidth, height: state.canvasHeight };

    if (relativeTo === 'selection' && selectedLayers.length > 1) {
      const minX = Math.min(...selectedLayers.map(l => l.x));
      const minY = Math.min(...selectedLayers.map(l => l.y));
      const maxX = Math.max(...selectedLayers.map(l => l.x + l.width));
      const maxY = Math.max(...selectedLayers.map(l => l.y + l.height));
      bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    const updates: Record<string, Partial<XenoLayer>> = {};
    const previousStates: Record<string, Partial<XenoLayer>> = {};

    selectedLayers.forEach(l => {
      const update: any = {};
      const previous: any = {};
      
      if (type === 'left') { update.x = bounds.x; previous.x = l.x; }
      if (type === 'right') { update.x = bounds.x + bounds.width - l.width; previous.x = l.x; }
      if (type === 'center') { update.x = bounds.x + (bounds.width - l.width) / 2; previous.x = l.x; }
      if (type === 'top') { update.y = bounds.y; previous.y = l.y; }
      if (type === 'bottom') { update.y = bounds.y + bounds.height - l.height; previous.y = l.y; }
      if (type === 'middle') { update.y = bounds.y + (bounds.height - l.height) / 2; previous.y = l.y; }

      updates[l.id] = update;
      previousStates[l.id] = previous;
    });

    runCommand(new Commands.BatchUpdateLayersCommand(updates, previousStates, `Align ${type}`));
  };

  const toggleLayerLock = (id: string) => {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    runCommand(new Commands.UpdateLayerCommand(id, { locked: !layer.locked }, { locked: layer.locked }, 'Toggle layer lock'));
  };

  const updateLayerEffects = (id: string, effects: any[]) => {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    runCommand(new Commands.UpdateLayerCommand(id, { effectsStack: effects }, { effectsStack: layer.effectsStack || [] }, 'Update layer effects'));
  };

  const applyAutoLayout = async () => {
    const selectedIds = state.selectedLayerIds.length > 0 ? state.selectedLayerIds : (state.selectedLayerId ? [state.selectedLayerId] : []);
    if (selectedIds.length < 2) return;

    addTerminalLog("ANALYZING COMPOSITION FOR AUTO-LAYOUT...");
    const selectedLayers = state.layers.filter(l => selectedIds.includes(l.id));
    
    const cols = Math.ceil(Math.sqrt(selectedLayers.length));
    const padding = 50;
    const cellWidth = (state.canvasWidth - padding * 2) / cols;
    const cellHeight = (state.canvasHeight - padding * 2) / cols;

    const updates: Record<string, Partial<XenoLayer>> = {};
    const previousStates: Record<string, Partial<XenoLayer>> = {};

    selectedLayers.forEach((l, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      updates[l.id] = {
        x: padding + col * cellWidth + (cellWidth - l.width) / 2,
        y: padding + row * cellHeight + (cellHeight - l.height) / 2
      };
      previousStates[l.id] = { x: l.x, y: l.y };
    });

    runCommand(new Commands.BatchUpdateLayersCommand(updates, previousStates, 'Auto layout'));
    addTerminalLog("AUTO-LAYOUT COMPLETE.");
  };

  const batchProcessNeuralBuffer = (action: 'tag' | 'delete' | 'add-to-canvas', value?: any) => {
    const selected = state.neuralBuffer.filter(img => state.selectedNeuralIds.includes(img.id));
    if (selected.length === 0) return;

    if (action === 'tag') {
      setState(prev => ({
        ...prev,
        neuralBuffer: prev.neuralBuffer.map(img => 
          prev.selectedNeuralIds.includes(img.id) 
            ? { ...img, tags: [...(img.tags || []), value] } 
            : img
        )
      }));
      addTerminalLog(`Tagged ${selected.length} assets with "${value}"`);
    } else if (action === 'delete') {
      setState(prev => ({
        ...prev,
        neuralBuffer: prev.neuralBuffer.filter(img => !prev.selectedNeuralIds.includes(img.id)),
        selectedNeuralIds: []
      }));
      addTerminalLog(`Deleted ${selected.length} assets from buffer`);
    } else if (action === 'add-to-canvas') {
      selected.forEach(img => addImageLayer(img.file));
      addTerminalLog(`Added ${selected.length} assets to canvas`);
    }
  };

  const saveToLibrary = (id: string) => {
    const asset = state.neuralBuffer.find(img => img.id === id) || state.library.find(img => img.id === id);
    if (!asset) return;
    
    setState(prev => ({
      ...prev,
      library: prev.library.some(img => img.id === id) 
        ? prev.library 
        : [...prev.library, { ...asset, isLibrary: true }]
    }));
    addTerminalLog(`Asset ${id} saved to library.`);
  };

  const generateYouTubeThumbnail = async (text: string, style: string) => {
    setState(prev => ({ ...prev, isGenerating: true }));
    addTerminalLog(`Generating YouTube thumbnail: "${text}" with style ${style}`);
    
    try {
      const prompt = `A high-impact YouTube thumbnail background for "${text}" in a ${style} style. Cinematic, vibrant, eye-catching, high contrast.`;
      const response = await neuralService.generateAsset(prompt);
      
      if (response) {
        // Add background image
        addImageLayer(response);
        
        // Add text layer with high-impact styling
        const textLayer: XenoLayer = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'text',
          name: 'Thumbnail Title',
          x: state.canvasWidth / 2 - 400,
          y: state.canvasHeight / 2 - 100,
          width: 800,
          height: 200,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          locked: false,
          data: {
            text: text.toUpperCase(),
            fontSize: 120,
            fontFamily: 'Anton',
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 8,
            align: 'center',
            glow: { enabled: true, color: '#00ff41', blur: 20 },
            lineHeight: 1,
            letterSpacing: 0
          }
        };
        
        setState(prev => ({
          ...prev,
          layers: [...prev.layers, textLayer],
          isGenerating: false
        }));
        triggerParticles(window.innerWidth / 2, window.innerHeight / 2, 'spark', 50);
        addTerminalLog(`YouTube thumbnail generated successfully.`);
      }
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false }));
      addTerminalLog(`Error generating thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addBrushLayer = (points: number[]) => {
    if (state.brushSettings.mode === 'inpaint') {
      const newState = { ...state, inpaintMask: [...(state.inpaintMask || []), points] };
      setState(newState);
      return;
    }

    const newLayer: XenoLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'brush',
      name: `Brush ${state.layers.filter(l => l.type === 'brush').length + 1}`,
      x: 0,
      y: 0,
      width: state.canvasWidth,
      height: state.canvasHeight,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: state.brushSettings.opacity,
      visible: true,
      locked: false,
      data: {
        points,
        color: state.brushSettings.color,
        size: state.brushSettings.size,
        mode: state.brushSettings.mode,
        effect: state.brushSettings.effect
      },
    };
    runCommand(new Commands.AddLayerCommand(newLayer));
  };

  const applyInpaint = async () => {
    if (!state.inpaintMask || state.inpaintMask.length === 0) {
      addTerminalLog("ERROR: DRAW A MASK FIRST.");
      return;
    }
    if (!state.selectedLayerId) {
      addTerminalLog("ERROR: SELECT A TARGET IMAGE LAYER.");
      return;
    }

    const layer = state.layers.find(l => l.id === state.selectedLayerId);
    if (!layer || layer.type !== 'image') {
      addTerminalLog("ERROR: NEURAL FILL ONLY SUPPORTED ON IMAGE LAYERS.");
      return;
    }

    addTerminalLog("INITIALIZING NEURAL CONTENT-AWARE FILL...");
    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const stage = canvasRef.current.getStage();
      // Create mask canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = layer.width;
      maskCanvas.height = layer.height;
      const maskCtx = maskCanvas.getContext('2d')!;
      
      maskCtx.strokeStyle = 'white';
      maskCtx.lineWidth = state.brushSettings.size;
      maskCtx.lineCap = 'round';
      maskCtx.lineJoin = 'round';
      
      state.inpaintMask.forEach(points => {
        maskCtx.beginPath();
        // Calculate relative points to the layer
        maskCtx.moveTo(points[0] - layer.x, points[1] - layer.y);
        for (let i = 2; i < points.length; i += 2) {
          maskCtx.lineTo(points[i] - layer.x, points[i+1] - layer.y);
        }
        maskCtx.stroke();
      });

      const maskImageData = maskCtx.getImageData(0, 0, layer.width, layer.height);
      const maskArray = new Uint8ClampedArray(layer.width * layer.height);
      for (let i = 0; i < maskImageData.data.length; i += 4) {
        maskArray[i / 4] = maskImageData.data[i + 3];
      }

      // Get image data
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = layer.data.src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = layer.width;
      tempCanvas.height = layer.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0, layer.width, layer.height);
      const imageData = tempCtx.getImageData(0, 0, layer.width, layer.height);

      // Run inpainting
      const filledData = await ImageProcessingService.patchMatchFill(
        imageData,
        maskArray,
        layer.width,
        layer.height,
        7
      );

      tempCtx.putImageData(filledData, 0, 0);
      const newSrc = tempCanvas.toDataURL();

      const newLayers = state.layers.map(l => 
        l.id === layer.id ? { ...l, data: { ...l.data, src: newSrc } } : l
      );
      
      const updates: Partial<XenoState> = { layers: newLayers, inpaintMask: [], isGenerating: false };
      const previousState: Partial<XenoState> = { layers: state.layers, inpaintMask: state.inpaintMask, isGenerating: state.isGenerating };
      
      runCommand(new Commands.UpdateGlobalCommand(updates, previousState, 'Content-Aware Fill'));
      addTerminalLog("NEURAL FILL COMPLETE.");
      triggerParticles(layer.x + layer.width/2, layer.y + layer.height/2, 'glitch', 30);
    } catch (error) {
      console.error(error);
      addTerminalLog("ERROR: NEURAL FILL FAILED.");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const generateBatchNeuralAssets = async (prompt: string, count: number = 4) => {
    if (!prompt) return;
    setState(prev => ({ ...prev, isGenerating: true }));
    setShowTerminal(true);
    setTerminalLogs([]);
    addTerminalLog(`INITIATING BATCH NEURAL SYNTHESIS [${count} UNITS]...`);
    
    try {
      const results = [];
      for (let i = 0; i < count; i++) {
        addTerminalLog(`SYNTHESIZING UNIT ${i + 1}/${count}...`);
        const imageUrl = await neuralService.generateAsset(prompt, 'VOID-CORE');
        
        const newImage: XenoImage = {
          id: Math.random().toString(36).substr(2, 9),
          file: new File([], `batch-${Date.now()}-${i}.png`),
          preview: imageUrl,
          width: 1024,
          height: 1024,
          createdAt: Date.now(),
          tags: [],
          isLibrary: false
        };
        results.push(newImage);
      }
      
      setImages(prev => [...prev, ...results]);
      setState(prev => ({ 
        ...prev, 
        neuralBuffer: [...prev.neuralBuffer, ...results],
        isGenerating: false 
      }));
      addTerminalLog(`BATCH SYNTHESIS COMPLETE. ${results.length} UNITS ADDED TO BUFFER.`);
      setTimeout(() => setShowTerminal(false), 3000);
    } catch (error) {
      console.error('Batch synthesis failed:', error);
      addTerminalLog(`ERROR: BATCH SYNTHESIS CORRUPTED. CHECK SYSTEM LOGS.`);
      setState(prev => ({ ...prev, isGenerating: false }));
      setTimeout(() => setShowTerminal(false), 3000);
    }
  };

  const generateNeuralAsset = async (prompt: string) => {
    if (!prompt) return;
    
    setState(prev => ({ ...prev, isGenerating: true }));
    setShowTerminal(true);
    setTerminalLogs([]);
    addTerminalLog("INITIALIZING NEURAL SYNTHESIS...");
    addTerminalLog("CONNECTING TO XENO-CORE...");
    
    try {
      addTerminalLog("BUFFERING PROMPT DATA...");
      const imageUrl = await neuralService.generateAsset(prompt, 'VOID-CORE');

      addTerminalLog("SYNTHESIZING PIXELS...");
      
      if (imageUrl) {
        addTerminalLog("DECRYPTING ASSET...");
        const newImage: XenoImage = {
          id: Math.random().toString(36).substr(2, 9),
          file: new File([], `neural-${Date.now()}.png`),
          preview: imageUrl,
          width: 1024,
          height: 1024,
          createdAt: Date.now(),
          tags: [],
          isLibrary: false
        };
        
        setImages(prev => [...prev, newImage]);
        setState(prev => ({ 
          ...prev, 
          neuralBuffer: [...prev.neuralBuffer, newImage],
          isGenerating: false 
        }));
        addTerminalLog("ASSET STORED IN NEURAL BUFFER.");
        triggerParticles(window.innerWidth / 2, window.innerHeight / 2, 'glitch', 50);
        setTimeout(() => setShowTerminal(false), 2000);
      } else {
        throw new Error("No image data received");
      }
    } catch (error) {
      addTerminalLog("CRITICAL ERROR: SYNTHESIS FAILED.");
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false }));
      setTimeout(() => setShowTerminal(false), 3000);
    }
  };

  const neuralSuggest = async () => {
    if (!state.selectedLayerId) return;
    const layer = state.layers.find(l => l.id === state.selectedLayerId);
    if (!layer) return;

    setShowTerminal(true);
    addTerminalLog("ANALYZING LAYER NEURAL SIGNATURE...");
    
    try {
      const suggestions = await neuralService.suggestEnhancements(layer, state.backgroundColor);
      addTerminalLog("APPLYING NEURAL ENHANCEMENTS...");
      
      const updates: Partial<XenoState> = {
        layers: state.layers.map(l => l.id === layer.id ? { 
          ...l, 
          ...suggestions,
          data: { ...l.data, ...(suggestions.data || {}) },
          filters: { ...(l.filters || DEFAULT_FILTERS), ...(suggestions.filters || {}) }
        } : l)
      };
      
      const previousState: Partial<XenoState> = {
        layers: state.layers
      };
      
      runCommand(new Commands.UpdateGlobalCommand(updates, previousState, 'Neural Optimization'));
      triggerParticles(layer.x + layer.width / 2, layer.y + layer.height / 2, 'glitch', 30);
      addTerminalLog("NEURAL OPTIMIZATION COMPLETE.");
      setTimeout(() => setShowTerminal(false), 2000);
    } catch (error) {
      addTerminalLog("NEURAL ANALYSIS CORRUPTED.");
      setTimeout(() => setShowTerminal(false), 2000);
    }
  };
  const onSavePreset = (name: string) => {
    const newPreset = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      width: state.canvasWidth,
      height: state.canvasHeight,
      layers: state.layers,
      backgroundColor: state.backgroundColor,
      backgroundGradient: state.backgroundGradient,
      visualEffects: state.visualEffects
    };
    // In a real app, we'd save this to a database or localStorage
    addTerminalLog(`PRESET "${name.toUpperCase()}" SAVED TO SYSTEM.`);
  };

  // Boot sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsBooting(false), 1000);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // History management
  // (Removed duplicated simple history functions)

  // Layer management
  const addImageLayer = (source: File | string) => {
    soundService.playUpload();
    
    const processImage = (src: string, file?: File) => {
      const img = new Image();
      img.onload = () => {
        const newLayer: XenoLayer = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          name: file ? file.name : 'Neural Asset',
          x: state.canvasWidth / 2 - 250,
          y: state.canvasHeight / 2 - 250,
          width: 500,
          height: (img.height / img.width) * 500,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          locked: false,
          data: { src },
          filters: { ...DEFAULT_FILTERS },
        };
        const newState = { ...state, layers: [...state.layers, newLayer], selectedLayerId: newLayer.id };
        runCommand(new Commands.AddLayerCommand(newLayer));
        
        // Add to neural buffer if not already there
        if (file && !images.find(i => i.file.name === file.name)) {
          setImages(prev => [...prev, { 
            id: newLayer.id, 
            file, 
            preview: src, 
            width: img.width, 
            height: img.height,
            createdAt: Date.now(),
            tags: [],
            isLibrary: false
          }]);
        } else if (!file) {
          const newImg: XenoImage = {
            id: newLayer.id,
            file: new File([], `neural-${Date.now()}.png`),
            preview: src,
            width: img.width,
            height: img.height,
            createdAt: Date.now(),
            tags: ['neural'],
            isLibrary: false
          };
          setImages(prev => [...prev, newImg]);
          setState(prev => ({ ...prev, neuralBuffer: [...prev.neuralBuffer, newImg] }));
        }
      };
      img.src = src;
    };

    if (typeof source === 'string') {
      processImage(source);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        processImage(src, source);
      };
      reader.readAsDataURL(source);
    }
  };

  const addTextLayer = () => {
    const newLayer: XenoLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      name: 'New Text',
      x: state.canvasWidth / 2 - 100,
      y: state.canvasHeight / 2 - 25,
      width: 200,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      data: { 
        text: 'XENO TEXT', 
        fontSize: 40, 
        fontFamily: 'Orbitron', 
        fill: '#00ff41', 
        glow: {
          enabled: true,
          color: '#00ff41',
          blur: 20
        },
        shadow: {
          enabled: false,
          color: '#000000',
          blur: 5,
          offsetX: 2,
          offsetY: 2,
          opacity: 0.5
        },
        chromaticAberration: {
          enabled: false,
          offset: 2
        },
        strokeWidth: 0,
        stroke: '#000000',
        fontStyle: 'normal',
        textDecoration: 'none',
        letterSpacing: 0,
        lineHeight: 1,
        align: 'center',
        curved: false,
        curveRadius: 200,
        usePath: false,
        path: ''
      },
    };
    runCommand(new Commands.AddLayerCommand(newLayer));
  };

  const addShapeLayer = (type: 'rect' | 'circle' | 'polygon') => {
    const newLayer: XenoLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'shape',
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: state.canvasWidth / 2 - 100,
      y: state.canvasHeight / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 0.5,
      visible: true,
      locked: false,
      data: { 
        shapeType: type, 
        fill: '#00ff41', 
        stroke: '#00ff41', 
        strokeWidth: 2, 
        cornerRadius: type === 'rect' ? 10 : 0,
        points: type === 'polygon' ? [0, 0, 100, 0, 100, 100, 0, 100] : undefined
      },
    };
    runCommand(new Commands.AddLayerCommand(newLayer));
  };

  const addMemeText = () => {
    const topText: XenoLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      name: 'Meme Top',
      x: state.canvasWidth / 2 - 250,
      y: 20,
      width: 500,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      data: { 
        text: 'TOP TEXT', 
        fontSize: 60, 
        fontFamily: 'Impact', 
        fill: '#ffffff', 
        stroke: '#000000', 
        strokeWidth: 2,
        align: 'center',
        lineHeight: 1,
        letterSpacing: 0
      },
    };
    const bottomText: XenoLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      name: 'Meme Bottom',
      x: state.canvasWidth / 2 - 250,
      y: state.canvasHeight - 120,
      width: 500,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      data: { 
        text: 'BOTTOM TEXT', 
        fontSize: 60, 
        fontFamily: 'Impact', 
        fill: '#ffffff', 
        stroke: '#000000', 
        strokeWidth: 2,
        align: 'center',
        lineHeight: 1,
        letterSpacing: 0
      },
    };
    runCommand(new Commands.BatchAddLayersCommand([topText, bottomText], 'Add Meme Text'));
  };

  const addWatermark = () => {
    const watermark: XenoLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'logo',
      name: 'Watermark',
      x: state.canvasWidth - 150,
      y: state.canvasHeight - 150,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 0.3,
      visible: true,
      locked: false,
      data: { src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDUwNTA1Ii8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI1MCIgc3Ryb2tlPSIjZmYwMDU1IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=' }, 
    };
    runCommand(new Commands.AddLayerCommand(watermark, 'Add Watermark'));
  };

  const batchExport = () => {
    exportCanvas();
    console.log('Batch export initiated');
  };

  const updateLayer = (id: string, updates: Partial<XenoLayer>) => {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;

    const previousState: Partial<XenoLayer> = {};
    Object.keys(updates).forEach(key => {
      (previousState as any)[key] = (layer as any)[key];
    });

    runCommand(new Commands.UpdateLayerCommand(id, updates, previousState));
  };

  const updateLayerSilent = (id: string, updates: Partial<XenoLayer>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = state.layers.findIndex(l => l.id === id);
    if (index === -1) return;
    
    const newLayers = [...state.layers];
    if (direction === 'up' && index < newLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    } else if (direction === 'down' && index > 0) {
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    } else {
      return;
    }
    
    runCommand(new Commands.UpdateGlobalCommand({ layers: newLayers }, { layers: state.layers }, `Move layer ${direction}`));
  };

  const removeLayer = useCallback((id?: string) => {
    const idsToRemove = id ? [id] : state.selectedLayerIds.length > 0 ? state.selectedLayerIds : (state.selectedLayerId ? [state.selectedLayerId] : []);
    if (idsToRemove.length === 0) return;

    const deletedLayers = state.layers.filter(l => idsToRemove.includes(l.id));
    const previousIndices: Record<string, number> = {};
    state.layers.forEach((l, i) => {
      if (idsToRemove.includes(l.id)) previousIndices[l.id] = i;
    });

    runCommand(new Commands.DeleteLayerCommand(idsToRemove, deletedLayers, previousIndices));
    addTerminalLog(`Removed ${idsToRemove.length} layers`);
  }, [state.layers, state.selectedLayerIds, state.selectedLayerId, runCommand, addTerminalLog]);

  // Shortcut Handlers
  const shortcutHandlers = React.useMemo(() => ({
    setMode,
    undo,
    redo,
    duplicate: duplicateLayers,
    remove: () => removeLayer(),
    deselect: () => setState(prev => ({ ...prev, selectedLayerId: null, selectedLayerIds: [] })),
    group: groupLayers,
    toggleTerminal: () => setShowTerminal(prev => !prev),
    toggleGuides: () => setState(prev => ({ ...prev, guidesEnabled: !prev.guidesEnabled })),
    toggleSnapping: () => setState(prev => ({ ...prev, snappingEnabled: !prev.snappingEnabled })),
    setBrushMode: (mode: 'brush' | 'eraser' | 'inpaint') => setState(prev => ({ ...prev, brushSettings: { ...prev.brushSettings, mode } })),
    generate: () => {
      // If prompt is active in sidebar, this could trigger it
      // For now, just a log
      addTerminalLog("Neural generation shortcut triggered");
    },
    addText: addTextLayer,
    addRect: () => addShapeLayer('rect'),
    addCircle: () => addShapeLayer('circle'),
    align: (type) => alignLayers(type, 'canvas'),
  }), [setMode, undo, redo, duplicateLayers, removeLayer, groupLayers, addTerminalLog, addTextLayer, addShapeLayer, alignLayers]);

  useShortcuts(shortcutHandlers);

  const applyPreset = (preset: any) => {
    const oldWidth = state.canvasWidth;
    const oldHeight = state.canvasHeight;
    const newWidth = preset.width;
    const newHeight = preset.height;
    
    const updatedLayers = state.layers.map(layer => {
      const constraints = layer.constraints || { horizontal: 'scale', vertical: 'scale', proportional: true };
      let newX = layer.x;
      let newY = layer.y;
      let newW = layer.width;
      let newH = layer.height;

      // Horizontal Constraints
      if (constraints.horizontal === 'left') {
        newX = layer.x;
      } else if (constraints.horizontal === 'right') {
        newX = newWidth - (oldWidth - layer.x);
      } else if (constraints.horizontal === 'center') {
        const centerOffset = layer.x + (layer.width * layer.scaleX) / 2 - oldWidth / 2;
        newX = newWidth / 2 + centerOffset - (layer.width * layer.scaleX) / 2;
      } else if (constraints.horizontal === 'stretch') {
        const rightOffset = oldWidth - (layer.x + layer.width);
        newX = layer.x;
        newW = newWidth - layer.x - rightOffset;
      } else if (constraints.horizontal === 'scale') {
        newX = (layer.x / oldWidth) * newWidth;
        newW = (layer.width / oldWidth) * newWidth;
      }

      // Vertical Constraints
      if (constraints.vertical === 'top') {
        newY = layer.y;
      } else if (constraints.vertical === 'bottom') {
        newY = newHeight - (oldHeight - layer.y);
      } else if (constraints.vertical === 'center') {
        const centerOffset = layer.y + (layer.height * layer.scaleY) / 2 - oldHeight / 2;
        newY = newHeight / 2 + centerOffset - (layer.height * layer.scaleY) / 2;
      } else if (constraints.vertical === 'stretch') {
        const bottomOffset = oldHeight - (layer.y + layer.height);
        newY = layer.y;
        newH = newHeight - layer.y - bottomOffset;
      } else if (constraints.vertical === 'scale') {
        newY = (layer.y / oldHeight) * newHeight;
        newH = (layer.height / oldHeight) * newHeight;
      }

      if (constraints.proportional && constraints.horizontal !== 'stretch' && constraints.vertical !== 'stretch') {
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        const scale = Math.min(scaleX, scaleY);
        // If proportional, we might want to override the above if they were scale
        if (constraints.horizontal === 'scale' && constraints.vertical === 'scale') {
           // Already handled mostly, but let's ensure aspect ratio
        }
      }

      return {
        ...layer,
        x: newX,
        y: newY,
        width: Math.max(10, newW),
        height: Math.max(10, newH)
      };
    });

    const updates: Partial<XenoState> = {
      canvasWidth: newWidth,
      canvasHeight: newHeight,
      layers: updatedLayers
    };

    const previousState: Partial<XenoState> = {
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
      layers: state.layers
    };

    runCommand(new Commands.UpdateGlobalCommand(updates, previousState, `Apply preset: ${preset.name}`));
    addTerminalLog(`Applied preset: ${preset.name} (${newWidth}x${newHeight}) with Advanced Constraints Engine`);
  };

  const updateGlobal = (updates: Partial<XenoState>) => {
    const previousState: Partial<XenoState> = {};
    Object.keys(updates).forEach(key => {
      (previousState as any)[key] = (state as any)[key];
    });

    runCommand(new Commands.UpdateGlobalCommand(updates, previousState));
  };

  const exportCanvas = (options: { format?: 'png' | 'jpeg' | 'webp', quality?: number, pixelRatio?: number, transparent?: boolean } = {}) => {
    const { format = 'png', quality = 1, pixelRatio = 2, transparent = false } = options;
    soundService.playExport();
    
    const stage = stageRef.current?.getStage();
    if (stage) {
      const dataUrl = stage.toDataURL({
        mimeType: `image/${format}`,
        quality: quality,
        pixelRatio: pixelRatio,
      });
      
      const link = document.createElement('a');
      link.download = `xeno-extract-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
      addTerminalLog(`Extracted unit: ${format.toUpperCase()} @ ${pixelRatio}x DPI`);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setShowCommandPalette(prev => !prev);
        }
        if (e.key === 'z') {
          if (e.shiftKey) redo();
          else undo();
        }
        if (e.key === 'd') {
          e.preventDefault();
          duplicateLayers();
        }
        if (e.key === 'g') {
          e.preventDefault();
          groupLayers();
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedLayerId) removeLayer(state.selectedLayerId);
      }
      if (e.key === 'v') {
        if (state.selectedLayerId) {
          const layer = state.layers.find(l => l.id === state.selectedLayerId);
          if (layer) updateLayer(layer.id, { visible: !layer.visible });
        }
      }
      if (e.key === 'l') {
        if (state.selectedLayerId) {
          const layer = state.layers.find(l => l.id === state.selectedLayerId);
          if (layer) updateLayer(layer.id, { locked: !layer.locked });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedLayerId, undo, redo, duplicateLayers, groupLayers]);

  const commands = [
    { id: 'duplicate', label: 'Duplicate Layers', icon: <Copy size={16} />, action: duplicateLayers, category: 'Layer' },
    { id: 'group', label: 'Group Layers', icon: <Group size={16} />, action: groupLayers, category: 'Layer' },
    { id: 'align-left', label: 'Align Left', icon: <AlignLeft size={16} />, action: () => alignLayers('left', 'canvas'), category: 'Alignment' },
    { id: 'align-center', label: 'Align Center', icon: <AlignCenter size={16} />, action: () => alignLayers('center', 'canvas'), category: 'Alignment' },
    { id: 'align-right', label: 'Align Right', icon: <AlignRight size={16} />, action: () => alignLayers('right', 'canvas'), category: 'Alignment' },
    { id: 'align-top', label: 'Align Top', icon: <AlignVerticalJustifyStart size={16} />, action: () => alignLayers('top', 'canvas'), category: 'Alignment' },
    { id: 'align-middle', label: 'Align Middle', icon: <AlignVerticalJustifyCenter size={16} />, action: () => alignLayers('middle', 'canvas'), category: 'Alignment' },
    { id: 'align-bottom', label: 'Align Bottom', icon: <AlignVerticalJustifyEnd size={16} />, action: () => alignLayers('bottom', 'canvas'), category: 'Alignment' },
    { id: 'auto-layout', label: 'Auto Layout', icon: <Layout size={16} />, action: applyAutoLayout, category: 'Composition' },
    { id: 'undo', label: 'Undo', icon: <RotateCcw size={16} />, action: undo, category: 'History' },
    { id: 'redo', label: 'Redo', icon: <RotateCw size={16} />, action: redo, category: 'History' },
    { id: 'lock', label: 'Toggle Lock', icon: <Lock size={16} />, action: toggleLayerLock, category: 'Layer' },
    { id: 'snapping', label: 'Toggle Snapping', icon: <Zap size={16} />, action: () => setState(prev => ({ ...prev, snappingEnabled: !prev.snappingEnabled })), category: 'System' },
    { id: 'guides', label: 'Toggle Guides', icon: <Layout size={16} />, action: () => setState(prev => ({ ...prev, guidesEnabled: !prev.guidesEnabled })), category: 'System' },
    { id: 'terminal', label: 'Toggle Terminal', icon: <Terminal size={16} />, action: () => setShowTerminal(prev => !prev), category: 'System' },
    { id: 'export', label: 'Export Canvas', icon: <Zap size={16} />, action: () => exportCanvas(), category: 'System' },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Command Palette */}
      <XenoCommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
        commands={commands}
      />
      
      {/* Particle System */}
      <XenoParticles trigger={particleTrigger} />

      {/* Immersive Overlays */}
      <div className="grain" />
      <div className="fixed inset-0 pointer-events-none z-[100] scanlines opacity-20" />
      
      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-xeno-green/20 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              opacity: Math.random()
            }}
            animate={{ 
              y: [null, '-100px'],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <XenoBackground />
      
      <AnimatePresence>
        {isBooting ? (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            className="fixed inset-0 z-[100] bg-void flex flex-col items-center justify-center p-12"
          >
            <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="h-full bg-xeno-green shadow-[0_0_20px_#00ff41]"
                initial={{ width: 0 }}
                animate={{ width: `${bootProgress}%` }}
              />
            </div>
            <p className="font-mono text-xs text-xeno-green/60 uppercase tracking-[0.5em] glitch-text">
              Initializing Void-OS / {Math.floor(bootProgress)}%
            </p>
            <XenoSignature variant="boot" className="mt-12" />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full"
          >
            <XenoSidebar
              mode={mode}
              setMode={setMode}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              images={images}
              layers={state.layers}
              selectedLayerId={state.selectedLayerId}
              selectedLayerIds={state.selectedLayerIds}
              onSelectLayer={(id) => {
                if (id === null) {
                  setState(prev => ({ ...prev, selectedLayerId: null, selectedLayerIds: [] }));
                } else {
                  setState(prev => {
                    const isMulti = window.event && ((window.event as any).shiftKey || (window.event as any).ctrlKey || (window.event as any).metaKey);
                    let newIds = prev.selectedLayerIds;
                    if (isMulti) {
                      if (newIds.includes(id)) {
                        newIds = newIds.filter(i => i !== id);
                      } else {
                        newIds = [...newIds, id];
                      }
                    } else {
                      newIds = [id];
                    }
                    return { ...prev, selectedLayerId: id, selectedLayerIds: newIds };
                  });
                }
              }}
              onUpdateLayer={updateLayer}
              onRemoveLayer={removeLayer}
              onMoveLayer={moveLayer}
              onAddImage={addImageLayer}
              onAddText={addTextLayer}
              onAddShape={addShapeLayer}
              onExport={exportCanvas}
              onApplyPreset={applyPreset}
              onUpdateGlobal={updateGlobal}
              onBatchExport={batchExport}
              onAddMemeText={addMemeText}
              onAddWatermark={addWatermark}
              onGenerate={generateNeuralAsset}
              onGenerateBatch={generateBatchNeuralAssets}
              isGenerating={state.isGenerating || false}
              onUpdateBrush={(updates) => setState(prev => ({ ...prev, brushSettings: { ...prev.brushSettings, ...updates } }))}
              isDrawing={isDrawing}
              setIsDrawing={setIsDrawing}
              isLassoing={isLassoing}
              setIsLassoing={setIsLassoing}
              brushSettings={state.brushSettings}
              onGroupLayers={groupLayers}
              onNeuralSuggest={neuralSuggest}
              onBatchProcessNeural={batchProcessNeuralBuffer}
              onSaveToLibrary={saveToLibrary}
              onGenerateThumbnail={generateYouTubeThumbnail}
              selectedNeuralIds={state.selectedNeuralIds}
              onSelectNeural={(ids) => setState(prev => ({ ...prev, selectedNeuralIds: ids }))}
              library={state.library}
              onDuplicateLayers={duplicateLayers}
              onAlignLayers={alignLayers}
              onUndo={() => undo()}
              onRedo={() => redo()}
              onJumpToHistory={jumpToHistoryState}
              onApplyAutoLayout={applyAutoLayout}
              onToggleLayerLock={toggleLayerLock}
              onUpdateLayerEffects={updateLayerEffects}
              onSavePreset={onSavePreset}
              onApplyInpaint={applyInpaint}
              onStartRecordingMacro={startRecordingMacro}
              onStopRecordingMacro={stopRecordingMacro}
              onPlayMacro={playMacro}
              onExportAdvanced={exportCanvas}
              historyTimeline={state.historyTimeline}
              historyIndex={state.historyIndex}
              snappingEnabled={state.snappingEnabled}
              guidesEnabled={state.guidesEnabled}
              globalState={state}
            />
            
            <XenoTerminal logs={terminalLogs} visible={showTerminal} />
            
            <main className="flex-1 relative p-8 flex flex-col gap-8">
              {/* Feature Panel */}
              <XenoFeaturePanel 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onAction={(action) => {
                  if (action === 'delete') removeLayer();
                  if (action === 'duplicate') duplicateLayers();
                  if (action === 'group') groupLayers();
                  if (action === 'undo') undo();
                  if (action === 'redo') redo();
                  if (action === 'move' || action === 'transform') {
                    setActiveTab('adjust');
                  }
                }} 
              />

              {/* Top Bar - Refined Alignment */}
              <div className="flex justify-between items-center z-50 h-12">
                <div className="flex gap-4 h-full">
                  <div className="px-6 glass-toolbar rounded-xl border border-xeno-green/20 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-xeno-green animate-pulse shadow-[0_0_8px_#00ff9d]" />
                      <span className="text-[10px] font-mono text-xeno-green uppercase tracking-[0.2em] font-bold">SYSTEM STATUS: ACTIVE</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex gap-3">
                      <XenoTooltip shortcutId="undo" position="bottom">
                        <button onClick={undo} className="p-1.5 text-white/30 hover:text-xeno-green transition-all disabled:opacity-10" disabled={state.historyIndex <= 0}><RotateCcw size={14} /></button>
                      </XenoTooltip>
                      <XenoTooltip shortcutId="redo" position="bottom">
                        <button onClick={redo} className="p-1.5 text-white/30 hover:text-xeno-green transition-all disabled:opacity-10" disabled={state.historyIndex >= state.historyTimeline.length - 1}><RotateCw size={14} /></button>
                      </XenoTooltip>
                    </div>
                  </div>
                  <div className="px-6 glass-toolbar rounded-xl border border-white/5 flex items-center gap-6">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">NEURAL BUFFER: <span className="text-white font-bold">{images.length}</span> UNITS</span>
                    <div className="w-px h-4 bg-white/10" />
                    <XenoTooltip shortcutId="toggle-terminal" position="bottom">
                      <button 
                        onClick={() => setShowTerminal(!showTerminal)}
                        className={`p-1.5 transition-all rounded-lg ${showTerminal ? 'text-xeno-green bg-xeno-green/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                      >
                        <Terminal size={14} />
                      </button>
                    </XenoTooltip>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 h-full">
                  <XenoSignature variant="footer" className="opacity-80" />
                  <div 
                    className="w-12 h-12 rounded-full border border-xeno-green/20 flex items-center justify-center interactive group glass-toolbar"
                    onClick={(e) => {
                      if (e.ctrlKey) {
                        setShowGhost(true);
                        soundService.playGhost();
                        triggerParticles(e.clientX, e.clientY, 'ghost', 100);
                      }
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-xeno-green animate-pulse group-hover:bg-xeno-blue transition-colors shadow-[0_0_10px_#00ff9d]" />
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                <div className="relative" style={{ transform: `scale(${Math.min(1, (window.innerWidth - 400) / state.canvasWidth, (window.innerHeight - 200) / state.canvasHeight)})` }}>
                  <XenoCanvas
                    ref={canvasRef}
                    width={state.canvasWidth}
                    height={state.canvasHeight}
                    layers={state.layers}
                    selectedLayerId={state.selectedLayerId}
                    onSelectLayer={(id) => setState(prev => ({ ...prev, selectedLayerId: id }))}
                    onUpdateLayer={(id, updates) => {
                      const layer = state.layers.find(l => l.id === id);
                      if (!layer) return;
                      
                      const previousState: Partial<XenoLayer> = {};
                      Object.keys(updates).forEach(key => {
                        (previousState as any)[key] = (layer as any)[key];
                      });

                      runCommand(new Commands.UpdateLayerCommand(id, updates, previousState, `Update ${id}`));
                    }}
                    onDragMove={(e) => {
                      if (state.selectedLayerId) {
                        updateLayerSilent(state.selectedLayerId, { x: e.target.x(), y: e.target.y() });
                      }
                    }}
                    backgroundColor={state.backgroundColor}
                    backgroundGradient={state.backgroundGradient}
                    isDrawing={isDrawing}
                    isLassoing={isLassoing}
                    onLassoEnd={handleLassoEnd}
                    brushSettings={state.brushSettings}
                    onDrawEnd={addBrushLayer}
                    onTriggerParticles={triggerParticles}
                    snappingEnabled={state.snappingEnabled}
                    guidesEnabled={state.guidesEnabled}
                    visualEffects={state.visualEffects}
                    inpaintMask={state.inpaintMask}
                  />
                  
                  {/* Canvas Info */}
                  <div className="absolute -bottom-10 left-0 flex gap-6">
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">{state.canvasWidth} x {state.canvasHeight} PX</span>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">{state.layers.length} ACTIVE LAYERS</span>
                  </div>
                </div>
              </div>

              {/* Neural Buffer Empty State - Refined Centering & HUD */}
              {state.layers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-12 pointer-events-auto flex flex-col items-center justify-center"
                  >
                    {/* Complex HUD Reticle */}
                    <div className="relative w-64 h-64 flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-dashed border-xeno-green/20 rounded-full"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }} 
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 border-2 border-xeno-green/10 rounded-full border-t-xeno-green/40 border-b-xeno-green/40"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }} 
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-12 border border-white/5 rounded-full flex items-center justify-center"
                      >
                        <Plus size={40} className="text-xeno-green/40 neon-glow" />
                      </motion.div>
                      
                      {/* HUD Accents */}
                      {[0, 90, 180, 270].map(deg => (
                        <div 
                          key={deg} 
                          className="absolute w-1 h-8 bg-xeno-green/30" 
                          style={{ 
                            transform: `rotate(${deg}deg) translateY(-120px)`,
                            transformOrigin: 'center'
                          }} 
                        />
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-4xl font-mono font-black uppercase tracking-tighter text-white/40 glitch-text">Neural Buffer Empty</h2>
                      <p className="text-[11px] font-mono text-white/60 uppercase tracking-[0.5em] font-medium">Feed the system to begin processing</p>
                    </div>

                    <label className="inline-block px-12 py-4 glass-card text-xeno-green font-mono text-[11px] uppercase tracking-[0.4em] hover:scale-105 transition-all interactive cursor-pointer group">
                      <span className="relative z-10 group-hover:neon-glow transition-all">Initialize Upload</span>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(addImageLayer);
                      }} />
                    </label>
                  </motion.div>
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGhost && (
          <XenoSignature 
            variant="ghost" 
            onAnimationComplete={() => setShowGhost(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
