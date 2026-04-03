import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShortcutInfo, getShortcutString, findShortcutById } from '../constants/shortcuts';

interface XenoTooltipProps {
  children: React.ReactNode;
  content?: string;
  shortcutId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const XenoTooltip: React.FC<XenoTooltipProps> = ({ 
  children, 
  content, 
  shortcutId, 
  position = 'top', 
  delay = 0.3,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const shortcut = shortcutId ? findShortcutById(shortcutId) : null;
  const tooltipText = content || shortcut?.name;
  const shortcutText = shortcut ? getShortcutString(shortcut) : null;

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return '-top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2';
      case 'bottom': return '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full mt-2';
      case 'left': return 'top-1/2 -left-2 -translate-x-full -translate-y-1/2 mr-2';
      case 'right': return 'top-1/2 -right-2 translate-x-full -translate-y-1/2 ml-2';
      default: return '-top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2';
    }
  };

  if (!tooltipText && !shortcutText) return <>{children}</>;

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[9999] pointer-events-none ${getPositionClasses()}`}
          >
            <div className="px-2 py-1 bg-black/90 border border-white/10 rounded-md shadow-2xl backdrop-blur-md flex items-center gap-2 whitespace-nowrap">
              {tooltipText && (
                <span className="text-[10px] font-mono text-white/90 uppercase tracking-wider">
                  {tooltipText}
                </span>
              )}
              {shortcutText && (
                <span className="px-1 py-0.5 bg-white/10 rounded text-[9px] font-mono text-xeno-green/80 border border-white/5">
                  {shortcutText}
                </span>
              )}
              {/* Tooltip Arrow */}
              <div className={`absolute w-1.5 h-1.5 bg-black/90 border-r border-b border-white/10 rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-r-0 border-b-0 border-t border-l' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-b-0 border-r-0 border-t border-l' :
                'left-[-4px] top-1/2 -translate-y-1/2 border-t-0 border-l-0 border-r border-b'
              }`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default XenoTooltip;
