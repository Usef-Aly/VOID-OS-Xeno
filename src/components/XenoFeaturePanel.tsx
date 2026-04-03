import React from 'react';
import { motion } from 'motion/react';
import { 
  Move, 
  Maximize, 
  Group, 
  Copy, 
  Trash2, 
  Layers, 
  Sparkles, 
  Type, 
  Download, 
  Zap, 
  History 
} from 'lucide-react';
import XenoTooltip from './XenoTooltip';
import { soundService } from '../services/soundService';

interface XenoFeaturePanelProps {
  onAction: (action: string) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function XenoFeaturePanel({ onAction, activeTab, setActiveTab }: XenoFeaturePanelProps) {
  const tools = [
    { id: 'move', icon: Move, label: 'Move', shortcut: 'V', type: 'action' },
    { id: 'transform', icon: Maximize, label: 'Transform', shortcut: 'T', type: 'action' },
    { id: 'group', icon: Group, label: 'Group', shortcut: 'G', type: 'action' },
    { id: 'duplicate', icon: Copy, label: 'Duplicate', shortcut: 'D', type: 'action' },
    { id: 'delete', icon: Trash2, label: 'Delete', shortcut: 'DEL', type: 'action' },
    { id: 'divider', type: 'divider' },
    { id: 'layers', icon: Layers, label: 'Layers', type: 'tab' },
    { id: 'adjust', icon: Sparkles, label: 'Effects', type: 'tab' },
    { id: 'text', icon: Type, label: 'Text', type: 'tab' },
    { id: 'export', icon: Download, label: 'Export', type: 'tab' },
    { id: 'macros', icon: Zap, label: 'Macros', type: 'tab' },
    { id: 'history', icon: History, label: 'History', type: 'tab' },
  ];

  const handleAction = (id: string) => {
    soundService.playClick();
    onAction(id);
  };

  const handleTabChange = (id: string) => {
    soundService.playToggle();
    setActiveTab(id);
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1.5 p-1.5 glass-toolbar border border-white/10 rounded-2xl shadow-2xl animate-breathe">
      {tools.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={`divider-${index}`} className="w-px h-8 bg-white/10 mx-1.5" />;
        }

        const isTab = item.type === 'tab';
        const isActive = isTab && activeTab === item.id;

        return (
          <XenoTooltip key={item.id} content={item.label} shortcutId={item.shortcut} position="top">
            <button
              onClick={() => isTab ? handleTabChange(item.id!) : handleAction(item.id!)}
              onMouseEnter={() => soundService.playHover()}
              className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all interactive group ${
                isActive 
                  ? 'bg-xeno-green/10 border-xeno-green/40 text-xeno-green shadow-[0_0_15px_rgba(0,255,157,0.2)]' 
                  : 'bg-white/5 border-white/5 text-white/30 hover:text-white hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {item.icon && <item.icon size={18} className="group-hover:scale-110 transition-transform" />}
            </button>
          </XenoTooltip>
        );
      })}
    </div>
  );
}
