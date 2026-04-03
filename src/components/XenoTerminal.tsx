import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal } from 'lucide-react';

interface XenoTerminalProps {
  logs: string[];
  visible: boolean;
}

export default function XenoTerminal({ logs, visible }: XenoTerminalProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          className="fixed bottom-12 right-12 w-96 glass-panel border border-xeno-green/30 p-4 z-[100] shadow-[0_0_50px_rgba(0,255,65,0.1)]"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-xeno-green/20 pb-2">
            <Terminal size={14} className="text-xeno-green animate-pulse" />
            <span className="text-[10px] font-mono text-xeno-green uppercase tracking-widest">Neural Synthesis Terminal</span>
          </div>
          
          <div className="space-y-1 h-48 overflow-y-auto scrollbar-hide font-mono text-[9px]">
            {logs.map((log, i) => (
              <motion.p 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${log.includes('ERROR') ? 'text-xeno-red' : 'text-xeno-green/80'}`}
              >
                {log}
              </motion.p>
            ))}
            {logs.length > 0 && !logs[logs.length-1].includes('STORED') && !logs[logs.length-1].includes('FAILED') && (
              <motion.div 
                animate={{ opacity: [0, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="w-2 h-3 bg-xeno-green inline-block ml-1"
              />
            )}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-xeno-green/40" />
              <div className="w-1 h-1 rounded-full bg-xeno-green/40" />
              <div className="w-1 h-1 rounded-full bg-xeno-green/40" />
            </div>
            <span className="text-[8px] font-mono text-xeno-green/40 uppercase">Xeno-Core v2.5.0</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
