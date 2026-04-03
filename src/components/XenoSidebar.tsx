import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize, 
  Sliders, 
  Type, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Plus,
  Zap,
  Youtube,
  UserCircle,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  Sparkles,
  Circle,
  Square,
  Ghost,
  Skull,
  Activity,
  Zap as ZapIcon,
  ChevronUp,
  ChevronDown,
  PenTool,
  Eraser,
  Share2,
  Layout,
  Grid,
  Scissors,
  Bold,
  Italic,
  Underline,
  Type as TypeIcon,
  Copy,
  Group,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  History as HistoryIcon,
  Play
} from 'lucide-react';
import { XenoLayer, XenoMode, XENO_PRESETS, XenoImage, DEFAULT_FILTERS, XenoState } from '../types';
import XenoButton from './XenoButton';
import XenoSlider from './XenoSlider';
import XenoTooltip from './XenoTooltip';
import { XenoHistory } from './XenoHistory';
import { soundService } from '../services/soundService';

interface XenoSidebarProps {
  mode: XenoMode;
  setMode: (mode: XenoMode) => void;
  images: XenoImage[];
  layers: XenoLayer[];
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<XenoLayer>) => void;
  onRemoveLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddImage: (file: File) => void;
  onAddText: () => void;
  onAddShape: (type: 'rect' | 'circle' | 'polygon') => void;
  onExport: () => void;
  onApplyPreset: (preset: any) => void;
  onUpdateGlobal: (updates: Partial<XenoState>) => void;
  onBatchExport: () => void;
  onAddMemeText: () => void;
  onAddWatermark: () => void;
  onGenerate: (prompt: string) => void;
  onGenerateBatch: (prompt: string, count: number) => void;
  isGenerating: boolean;
  onUpdateBrush: (updates: Partial<XenoState['brushSettings']>) => void;
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  isLassoing: boolean;
  setIsLassoing: (val: boolean) => void;
  brushSettings: XenoState['brushSettings'];
  onGroupLayers: () => void;
  onNeuralSuggest: () => void;
  onBatchProcessNeural: (action: 'tag' | 'delete' | 'add-to-canvas', value?: any) => void;
  onSaveToLibrary: (id: string) => void;
  onGenerateThumbnail: (text: string, style: string) => void;
  selectedNeuralIds: string[];
  onSelectNeural: (ids: string[]) => void;
  library: XenoImage[];
  onDuplicateLayers: () => void;
  onAlignLayers: (type: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle', relativeTo: 'canvas' | 'selection') => void;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToHistory: (index: number) => void;
  onApplyAutoLayout: () => void;
  onToggleLayerLock: (id: string) => void;
  onUpdateLayerEffects: (id: string, effects: any[]) => void;
  onSavePreset: (name: string) => void;
  onApplyInpaint?: () => void;
  onStartRecordingMacro: () => void;
  onStopRecordingMacro: (name: string) => void;
  onPlayMacro: (id: string) => void;
  onExportAdvanced: (options: any) => void;
  activeTab: 'layers' | 'adjust' | 'presets' | 'neural' | 'global' | 'draw' | 'social' | 'yt' | 'history' | 'macros' | 'text' | 'export';
  setActiveTab: (tab: any) => void;
  historyTimeline: any[];
  historyIndex: number;
  snappingEnabled: boolean;
  guidesEnabled: boolean;
  globalState: XenoState;
}

export default function XenoSidebar({
  mode,
  setMode,
  images,
  layers,
  selectedLayerId,
  selectedLayerIds,
  onSelectLayer,
  onUpdateLayer,
  onRemoveLayer,
  onMoveLayer,
  onAddImage,
  onAddText,
  onAddShape,
  onExport,
  onApplyPreset,
  onUpdateGlobal,
  onBatchExport,
  onAddMemeText,
  onAddWatermark,
  onGenerate,
  onGenerateBatch,
  isGenerating,
  onUpdateBrush,
  isDrawing,
  setIsDrawing,
  isLassoing,
  setIsLassoing,
  brushSettings,
  onGroupLayers,
  onNeuralSuggest,
  onBatchProcessNeural,
  onSaveToLibrary,
  onGenerateThumbnail,
  selectedNeuralIds,
  onSelectNeural,
  library,
  onDuplicateLayers,
  onAlignLayers,
  onUndo,
  onRedo,
  onJumpToHistory,
  onApplyAutoLayout,
  onToggleLayerLock,
  onUpdateLayerEffects,
  onSavePreset,
  onApplyInpaint,
  onStartRecordingMacro,
  onStopRecordingMacro,
  onPlayMacro,
  onExportAdvanced,
  activeTab,
  setActiveTab,
  historyTimeline,
  historyIndex,
  snappingEnabled,
  guidesEnabled,
  globalState
}: XenoSidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [ytText, setYtText] = useState('');
  const [ytStyle, setYtStyle] = useState('Cyberpunk');
  const [presetName, setPresetName] = useState('');
  const [macroName, setMacroName] = useState('');
  const [exportOptions, setExportOptions] = useState({ format: 'png', quality: 1, pixelRatio: 2 });
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const tabs = [
    { id: 'neural', icon: Zap, label: 'Buffer' },
    { id: 'yt', icon: Youtube, label: 'YouTube' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'draw', icon: PenTool, label: 'Draw' },
    { id: 'adjust', icon: Sparkles, label: 'Effects' },
    { id: 'macros', icon: ZapIcon, label: 'Macros' },
    { id: 'history', icon: HistoryIcon, label: 'History' },
    { id: 'export', icon: Download, label: 'Export' },
    { id: 'global', icon: Palette, label: 'Global' },
    { id: 'presets', icon: Maximize, label: 'Presets' },
  ];

  return (
    <div className="w-80 h-full glass-toolbar border-r border-white/5 flex flex-col z-50 animate-breathe">
      {/* Header */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-xeno-green/10 border border-xeno-green/30 flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 rounded-full bg-xeno-green shadow-[0_0_15px_#00ff9d]" />
          </div>
          <div>
            <h1 className="text-xl font-mono font-bold text-white uppercase tracking-tighter glitch-text">VOID-OS</h1>
            <p className="text-[8px] font-mono text-xeno-green/80 uppercase tracking-[0.4em]">Neural Image Processor</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1 bg-void/60 rounded-xl border border-white/5">
          <XenoTooltip shortcutId="mode-quick" position="bottom" className="flex-1">
            <XenoButton 
              onClick={() => {
                setMode('QUICK');
                soundService.playToggle();
              }}
              variant={mode === 'QUICK' ? 'primary' : 'ghost'}
              className="w-full py-2 text-[10px] tracking-widest"
            >
              <Zap size={12} /> QUICK
            </XenoButton>
          </XenoTooltip>
          <XenoTooltip shortcutId="mode-editor" position="bottom" className="flex-1">
            <XenoButton 
              onClick={() => {
                setMode('EDITOR');
                soundService.playToggle();
              }}
              variant={mode === 'EDITOR' ? 'primary' : 'ghost'}
              className="w-full py-2 text-[10px] tracking-widest"
            >
              <Sliders size={12} /> EDITOR
            </XenoButton>
          </XenoTooltip>
        </div>
      </div>

      {/* Tabs - Refined for spacing */}
      <div className="grid grid-cols-4 border-b border-white/5 bg-void/20">
        {tabs.map(tab => (
          <XenoTooltip key={tab.id} shortcutId={`mode-${tab.id}`} position="bottom">
            <button
              onClick={() => {
                setActiveTab(tab.id as any);
                soundService.playClick();
              }}
              onMouseEnter={() => soundService.playHover()}
              className={`w-full flex flex-col items-center justify-center gap-2 py-4 transition-all border-r border-b border-white/5 last:border-r-0 ${activeTab === tab.id ? 'text-xeno-green bg-xeno-green/5' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'neon-glow' : ''} />
              <span className="text-[7px] font-sans font-semibold uppercase tracking-[0.2em] leading-none">{tab.label}</span>
            </button>
          </XenoTooltip>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'neural' && (
            <motion.div 
              key="neural"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Neural Synthesis Section - Refined Glassmorphism */}
              <div className="space-y-4 p-6 rounded-2xl glass-card">
                <div className="flex items-center gap-3">
                  <Sparkles size={14} className="text-xeno-green neon-glow" />
                  <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em]">Neural Synthesis</span>
                </div>
                <div className="space-y-4">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the xeno-asset..."
                    className="w-full h-28 bg-void/40 border border-white/10 rounded-xl p-4 text-[11px] font-mono text-white focus:border-xeno-green/50 outline-none transition-all resize-none placeholder:text-white/20"
                  />
                  <div className="flex gap-3">
                    <XenoTooltip shortcutId="neural-generate" position="top" className="flex-1">
                      <XenoButton 
                        onClick={() => {
                          onGenerate(prompt);
                          setPrompt('');
                        }}
                        disabled={isGenerating || !prompt}
                        className="w-full py-3 text-[10px] tracking-widest"
                      >
                        {isGenerating ? 'SYNTHESIZING...' : 'SINGLE UNIT'}
                      </XenoButton>
                    </XenoTooltip>
                    <XenoButton 
                      onClick={() => {
                        onGenerateBatch(prompt, 4);
                        setPrompt('');
                      }}
                      disabled={isGenerating || !prompt}
                      variant="ghost"
                      className="flex-1 py-3 text-[10px] tracking-widest border border-white/5"
                    >
                      BATCH (4)
                    </XenoButton>
                  </div>
                </div>
              </div>

              {/* Buffer Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                      {showLibrary ? 'Library' : 'Neural Buffer'}
                    </span>
                    <XenoTooltip content={showLibrary ? 'Switch to Neural Buffer' : 'Switch to Library'} position="right">
                      <button 
                        onClick={() => setShowLibrary(!showLibrary)}
                        className={`p-1 rounded transition-colors ${showLibrary ? 'text-xeno-green bg-xeno-green/10' : 'text-white/20 hover:text-white/40'}`}
                      >
                        <Layers size={12} />
                      </button>
                    </XenoTooltip>
                  </div>
                  <span className="text-[10px] font-mono text-xeno-green">
                    {(showLibrary ? library : images).length} Units
                  </span>
                </div>

                <div className="px-2">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tags or IDs..."
                    className="w-full bg-void/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-xeno-green/40 transition-all"
                  />
                </div>

                {selectedNeuralIds.length > 0 && (
                  <div className="flex gap-2 px-2 animate-in fade-in slide-in-from-top-2">
                    <XenoButton 
                      onClick={() => onBatchProcessNeural('add-to-canvas')}
                      variant="primary"
                      className="flex-1 py-2 text-[8px]"
                    >
                      Add ({selectedNeuralIds.length})
                    </XenoButton>
                    <XenoButton 
                      onClick={() => {
                        const tag = prompt || 'untagged';
                        onBatchProcessNeural('tag', tag);
                      }}
                      variant="ghost"
                      className="flex-1 py-2 text-[8px]"
                    >
                      Tag
                    </XenoButton>
                    <XenoButton 
                      onClick={() => onBatchProcessNeural('delete')}
                      variant="ghost"
                      className="flex-1 py-2 text-[8px] text-red-500 hover:bg-red-500/10"
                    >
                      Delete
                    </XenoButton>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(showLibrary ? library : images)
                  .filter(img => 
                    img.id.includes(searchQuery) || 
                    img.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map(img => (
                  <motion.div
                    key={img.id}
                    onClick={(e) => {
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        const newSelection = selectedNeuralIds.includes(img.id)
                          ? selectedNeuralIds.filter(id => id !== img.id)
                          : [...selectedNeuralIds, img.id];
                        onSelectNeural(newSelection);
                      } else {
                        onAddImage(img.file);
                      }
                    }}
                    className={`group relative aspect-square rounded-xl border transition-all overflow-hidden interactive ${
                      selectedNeuralIds.includes(img.id) ? 'border-xeno-green ring-1 ring-xeno-green' : 'border-white/5 bg-void/40'
                    }`}
                  >
                    <img src={img.preview} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Tags overlay */}
                    {img.tags && img.tags.length > 0 && (
                      <div className="absolute top-1 left-1 flex flex-wrap gap-1">
                        {img.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[6px] font-mono bg-void/80 text-xeno-green px-1 rounded border border-xeno-green/20 uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-void/60 gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddImage(img.file);
                          }}
                          className="p-2 rounded-full bg-xeno-green/20 text-xeno-green hover:bg-xeno-green/40 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveToLibrary(img.id);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            img.isLibrary ? 'bg-xeno-green text-void' : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                      <span className="text-[8px] font-mono text-white/40 uppercase">
                        {selectedNeuralIds.includes(img.id) ? 'Selected' : 'Click to Add'}
                      </span>
                    </div>
                  </motion.div>
                ))}
                <label className="aspect-square rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-xeno-green hover:border-xeno-green/40 transition-all interactive">
                  <Plus size={20} />
                  <span className="text-[8px] font-mono uppercase">Feed System</span>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(onAddImage);
                  }} />
                </label>
              </div>
            </motion.div>
          )}

          {activeTab === 'yt' && (
            <motion.div 
              key="yt"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <Youtube size={14} className="text-red-500" />
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">YouTube Thumbnail Gen</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Video Title</span>
                    <textarea 
                      value={ytText}
                      onChange={(e) => setYtText(e.target.value)}
                      placeholder="Enter video title..."
                      className="w-full h-20 bg-void/60 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white focus:border-red-500 outline-none transition-all resize-none placeholder:text-white/10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Visual Style</span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Cyberpunk', 'Horror', 'Minimalist', 'Vibrant', 'Dark Tech', 'Retro'].map(style => (
                        <XenoButton 
                          key={style}
                          onClick={() => setYtStyle(style)}
                          variant={ytStyle === style ? 'primary' : 'ghost'}
                          className={`py-2 text-[8px] ${ytStyle === style ? 'bg-red-500 border-red-500' : ''}`}
                        >
                          {style}
                        </XenoButton>
                      ))}
                    </div>
                  </div>

                  <XenoButton 
                    onClick={() => onGenerateThumbnail(ytText, ytStyle)}
                    disabled={isGenerating || !ytText}
                    className="w-full py-3 text-[10px] bg-red-600 hover:bg-red-500 border-red-600"
                  >
                    {isGenerating ? 'Synthesizing...' : 'Generate Thumbnail'}
                  </XenoButton>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[8px] font-mono text-white/40 leading-relaxed">
                  This engine will generate a high-impact background and overlay your title with optimized typography and glow effects.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'text' && (
            <motion.div 
              key="text"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {selectedLayer?.type === 'text' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Text Content</span>
                    <textarea 
                      value={selectedLayer.data.text}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, text: e.target.value } })}
                      className="w-full h-24 bg-void/60 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white focus:border-xeno-green outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Font Family</span>
                      <select 
                        value={selectedLayer.data.fontFamily || 'Inter'}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fontFamily: e.target.value } })}
                        className="w-full bg-void/40 border border-white/10 rounded-lg p-1.5 text-[9px] font-mono text-white outline-none"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Orbitron">Orbitron</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Anton">Anton</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Outfit">Outfit</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Color</span>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={selectedLayer.data.fill || '#ffffff'}
                          onChange={(e) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fill: e.target.value } })}
                          className="w-full h-8 bg-void/40 border border-white/10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <XenoSlider 
                    label="Font Size" 
                    value={selectedLayer.data.fontSize} 
                    min={8} 
                    max={300} 
                    onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fontSize: v } })} 
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <XenoSlider 
                      label="Line Height" 
                      value={selectedLayer.data.lineHeight || 1} 
                      min={0.5} 
                      max={3} 
                      step={0.1}
                      onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, lineHeight: v } })} 
                    />
                    <XenoSlider 
                      label="Letter Spacing" 
                      value={selectedLayer.data.letterSpacing || 0} 
                      min={-10} 
                      max={50} 
                      onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, letterSpacing: v } })} 
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Alignment</span>
                    <div className="flex gap-2">
                      <XenoButton 
                        onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, align: 'left' } })}
                        variant={selectedLayer.data.align === 'left' ? 'primary' : 'ghost'}
                        className="flex-1 py-2"
                      >
                        <AlignLeft size={14} />
                      </XenoButton>
                      <XenoButton 
                        onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, align: 'center' } })}
                        variant={selectedLayer.data.align === 'center' ? 'primary' : 'ghost'}
                        className="flex-1 py-2"
                      >
                        <AlignCenter size={14} />
                      </XenoButton>
                      <XenoButton 
                        onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, align: 'right' } })}
                        variant={selectedLayer.data.align === 'right' ? 'primary' : 'ghost'}
                        className="flex-1 py-2"
                      >
                        <AlignRight size={14} />
                      </XenoButton>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Text Effects</span>
                    
                    {/* Curved Text */}
                    <div className="space-y-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-white uppercase tracking-widest">Curved Path</span>
                        <button 
                          onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, curved: !selectedLayer.data.curved } })}
                          className={`p-1 rounded transition-all ${selectedLayer.data.curved ? 'text-xeno-green bg-xeno-green/10' : 'text-white/20'}`}
                        >
                          <RotateCw size={12} />
                        </button>
                      </div>
                      {selectedLayer.data.curved && (
                        <XenoSlider 
                          label="Curve Radius" 
                          value={selectedLayer.data.curveRadius || 200} 
                          min={50} 
                          max={1000} 
                          onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, curveRadius: v } })} 
                        />
                      )}
                    </div>

                    {/* Glow Effect */}
                    <div className="space-y-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-white uppercase tracking-widest">Neural Glow</span>
                        <button 
                          onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, glow: { ...selectedLayer.data.glow, enabled: !selectedLayer.data.glow?.enabled } } })}
                          className={`p-1 rounded transition-all ${selectedLayer.data.glow?.enabled ? 'text-xeno-green bg-xeno-green/10' : 'text-white/20'}`}
                        >
                          <Sparkles size={12} />
                        </button>
                      </div>
                      {selectedLayer.data.glow?.enabled && (
                        <div className="space-y-4">
                          <XenoSlider 
                            label="Glow Intensity" 
                            value={selectedLayer.data.glow.blur || 20} 
                            min={0} 
                            max={100} 
                            onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, glow: { ...selectedLayer.data.glow, blur: v } } })} 
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Glow Color</span>
                            <input 
                              type="color" 
                              value={selectedLayer.data.glow.color || selectedLayer.data.fill}
                              onChange={(e) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, glow: { ...selectedLayer.data.glow, color: e.target.value } } })}
                              className="w-8 h-8 bg-void/40 border border-white/10 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Text Shadow */}
                    <div className="space-y-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-white uppercase tracking-widest">Drop Shadow</span>
                        <button 
                          onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, shadow: { ...selectedLayer.data.shadow, enabled: !selectedLayer.data.shadow?.enabled } } })}
                          className={`p-1 rounded transition-all ${selectedLayer.data.shadow?.enabled ? 'text-xeno-green bg-xeno-green/10' : 'text-white/20'}`}
                        >
                          <Layout size={12} />
                        </button>
                      </div>
                      {selectedLayer.data.shadow?.enabled && (
                        <div className="space-y-4">
                          <XenoSlider 
                            label="Blur" 
                            value={selectedLayer.data.shadow.blur || 5} 
                            min={0} 
                            max={50} 
                            onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, shadow: { ...selectedLayer.data.shadow, blur: v } } })} 
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <XenoSlider 
                              label="Offset X" 
                              value={selectedLayer.data.shadow.offsetX || 2} 
                              min={-20} 
                              max={20} 
                              onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, shadow: { ...selectedLayer.data.shadow, offsetX: v } } })} 
                            />
                            <XenoSlider 
                              label="Offset Y" 
                              value={selectedLayer.data.shadow.offsetY || 2} 
                              min={-20} 
                              max={20} 
                              onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, shadow: { ...selectedLayer.data.shadow, offsetY: v } } })} 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chromatic Aberration */}
                    <div className="space-y-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-white uppercase tracking-widest">Chromatic Aberration</span>
                        <button 
                          onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, chromaticAberration: { ...selectedLayer.data.chromaticAberration, enabled: !selectedLayer.data.chromaticAberration?.enabled } } })}
                          className={`p-1 rounded transition-all ${selectedLayer.data.chromaticAberration?.enabled ? 'text-xeno-blue bg-xeno-blue/10' : 'text-white/20'}`}
                        >
                          <Activity size={12} />
                        </button>
                      </div>
                      {selectedLayer.data.chromaticAberration?.enabled && (
                        <XenoSlider 
                          label="Offset" 
                          value={selectedLayer.data.chromaticAberration.offset || 2} 
                          min={0} 
                          max={20} 
                          onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, chromaticAberration: { ...selectedLayer.data.chromaticAberration, offset: v } } })} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <Type size={32} className="mx-auto text-white/10" />
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Select a text layer to edit</p>
                  <XenoButton onClick={onAddText} variant="primary" className="py-2 px-6 text-[10px]">
                    Create New Text
                  </XenoButton>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'export' && (
            <motion.div 
              key="export"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Download size={14} className="text-xeno-green" />
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">Advanced Export</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Format</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['png', 'jpeg', 'webp'].map(fmt => (
                        <XenoButton 
                          key={fmt}
                          onClick={() => setExportOptions({ ...exportOptions, format: fmt })}
                          variant={exportOptions.format === fmt ? 'primary' : 'ghost'}
                          className="py-2 text-[10px] uppercase"
                        >
                          {fmt}
                        </XenoButton>
                      ))}
                    </div>
                  </div>

                  <XenoSlider 
                    label="Quality" 
                    value={exportOptions.quality} 
                    min={0.1} 
                    max={1} 
                    step={0.1}
                    onChange={(v) => setExportOptions({ ...exportOptions, quality: v })} 
                  />

                  <XenoSlider 
                    label="Pixel Ratio (DPI)" 
                    value={exportOptions.pixelRatio} 
                    min={1} 
                    max={4} 
                    step={1}
                    onChange={(v) => setExportOptions({ ...exportOptions, pixelRatio: v })} 
                  />

                  <XenoButton 
                    onClick={() => onExportAdvanced(exportOptions)}
                    className="w-full py-4 text-[12px] font-bold tracking-[0.2em]"
                  >
                    EXTRACT UNIT
                  </XenoButton>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-xeno-green/5 border border-xeno-green/20">
                <p className="text-[8px] font-mono text-xeno-green/60 leading-relaxed uppercase tracking-widest">
                  System will process all active layers and neural enhancements into a high-fidelity extract.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'layers' && (
            <motion.div 
              key="layers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2"
            >
              <div className="flex flex-wrap gap-2 mb-4">
                <XenoTooltip content="Add Text" shortcutId="add-text" position="top" className="flex-1">
                  <XenoButton onClick={() => { onAddText(); soundService.playCanvas(); }} variant="ghost" className="w-full py-1 text-[8px]">
                    <Type size={12} /> Text
                  </XenoButton>
                </XenoTooltip>
                <XenoTooltip content="Add Rectangle" shortcutId="add-rect" position="top" className="flex-1">
                  <XenoButton onClick={() => { onAddShape('rect'); soundService.playCanvas(); }} variant="ghost" className="w-full py-1 text-[8px]">
                    <Square size={12} /> Rect
                  </XenoButton>
                </XenoTooltip>
                <XenoTooltip content="Add Circle" shortcutId="add-circle" position="top" className="flex-1">
                  <XenoButton onClick={() => { onAddShape('circle'); soundService.playCanvas(); }} variant="ghost" className="w-full py-1 text-[8px]">
                    <Circle size={12} /> Circ
                  </XenoButton>
                </XenoTooltip>
                <XenoTooltip shortcutId="duplicate" position="top" className="flex-1">
                  <XenoButton onClick={() => { onDuplicateLayers(); soundService.playCanvas(); }} variant="ghost" className="w-full py-1 text-[8px]">
                    <Copy size={12} /> Dup
                  </XenoButton>
                </XenoTooltip>
                <XenoTooltip shortcutId="group" position="top" className="flex-1">
                  <XenoButton onClick={() => { onGroupLayers(); soundService.playCanvas(); }} variant="ghost" className="w-full py-1 text-[8px]">
                    <Group size={12} /> Group
                  </XenoButton>
                </XenoTooltip>
                <XenoTooltip content="Auto Layout" position="top" className="flex-1">
                  <XenoButton onClick={() => { onApplyAutoLayout(); soundService.playCanvas(); }} variant="ghost" className="w-full py-1 text-[8px]">
                    <Layout size={12} /> Auto
                  </XenoButton>
                </XenoTooltip>
              </div>

              {layers.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">No active layers</p>
                </div>
              ) : (
                layers.map((layer, index) => (
                  <div
                    key={layer.id}
                    onClick={() => {
                      onSelectLayer(layer.id);
                      soundService.playClick();
                    }}
                    onMouseEnter={() => soundService.playHover()}
                    className={`group flex items-center gap-3 p-2 rounded-xl border transition-all ${selectedLayerIds.includes(layer.id) ? 'bg-xeno-green/5 border-xeno-green/40' : 'bg-void/40 border-white/5 hover:border-white/10'}`}
                  >
                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-mono text-white/40">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-white truncate uppercase">{layer.name}</p>
                      <p className="text-[8px] font-mono text-white/40 uppercase">{layer.type}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }}
                        className="p-1 text-white/40 hover:text-xeno-green"
                        title="Move Up"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }}
                        className="p-1 text-white/40 hover:text-xeno-green"
                        title="Move Down"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { visible: !layer.visible }); }} className="p-1 text-white/40 hover:text-white">
                        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onToggleLayerLock(layer.id); }} className="p-1 text-white/40 hover:text-white">
                        {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                      <XenoTooltip shortcutId="delete" position="left">
                        <button onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }} className="p-1 text-white/40 hover:text-xeno-red">
                          <Trash2 size={12} />
                        </button>
                      </XenoTooltip>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'adjust' && selectedLayer && (
            <motion.div 
              key="adjust"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Alignment Tools */}
              <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Alignment</span>
                <div className="grid grid-cols-3 gap-2">
                  <XenoTooltip shortcutId="align-left" position="top">
                    <XenoButton onClick={() => onAlignLayers('left', 'canvas')} variant="ghost" className="w-full py-2">
                      <AlignLeft size={14} />
                    </XenoButton>
                  </XenoTooltip>
                  <XenoTooltip shortcutId="align-center" position="top">
                    <XenoButton onClick={() => onAlignLayers('center', 'canvas')} variant="ghost" className="w-full py-2">
                      <AlignCenter size={14} />
                    </XenoButton>
                  </XenoTooltip>
                  <XenoTooltip shortcutId="align-right" position="top">
                    <XenoButton onClick={() => onAlignLayers('right', 'canvas')} variant="ghost" className="w-full py-2">
                      <AlignRight size={14} />
                    </XenoButton>
                  </XenoTooltip>
                  <XenoButton onClick={() => onAlignLayers('top', 'canvas')} variant="ghost" className="py-2">
                    <AlignVerticalJustifyStart size={14} />
                  </XenoButton>
                  <XenoButton onClick={() => onAlignLayers('middle', 'canvas')} variant="ghost" className="py-2">
                    <AlignVerticalJustifyCenter size={14} />
                  </XenoButton>
                  <XenoButton onClick={() => onAlignLayers('bottom', 'canvas')} variant="ghost" className="py-2">
                    <AlignVerticalJustifyEnd size={14} />
                  </XenoButton>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Transform</span>
                <div className="grid grid-cols-2 gap-2">
                  <XenoButton onClick={() => onUpdateLayer(selectedLayer.id, { rotation: (selectedLayer.rotation - 90) % 360 })} variant="ghost" className="py-1">
                    <RotateCcw size={12} /> -90°
                  </XenoButton>
                  <XenoButton onClick={() => onUpdateLayer(selectedLayer.id, { rotation: (selectedLayer.rotation + 90) % 360 })} variant="ghost" className="py-1">
                    <RotateCw size={12} /> +90°
                  </XenoButton>
                  <XenoButton onClick={() => onUpdateLayer(selectedLayer.id, { scaleX: selectedLayer.scaleX * -1 })} variant="ghost" className="py-1">
                    <FlipHorizontal size={12} /> Flip H
                  </XenoButton>
                  <XenoButton onClick={() => onUpdateLayer(selectedLayer.id, { scaleY: selectedLayer.scaleY * -1 })} variant="ghost" className="py-1">
                    <FlipVertical size={12} /> Flip V
                  </XenoButton>
                </div>
                <XenoSlider label="Opacity" value={selectedLayer.opacity} min={0} max={1} step={0.1} onChange={(v) => onUpdateLayer(selectedLayer.id, { opacity: v })} />
                
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Constraints</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Horizontal</span>
                      <select 
                        value={selectedLayer.constraints?.horizontal || 'scale'}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { constraints: { ...selectedLayer.constraints!, horizontal: e.target.value as any } })}
                        className="w-full bg-void/40 border border-white/10 rounded-lg p-1.5 text-[9px] font-mono text-white outline-none"
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="center">Center</option>
                        <option value="stretch">Stretch</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Vertical</span>
                      <select 
                        value={selectedLayer.constraints?.vertical || 'scale'}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { constraints: { ...selectedLayer.constraints!, vertical: e.target.value as any } })}
                        className="w-full bg-void/40 border border-white/10 rounded-lg p-1.5 text-[9px] font-mono text-white outline-none"
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="center">Center</option>
                        <option value="stretch">Stretch</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Neural Optimization</span>
                    <XenoButton 
                      onClick={onNeuralSuggest}
                      variant="primary"
                      className="py-1 px-3 text-[8px]"
                    >
                      <Sparkles size={12} className="mr-2" /> Optimize
                    </XenoButton>
                  </div>
                  <p className="text-[8px] font-mono text-white/20 uppercase">AI-assisted content-aware enhancements for color, glow, and clarity.</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Blend Mode</span>
                  <select 
                    value={selectedLayer.blendMode || 'normal'}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { blendMode: e.target.value as any })}
                    className="w-full bg-void/40 border border-white/10 rounded-xl p-2 text-[10px] font-mono text-white outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="darken">Darken</option>
                    <option value="lighten">Lighten</option>
                    <option value="color-dodge">Color Dodge</option>
                    <option value="color-burn">Color Burn</option>
                    <option value="hard-light">Hard Light</option>
                    <option value="soft-light">Soft Light</option>
                    <option value="difference">Difference</option>
                    <option value="exclusion">Exclusion</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Animation</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['none', 'pulse', 'flicker', 'glitch'].map(anim => (
                      <XenoButton 
                        key={anim}
                        onClick={() => onUpdateLayer(selectedLayer.id, { animation: anim as any })}
                        variant={selectedLayer.animation === anim ? 'primary' : 'ghost'}
                        className="py-1 text-[8px]"
                      >
                        {anim}
                      </XenoButton>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Neural Masking</span>
                    <button 
                      onClick={() => onUpdateLayer(selectedLayer.id, { 
                        mask: { 
                          enabled: !selectedLayer.mask?.enabled,
                          type: selectedLayer.mask?.type || 'circle',
                          x: selectedLayer.mask?.x ?? selectedLayer.width / 2,
                          y: selectedLayer.mask?.y ?? selectedLayer.height / 2,
                          width: selectedLayer.mask?.width ?? selectedLayer.width / 2,
                          height: selectedLayer.mask?.height ?? selectedLayer.height / 2,
                          rotation: selectedLayer.mask?.rotation ?? 0
                        } 
                      })}
                      className={`p-1 rounded-lg border transition-all ${selectedLayer.mask?.enabled ? 'bg-xeno-green/20 border-xeno-green/40 text-xeno-green' : 'bg-void/40 border-white/5 text-white/40'}`}
                    >
                      <Scissors size={12} />
                    </button>
                  </div>

                  {selectedLayer.mask?.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {['circle', 'rect', 'star'].map(type => (
                          <XenoButton 
                            key={type}
                            onClick={() => onUpdateLayer(selectedLayer.id, { mask: { ...selectedLayer.mask!, type: type as any } })}
                            variant={selectedLayer.mask?.type === type ? 'primary' : 'ghost'}
                            className="py-1 text-[8px]"
                          >
                            {type === 'circle' ? <Circle size={10} /> : type === 'rect' ? <Square size={10} /> : <Sparkles size={10} />}
                            {type}
                          </XenoButton>
                        ))}
                      </div>
                      
                      <XenoSlider 
                        label="Mask X" 
                        value={selectedLayer.mask.x} 
                        min={0} 
                        max={selectedLayer.width} 
                        onChange={(v) => onUpdateLayer(selectedLayer.id, { mask: { ...selectedLayer.mask!, x: v } })} 
                      />
                      <XenoSlider 
                        label="Mask Y" 
                        value={selectedLayer.mask.y} 
                        min={0} 
                        max={selectedLayer.height} 
                        onChange={(v) => onUpdateLayer(selectedLayer.id, { mask: { ...selectedLayer.mask!, y: v } })} 
                      />
                      <XenoSlider 
                        label="Mask Size" 
                        value={selectedLayer.mask.width} 
                        min={10} 
                        max={Math.max(selectedLayer.width, selectedLayer.height)} 
                        onChange={(v) => onUpdateLayer(selectedLayer.id, { mask: { ...selectedLayer.mask!, width: v, height: v } })} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {selectedLayer.type === 'image' && selectedLayer.filters && (
                <div className="space-y-6">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Filters</span>
                  <XenoSlider label="Brightness" value={selectedLayer.filters.brightness} min={-100} max={100} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, brightness: v } })} />
                  <XenoSlider label="Contrast" value={selectedLayer.filters.contrast} min={-100} max={100} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, contrast: v } })} />
                  <XenoSlider label="Saturation" value={selectedLayer.filters.saturation} min={-100} max={100} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, saturation: v } })} />
                  <XenoSlider label="Hue" value={selectedLayer.filters.hue} min={0} max={360} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, hue: v } })} />
                  <XenoSlider label="Blur" value={selectedLayer.filters.blur} min={0} max={20} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, blur: v } })} />
                  <XenoSlider label="Pixelate" value={selectedLayer.filters.pixelate} min={0} max={20} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, pixelate: v } })} />
                  <XenoSlider label="Sharpen" value={selectedLayer.filters.sharpen} min={0} max={20} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, sharpen: v } })} />
                  <XenoSlider label="Vignette" value={selectedLayer.filters.vignette} min={0} max={1} step={0.1} onChange={(v) => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, vignette: v } })} />
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-void/40 border border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Grayscale</span>
                    <button 
                      onClick={() => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, grayscale: !selectedLayer.filters?.grayscale } })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${selectedLayer.filters.grayscale ? 'bg-xeno-green' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"
                        animate={{ x: selectedLayer.filters.grayscale ? 20 : 0 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-void/40 border border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Chroma Key (Green)</span>
                    <button 
                      onClick={() => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, chromaKey: selectedLayer.filters?.chromaKey ? undefined : '#00ff00' } })}
                      className={`w-10 h-5 rounded-full transition-colors relative ${selectedLayer.filters.chromaKey ? 'bg-xeno-green' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"
                        animate={{ x: selectedLayer.filters.chromaKey ? 20 : 0 }}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <XenoButton 
                      onClick={() => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, invert: !selectedLayer.filters?.invert } })}
                      variant={selectedLayer.filters.invert ? 'primary' : 'ghost'}
                      className="py-2 text-[8px]"
                    >
                      Invert
                    </XenoButton>
                    <XenoButton 
                      onClick={() => onUpdateLayer(selectedLayer.id, { filters: { ...selectedLayer.filters!, sepia: !selectedLayer.filters?.sepia } })}
                      variant={selectedLayer.filters.sepia ? 'primary' : 'ghost'}
                      className="py-2 text-[8px]"
                    >
                      Sepia
                    </XenoButton>
                  </div>

                  {/* Effects Stack */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Effects Stack</span>
                      <XenoButton 
                        onClick={() => {
                          const newEffect = { id: Math.random().toString(36).substr(2, 9), type: 'glow', intensity: 0.5, enabled: true };
                          onUpdateLayerEffects(selectedLayer.id, [...(selectedLayer.effectsStack || []), newEffect]);
                        }}
                        variant="ghost"
                        className="py-1 px-2 text-[8px]"
                      >
                        <Plus size={10} className="mr-1" /> Add
                      </XenoButton>
                    </div>
                    <div className="space-y-2">
                      {(selectedLayer.effectsStack || []).map((effect, idx) => (
                        <div key={effect.id} className="p-3 rounded-xl bg-void/40 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <select 
                              value={effect.type}
                              onChange={(e) => {
                                const newStack = [...selectedLayer.effectsStack!];
                                newStack[idx] = { ...effect, type: e.target.value as any };
                                onUpdateLayerEffects(selectedLayer.id, newStack);
                              }}
                              className="bg-transparent text-[10px] font-mono text-white outline-none"
                            >
                              <option value="glow">Glow</option>
                              <option value="chromatic">Chromatic</option>
                              <option value="distortion">Distortion</option>
                              <option value="noise">Noise</option>
                              <option value="glitch">Glitch</option>
                            </select>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  const newStack = [...selectedLayer.effectsStack!];
                                  newStack[idx] = { ...effect, enabled: !effect.enabled };
                                  onUpdateLayerEffects(selectedLayer.id, newStack);
                                }}
                                className={`p-1 rounded ${effect.enabled ? 'text-xeno-green' : 'text-white/20'}`}
                              >
                                {effect.enabled ? <Eye size={10} /> : <EyeOff size={10} />}
                              </button>
                              <button 
                                onClick={() => {
                                  const newStack = selectedLayer.effectsStack!.filter((_, i) => i !== idx);
                                  onUpdateLayerEffects(selectedLayer.id, newStack);
                                }}
                                className="p-1 text-xeno-red/40 hover:text-xeno-red"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                          <XenoSlider 
                            label="Intensity" 
                            value={effect.params.intensity || 0.5} 
                            min={0} 
                            max={1} 
                            step={0.1} 
                            onChange={(v) => {
                              const newStack = [...selectedLayer.effectsStack!];
                              newStack[idx] = { ...effect, params: { ...effect.params, intensity: v } };
                              onUpdateLayerEffects(selectedLayer.id, newStack);
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedLayer.type === 'text' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Text Content</span>
                  <textarea 
                    value={selectedLayer.data.text} 
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, text: e.target.value } })}
                    className="w-full bg-void/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-xeno-green outline-none transition-all min-h-[80px]"
                  />
                  
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Typography</span>
                    <div className="space-y-2">
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Font Family</span>
                      <select 
                        value={selectedLayer.data.fontFamily || 'Inter'}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fontFamily: e.target.value } })}
                        className="w-full bg-void/40 border border-white/10 rounded-xl p-2 text-[10px] font-mono text-white outline-none"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Orbitron">Orbitron</option>
                        <option value="Rajdhani">Rajdhani</option>
                        <option value="Michroma">Michroma</option>
                        <option value="Syncopate">Syncopate</option>
                        <option value="Press Start 2P">Press Start 2P</option>
                        <option value="Major Mono Display">Major Mono</option>
                        <option value="VT323">VT323 (Retro)</option>
                        <option value="Silkscreen">Silkscreen</option>
                        <option value="Bungee Outline">Bungee Outline</option>
                        <option value="Monoton">Monoton</option>
                        <option value="Codystar">Codystar</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Impact">Impact</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <XenoButton 
                        onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fontStyle: selectedLayer.data.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                        variant={selectedLayer.data.fontStyle === 'italic' ? 'primary' : 'ghost'}
                        className="py-2"
                      >
                        <Italic size={12} />
                      </XenoButton>
                      <XenoButton 
                        onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fontStyle: selectedLayer.data.fontStyle === 'bold' ? 'normal' : 'bold' } })}
                        variant={selectedLayer.data.fontStyle === 'bold' ? 'primary' : 'ghost'}
                        className="py-2"
                      >
                        <Bold size={12} />
                      </XenoButton>
                      <XenoButton 
                        onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, textDecoration: selectedLayer.data.textDecoration === 'underline' ? 'none' : 'underline' } })}
                        variant={selectedLayer.data.textDecoration === 'underline' ? 'primary' : 'ghost'}
                        className="py-2"
                      >
                        <Underline size={12} />
                      </XenoButton>
                    </div>

                    <XenoSlider label="Font Size" value={selectedLayer.data.fontSize} min={10} max={300} onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fontSize: v } })} />
                    <XenoSlider label="Letter Spacing" value={selectedLayer.data.letterSpacing || 0} min={-10} max={50} onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, letterSpacing: v } })} />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Advanced Effects</span>
                    <XenoSlider label="Stroke Width" value={selectedLayer.data.strokeWidth || 0} min={0} max={20} step={0.1} onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, strokeWidth: v } })} />
                    
                    <div className="space-y-4 p-3 rounded-xl bg-void/40 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Neon Glow</span>
                        <button 
                          onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, glow: !selectedLayer.data.glow } })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${selectedLayer.data.glow ? 'bg-xeno-green' : 'bg-white/10'}`}
                        >
                          <motion.div 
                            className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"
                            animate={{ x: selectedLayer.data.glow ? 20 : 0 }}
                          />
                        </button>
                      </div>
                      
                      {selectedLayer.data.glow && (
                        <div className="space-y-3 pt-2">
                          <XenoSlider label="Glow Blur" value={selectedLayer.data.glowBlur || 20} min={0} max={100} onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, glowBlur: v } })} />
                          <div className="grid grid-cols-5 gap-1">
                            {['#00ff41', '#00d4ff', '#ff003c', '#8a2be2', '#ffffff'].map(color => (
                              <button 
                                key={color}
                                onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, glowColor: color } })}
                                className={`aspect-square rounded border transition-all ${selectedLayer.data.glowColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Path Text</span>
                      <div className="flex gap-2">
                        <XenoButton 
                          onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, curved: !selectedLayer.data.curved, usePath: false } })}
                          variant={selectedLayer.data.curved ? 'primary' : 'ghost'}
                          className="py-1 px-2 text-[8px]"
                        >
                          Curved
                        </XenoButton>
                        <XenoButton 
                          onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, usePath: !selectedLayer.data.usePath, curved: false } })}
                          variant={selectedLayer.data.usePath ? 'primary' : 'ghost'}
                          className="py-1 px-2 text-[8px]"
                        >
                          Custom Path
                        </XenoButton>
                      </div>
                    </div>
                    
                    {selectedLayer.data.curved && (
                      <XenoSlider label="Curve Radius" value={selectedLayer.data.curveRadius || 200} min={50} max={1000} onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, curveRadius: v } })} />
                    )}

                    {selectedLayer.data.usePath && (
                      <div className="space-y-2">
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">SVG Path Data</span>
                        <textarea 
                          value={selectedLayer.data.path || ''} 
                          onChange={(e) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, path: e.target.value } })}
                          placeholder="M 0,50 Q 100,0 200,50"
                          className="w-full bg-void/40 border border-white/10 rounded-xl p-2 text-[10px] font-mono text-white focus:border-xeno-green outline-none transition-all min-h-[60px]"
                        />
                        <p className="text-[8px] font-mono text-white/40">Enter SVG path data (e.g., M 0,50 Q 100,0 200,50)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLayer.type === 'shape' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Shape Style</span>
                  <div className="grid grid-cols-4 gap-2">
                    {['#00ff41', '#00f0ff', '#ff00ff', '#ff0000'].map(color => (
                      <button 
                        key={color}
                        onClick={() => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, fill: color } })}
                        className={`aspect-square rounded-lg border transition-all ${selectedLayer.data.fill === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <XenoSlider label="Stroke Width" value={selectedLayer.data.strokeWidth} min={0} max={20} onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, strokeWidth: v } })} />
                  {selectedLayer.data.shapeType === 'rect' && (
                    <XenoSlider label="Corner Radius" value={selectedLayer.data.cornerRadius} min={0} max={100} onChange={(v) => onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, cornerRadius: v } })} />
                  )}
                  {selectedLayer.data.shapeType === 'polygon' && (
                    <div className="space-y-2">
                      <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Polygon Points</span>
                      <div className="space-y-2">
                        <textarea 
                          value={selectedLayer.data.points?.join(',')}
                          onChange={(e) => {
                            const points = e.target.value.split(',').map(Number).filter(n => !isNaN(n));
                            onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, points } });
                          }}
                          className="w-full bg-void/40 border border-white/10 rounded-xl p-2 text-[10px] font-mono text-white outline-none min-h-[60px]"
                          placeholder="x1,y1,x2,y2..."
                        />
                        <div className="flex gap-2">
                          <XenoButton 
                            onClick={() => {
                              const points = [...(selectedLayer.data.points || [])];
                              points.push((points[points.length-2] || 0) + 20, (points[points.length-1] || 0) + 20);
                              onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, points } });
                            }}
                            variant="ghost" 
                            className="flex-1 py-1 text-[8px]"
                          >
                            Add Point
                          </XenoButton>
                          <XenoButton 
                            onClick={() => {
                              const points = [...(selectedLayer.data.points || [])];
                              points.splice(-2, 2);
                              onUpdateLayer(selectedLayer.id, { data: { ...selectedLayer.data, points } });
                            }}
                            variant="ghost" 
                            className="flex-1 py-1 text-[8px]"
                          >
                            Remove Point
                          </XenoButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'draw' && (
            <motion.div 
              key="draw"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-4 p-4 rounded-2xl bg-xeno-green/5 border border-xeno-green/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool size={14} className="text-xeno-green" />
                    <span className="text-[10px] font-mono text-white uppercase tracking-widest">Freehand Draw</span>
                  </div>
                  <button 
                    onClick={() => setIsDrawing(!isDrawing)}
                    className={`px-3 py-1 rounded-lg text-[8px] font-mono uppercase transition-all ${isDrawing ? 'bg-xeno-green text-void' : 'bg-white/5 text-white/40'}`}
                  >
                    {isDrawing ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <XenoTooltip shortcutId="brush-mode-brush" position="top" className="flex-1">
                    <XenoButton 
                      onClick={() => onUpdateBrush({ mode: 'brush' })}
                      variant={brushSettings.mode === 'brush' ? 'primary' : 'ghost'}
                      className="w-full py-2 text-[8px]"
                    >
                      <PenTool size={12} className="mr-2" /> Brush
                    </XenoButton>
                  </XenoTooltip>
                  <XenoTooltip shortcutId="brush-mode-eraser" position="top" className="flex-1">
                    <XenoButton 
                      onClick={() => onUpdateBrush({ mode: 'eraser' })}
                      variant={brushSettings.mode === 'eraser' ? 'primary' : 'ghost'}
                      className="w-full py-2 text-[8px]"
                    >
                      <Eraser size={12} className="mr-2" /> Eraser
                    </XenoButton>
                  </XenoTooltip>
                  <XenoTooltip shortcutId="brush-mode-inpaint" position="top" className="flex-1">
                    <XenoButton 
                      onClick={() => onUpdateBrush({ mode: 'inpaint' })}
                      variant={brushSettings.mode === 'inpaint' ? 'primary' : 'ghost'}
                      className="w-full py-2 text-[8px]"
                    >
                      <Sparkles size={12} className="mr-2" /> Inpaint
                    </XenoButton>
                  </XenoTooltip>
                  <XenoTooltip shortcutId="brush-mode-lasso" position="top" className="flex-1">
                    <XenoButton 
                      onClick={() => {
                        setIsLassoing(!isLassoing);
                        setIsDrawing(false);
                      }}
                      variant={isLassoing ? 'primary' : 'ghost'}
                      className="w-full py-2 text-[8px]"
                    >
                      <Scissors size={12} className="mr-2" /> Lasso
                    </XenoButton>
                  </XenoTooltip>
                </div>

                {brushSettings.mode === 'inpaint' && (
                  <div className="p-3 rounded-xl bg-xeno-blue/10 border border-xeno-blue/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[8px] font-mono text-xeno-blue uppercase tracking-widest leading-relaxed">
                      Paint over the area you want to remove or fill. The system will analyze surrounding textures to synthesize a replacement.
                    </p>
                    <div className="flex gap-2">
                      <XenoButton 
                        onClick={() => {
                          onApplyInpaint?.();
                        }}
                        disabled={isGenerating}
                        variant="primary"
                        className="flex-[2] py-2 text-[10px] bg-xeno-blue/20 border-xeno-blue/40 text-xeno-blue hover:bg-xeno-blue/30 shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                      >
                        {isGenerating ? 'Synthesizing...' : 'Process Neural Fill'}
                      </XenoButton>
                      <XenoButton 
                        onClick={() => {
                          onUpdateGlobal({ inpaintMask: [] });
                        }}
                        variant="ghost"
                        className="flex-1 py-2 text-[10px] border-white/10 text-white/40 hover:text-white/60"
                      >
                        Clear
                      </XenoButton>
                    </div>
                  </div>
                )}

                <XenoSlider label="Size" value={brushSettings.size} min={1} max={100} onChange={(v) => onUpdateBrush({ size: v })} />
                <XenoSlider label="Opacity" value={brushSettings.opacity} min={0} max={1} step={0.1} onChange={(v) => onUpdateBrush({ opacity: v })} />
                
                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Brush Color</span>
                  <div className="grid grid-cols-5 gap-2">
                    {['#00ff41', '#00f0ff', '#ff00ff', '#ff0000', '#ffffff'].map(color => (
                      <button 
                        key={color}
                        onClick={() => onUpdateBrush({ color })}
                        className={`aspect-square rounded-lg border transition-all ${brushSettings.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Brush Effect</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['none', 'neon', 'glitch'].map(effect => (
                      <XenoButton 
                        key={effect}
                        onClick={() => onUpdateBrush({ effect: effect as any })}
                        variant={brushSettings.effect === effect ? 'primary' : 'ghost'}
                        className="py-1 text-[8px]"
                      >
                        {effect}
                      </XenoButton>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div 
              key="social"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Share2 size={14} className="text-xeno-green" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Social Workflow</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <XenoButton onClick={onAddMemeText} variant="ghost" className="justify-start py-3 px-4 text-[10px]">
                    <Layout size={14} className="mr-3" /> Meme Template
                  </XenoButton>
                  <XenoButton onClick={onAddWatermark} variant="ghost" className="justify-start py-3 px-4 text-[10px]">
                    <Grid size={14} className="mr-3" /> Add Watermark
                  </XenoButton>
                  <XenoButton onClick={() => {
                    const layer = layers.find(l => l.id === selectedLayerId);
                    if (layer && layer.type === 'image') {
                      onUpdateLayer(layer.id, { 
                        width: 500, 
                        height: 500, 
                        mask: {
                          enabled: true,
                          type: 'circle',
                          x: 250,
                          y: 250,
                          width: 500,
                          height: 500,
                          rotation: 0
                        }
                      });
                    }
                  }} variant="ghost" className="justify-start py-3 px-4 text-[10px]">
                    <UserCircle size={14} className="mr-3" /> Profile Pic Maker
                  </XenoButton>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest px-2">Ratio Engine</span>
                  <div className="grid grid-cols-2 gap-2">
                    {XENO_PRESETS.map(preset => (
                      <XenoButton 
                        key={preset.id}
                        onClick={() => onApplyPreset(preset)}
                        variant="ghost"
                        className="flex-col items-start gap-1 py-3 px-4 h-auto"
                      >
                        <span className="text-[10px] text-white uppercase">{preset.name}</span>
                        <span className="text-[8px] text-white/20">{preset.width}x{preset.height}</span>
                      </XenoButton>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'global' && (
            <motion.div 
              key="global"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Background Color</span>
                <div className="grid grid-cols-4 gap-2">
                  {['#0a0a0a', '#1a1a1a', '#00ff41', '#000000'].map(color => (
                    <button 
                      key={color}
                      onClick={() => onUpdateGlobal({ backgroundColor: color, backgroundGradient: undefined })}
                      className={`aspect-square rounded-lg border transition-all ${globalState.backgroundColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Gradient Background</span>
                <div className="grid grid-cols-2 gap-2">
                  <XenoButton onClick={() => onUpdateGlobal({ backgroundGradient: { start: '#0a0a0a', end: '#00ff41', type: 'linear' } })} variant="ghost" className="py-2 text-[8px]">
                    Xeno Linear
                  </XenoButton>
                  <XenoButton onClick={() => onUpdateGlobal({ backgroundGradient: { start: '#0a0a0a', end: '#ff00ff', type: 'radial' } })} variant="ghost" className="py-2 text-[8px]">
                    Void Radial
                  </XenoButton>
                </div>
                <XenoButton onClick={() => onUpdateGlobal({ backgroundGradient: undefined, backgroundColor: '#0a0a0a' })} variant="ghost" className="w-full py-2 text-[8px] text-xeno-red">
                  Clear Background
                </XenoButton>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Canvas System</span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-void/40 border border-white/5">
                  <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Snapping</span>
                  <XenoTooltip shortcutId="toggle-snapping" position="left">
                    <button 
                      onClick={() => onUpdateGlobal({ snappingEnabled: !snappingEnabled })}
                      className={`w-10 h-5 rounded-full transition-all relative ${snappingEnabled ? 'bg-xeno-green' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${snappingEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </XenoTooltip>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-void/40 border border-white/5">
                  <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Smart Guides</span>
                  <XenoTooltip shortcutId="toggle-guides" position="left">
                    <button 
                      onClick={() => onUpdateGlobal({ guidesEnabled: !guidesEnabled })}
                      className={`w-10 h-5 rounded-full transition-all relative ${guidesEnabled ? 'bg-xeno-green' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${guidesEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </XenoTooltip>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Immersive Effects</span>
                <div className="space-y-2">
                  {Object.entries(globalState.visualEffects).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-void/40 border border-white/5">
                      <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <button 
                        onClick={() => onUpdateGlobal({ 
                          visualEffects: { ...globalState.visualEffects, [key]: !value } 
                        })}
                        className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-xeno-green' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'macros' && (
            <motion.div 
              key="macros"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-2xl bg-void/40 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Macro Recorder</span>
                  <div className={`w-2 h-2 rounded-full ${globalState.isRecordingMacro ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`} />
                </div>
                {!globalState.isRecordingMacro ? (
                  <XenoButton onClick={onStartRecordingMacro} variant="primary" className="w-full py-2">
                    <Circle size={12} className="mr-2 fill-current" /> Start Recording
                  </XenoButton>
                ) : (
                  <div className="space-y-2">
                    <input 
                      type="text"
                      value={macroName}
                      onChange={(e) => setMacroName(e.target.value)}
                      placeholder="Macro name..."
                      className="w-full bg-void/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-xeno-green"
                    />
                    <XenoButton onClick={() => { onStopRecordingMacro(macroName || 'New Macro'); setMacroName(''); }} variant="primary" className="w-full py-2">
                      <Square size={12} className="mr-2 fill-current" /> Stop & Save
                    </XenoButton>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest px-1">Saved Macros</span>
                {globalState.macros.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <span className="text-[10px] font-mono text-white/20">No macros recorded</span>
                  </div>
                ) : (
                  globalState.macros.map(macro => (
                    <div key={macro.id} className="p-3 rounded-xl bg-void/40 border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-xeno-green/10 text-xeno-green">
                          <Zap size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-mono text-white">{macro.name}</span>
                          <span className="text-[8px] font-mono text-white/20">{macro.commands.length} actions</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onPlayMacro(macro.id)}
                        className="p-2 rounded-lg bg-xeno-green text-void opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <XenoHistory 
                history={historyTimeline}
                currentIndex={historyIndex}
                onJumpTo={onJumpToHistory}
                onUndo={onUndo}
                onRedo={onRedo}
              />
            </motion.div>
          )}
          {activeTab === 'presets' && (
            <motion.div 
              key="presets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="space-y-4 p-4 rounded-2xl bg-xeno-green/5 border border-xeno-green/20">
                <span className="text-[10px] font-mono text-white uppercase tracking-widest">Save Current State</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="flex-1 bg-void/60 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-xeno-green"
                  />
                  <XenoButton 
                    onClick={() => {
                      if (presetName) {
                        onSavePreset(presetName);
                        setPresetName('');
                      }
                    }}
                    disabled={!presetName}
                    className="py-2 px-4 text-[10px]"
                  >
                    Save
                  </XenoButton>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Ratio Engine</span>
                <div className="grid grid-cols-1 gap-2">
                  {XENO_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => onApplyPreset(preset)}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-void/40 hover:border-xeno-green/40 hover:bg-xeno-green/5 transition-all group text-left"
                    >
                      <div>
                        <p className="text-[10px] font-mono text-white uppercase group-hover:text-xeno-green transition-colors">{preset.name}</p>
                        <p className="text-[8px] font-mono text-white/20 uppercase">{preset.width}x{preset.height}</p>
                      </div>
                      <Maximize size={14} className="text-white/20 group-hover:text-xeno-green transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/5 space-y-3">
        <XenoButton onClick={onExport} className="w-full">
          <Download size={14} /> Extract Unit
        </XenoButton>
      </div>
    </div>
  );
}
