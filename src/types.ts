export type XenoMode = 'QUICK' | 'EDITOR' | 'NEURAL' | 'DRAW' | 'SOCIAL';

export type XenoBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export interface XenoTextData {
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  align: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  fontStyle?: 'normal' | 'italic' | 'bold' | 'bold italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
    enabled: boolean;
  };
  glow?: {
    color: string;
    blur: number;
    enabled: boolean;
  };
  distortion?: {
    enabled: boolean;
    amount: number;
    type: 'wave' | 'glitch' | 'warp';
  };
  chromaticAberration?: {
    enabled: boolean;
    offset: number;
  };
  curved?: boolean;
  curveRadius?: number;
  usePath?: boolean;
  path?: string;
}

export interface XenoLayer {
  id: string;
  type: 'image' | 'text' | 'shape' | 'sticker' | 'logo' | 'brush' | 'group';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  data: any; // specific data for each type (e.g., XenoTextData for 'text')
  filters?: XenoFilterSettings;
  blendMode?: XenoBlendMode;
  animation?: 'none' | 'pulse' | 'flicker' | 'glitch';
  parentId?: string; // for grouping
  mask?: XenoMaskSettings;
  effectsStack?: XenoEffect[];
  constraints?: XenoConstraints;
  version?: number;
  versions?: any[];
}

export interface XenoEffect {
  id: string;
  type: 'blur' | 'glow' | 'chromatic' | 'noise' | 'pixelate' | 'invert' | 'sepia' | 'distortion';
  enabled: boolean;
  params: any;
}

export interface XenoConstraints {
  horizontal: 'left' | 'right' | 'center' | 'stretch' | 'scale';
  vertical: 'top' | 'bottom' | 'center' | 'stretch' | 'scale';
  proportional: boolean;
}

export interface XenoMaskSettings {
  type: 'none' | 'circle' | 'rect' | 'star' | 'custom';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  points?: number[]; // for star or custom paths
  enabled: boolean;
}

export interface XenoFilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  grayscale: boolean;
  pixelate: number;
  noise: number;
  sharpen: number;
  glow: number;
  vignette: number;
  chromaKey?: string;
  invert?: boolean;
  sepia?: boolean;
}

export interface XenoImage {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
  tags?: string[];
  isLibrary?: boolean;
  createdAt: number;
}

export interface XenoState {
  layers: XenoLayer[];
  selectedLayerId: string | null;
  selectedLayerIds: string[];
  selectedNeuralIds: string[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor?: string;
  backgroundGradient?: {
    start: string;
    end: string;
    type: 'linear' | 'radial';
  };
  neuralBuffer: XenoImage[];
  library: XenoImage[];
  isGenerating?: boolean;
  isRecordingMacro: boolean;
  macroBuffer: any[]; // Will store serialized commands
  macros: XenoMacro[];
  brushSettings: {
    size: number;
    color: string;
    opacity: number;
    mode: 'brush' | 'eraser' | 'inpaint';
    effect: 'none' | 'neon' | 'glitch' | 'chromatic' | 'distortion';
  };
  visualEffects: {
    screenShake: boolean;
    chromaticAberration: boolean;
    distortion: boolean;
    vignette: boolean;
    scanlines: boolean;
  };
  historyTimeline: XenoHistoryItem[];
  historyIndex: number;
  snappingEnabled: boolean;
  guidesEnabled: boolean;
  inpaintMask?: number[][];
}

export interface XenoHistoryItem {
  id: string;
  timestamp: number;
  label: string;
  command: any; // The command that was executed
  state: Partial<XenoState>; // Snapshot of the state after the command
}

export interface XenoMacro {
  id: string;
  name: string;
  commands: any[]; // Serialized commands
}

export interface XenoPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: string;
}

export const XENO_PRESETS: XenoPreset[] = [
  { id: 'ig-post', name: 'Instagram Post', width: 1080, height: 1080, category: 'Social' },
  { id: 'ig-story', name: 'Instagram Story', width: 1080, height: 1920, category: 'Social' },
  { id: 'tiktok', name: 'TikTok', width: 1080, height: 1920, category: 'Social' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Social' },
  { id: 'fb-cover', name: 'Facebook Cover', width: 820, height: 312, category: 'Social' },
  { id: 'wa-profile', name: 'WhatsApp Profile', width: 500, height: 500, category: 'Profile' },
  { id: 'li-profile', name: 'LinkedIn Profile', width: 400, height: 400, category: 'Profile' },
  { id: 'tw-header', name: 'Twitter Header', width: 1500, height: 500, category: 'Social' },
  { id: 'li-banner', name: 'LinkedIn Banner', width: 1584, height: 396, category: 'Social' },
  { id: 'wa-status', name: 'WhatsApp Status', width: 1080, height: 1920, category: 'Social' },
];

export const DEFAULT_FILTERS: XenoFilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
  grayscale: false,
  pixelate: 0,
  noise: 0,
  sharpen: 0,
  glow: 0,
  vignette: 0,
  invert: false,
  sepia: false,
};
