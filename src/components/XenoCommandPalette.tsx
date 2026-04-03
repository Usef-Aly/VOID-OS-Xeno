import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, Layers, Layout, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Copy, Group, Unlock, Lock, Zap, History } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (id: string) => void;
  category: string;
}

interface XenoCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export default function XenoCommandPalette({ isOpen, onClose, commands }: XenoCommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action(filteredCommands[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-void/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center p-4 border-b border-white/5">
              <Search size={20} className="text-white/40 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commands (e.g. 'align', 'duplicate', 'group')..."
                className="w-full bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/20"
              />
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/10 text-[10px] font-mono text-white/40">
                <Command size={10} />
                <span>K</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, index) => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action(cmd.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        index === selectedIndex ? 'bg-xeno-green/10 border-xeno-green/20' : 'hover:bg-white/5 border-transparent'
                      } border`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${index === selectedIndex ? 'text-xeno-green' : 'text-white/40'}`}>
                          {cmd.icon}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-mono ${index === selectedIndex ? 'text-white' : 'text-white/60'}`}>
                            {cmd.label}
                          </p>
                          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                            {cmd.category}
                          </p>
                        </div>
                      </div>
                      {index === selectedIndex && (
                        <div className="text-xeno-green text-[10px] font-mono animate-pulse">
                          EXECUTE_
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-white/20 font-mono text-sm">NO COMMANDS FOUND FOR "{search.toUpperCase()}"</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/20">
              <div className="flex gap-4">
                <span>↑↓ NAVIGATE</span>
                <span>ENTER EXECUTE</span>
                <span>ESC CLOSE</span>
              </div>
              <span className="text-xeno-green/40">XENO_CORE v2.5.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
