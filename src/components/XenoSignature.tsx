import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface XenoSignatureProps {
  variant: 'boot' | 'footer' | 'ghost';
  className?: string;
  onAnimationComplete?: () => void;
}

export default function XenoSignature({ variant, className = '', onAnimationComplete }: XenoSignatureProps) {
  const [displayText, setDisplayText] = useState('');
  const fullText = variant === 'boot' 
    ? 'INITIALIZING... CREATOR: USEF ALY' 
    : variant === 'footer' 
    ? 'CRAFTED BY USEF ALY — ARCHITECT OF THE VOID'
    : 'USEF ALY';

  useEffect(() => {
    if (variant === 'boot') {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayText(fullText.slice(0, i));
        i++;
        if (i > fullText.length) clearInterval(timer);
      }, 50);
      return () => clearInterval(timer);
    } else {
      setDisplayText(fullText);
    }
  }, [variant, fullText]);

  const glitchVariants = {
    animate: {
      x: [-1, 1, -2, 2, 0],
      y: [1, -1, 2, -2, 0],
      filter: [
        'hue-rotate(0deg) brightness(1)',
        'hue-rotate(90deg) brightness(1.2)',
        'hue-rotate(-90deg) brightness(0.8)',
        'hue-rotate(0deg) brightness(1)',
      ],
      transition: {
        duration: 0.2,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  if (variant === 'boot') {
    return (
      <div className={`font-mono text-[10px] tracking-[0.4em] text-xeno-green ${className}`}>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="glitch-text"
        >
          {displayText}
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="ml-1 inline-block w-2 h-3 bg-xeno-green"
        />
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <motion.div
        className={`group relative font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 ${className}`}
        whileHover="animate"
      >
        <motion.span
          variants={glitchVariants}
          className="block group-hover:text-xeno-blue transition-colors duration-300"
        >
          {displayText}
        </motion.span>
        
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 -z-10 bg-xeno-blue/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </motion.div>
    );
  }

  if (variant === 'ghost') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -100, y: Math.random() * 100 }}
        animate={{ 
          opacity: [0, 0.4, 0.4, 0],
          x: window.innerWidth + 100,
          y: [Math.random() * 100, Math.random() * -100, Math.random() * 100],
        }}
        transition={{ duration: 8, ease: "linear" }}
        onAnimationComplete={onAnimationComplete}
        className="fixed pointer-events-none z-[9999] font-mono text-4xl font-black tracking-[1em] text-xeno-purple/20 blur-[2px]"
      >
        <motion.span
          animate={{
            skewX: [-20, 20, -20],
            scaleY: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {displayText}
        </motion.span>
        
        {/* Particle Trail simulation */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 left-0 text-xeno-blue/10"
            animate={{
              x: -i * 20,
              opacity: [0.2, 0],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {displayText}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return null;
}
