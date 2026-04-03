import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { soundService } from '../services/soundService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface XenoButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
}

export default function XenoButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled 
}: XenoButtonProps) {
  const variants = {
    primary: 'bg-xeno-green/10 border-xeno-green/40 text-xeno-green hover:bg-xeno-green/20 shadow-[0_0_15px_rgba(0,255,65,0.1)]',
    secondary: 'bg-xeno-purple/10 border-xeno-purple/40 text-xeno-purple hover:bg-xeno-purple/20 shadow-[0_0_15px_rgba(138,43,226,0.1)]',
    danger: 'bg-xeno-red/10 border-xeno-red/40 text-xeno-red hover:bg-xeno-red/20 shadow-[0_0_15px_rgba(255,0,60,0.1)]',
    ghost: 'bg-transparent border-white/10 text-white/60 hover:bg-white/5',
  };

  const handleClick = () => {
    soundService.playClick();
    onClick?.();
  };

  const handleMouseEnter = () => {
    soundService.playHover();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      className={cn(
        'relative px-4 py-2 border font-mono text-[10px] uppercase tracking-widest transition-all duration-300 interactive disabled:opacity-50 overflow-hidden group',
        variants[variant],
        className
      )}
    >
      {/* Glitch overlay on hover */}
      <div className="absolute inset-0 bg-white/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-40" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-40" />
    </motion.button>
  );
}
