import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, RotateCcw, RotateCw, Clock } from 'lucide-react';
import { XenoHistoryItem } from '../types';

interface XenoHistoryProps {
  history: XenoHistoryItem[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const XenoHistory: React.FC<XenoHistoryProps> = ({
  history,
  currentIndex,
  onJumpTo,
  onUndo,
  onRedo
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="text-xeno-green" size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Temporal Buffer</h3>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={onUndo}
            disabled={currentIndex <= 0}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
          <button 
            onClick={onRedo}
            disabled={currentIndex >= history.length - 1}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {history.map((item, index) => {
            const isActive = index === currentIndex;
            const isFuture = index > currentIndex;
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onJumpTo(index)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all group ${
                  isActive 
                    ? 'bg-xeno-green/20 border border-xeno-green/30' 
                    : isFuture 
                      ? 'opacity-40 hover:opacity-60 grayscale' 
                      : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-xeno-green text-black' : 'bg-white/5 text-white/40 group-hover:text-white/60'}`}>
                  <Clock size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-bold truncate ${isActive ? 'text-xeno-green' : 'text-white/80'}`}>
                    {item.label}
                  </div>
                  <div className="text-[9px] text-white/40 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="w-1 h-1 rounded-full bg-xeno-green shadow-[0_0_8px_rgba(0,255,65,0.8)]"
                  />
                )}
              </motion.button>
            );
          }).reverse()}
        </AnimatePresence>
      </div>
    </div>
  );
};
