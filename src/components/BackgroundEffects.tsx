import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';

export default function BackgroundEffects() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grain Overlay */}
      <div className="grain" />
      
      {/* Fog Overlay */}
      <div className="fog" />

      {/* Parallax Particles */}
      <motion.div
        className="absolute inset-[-10%]"
        animate={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.5 }}
      >
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white opacity-[0.1]"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </motion.div>

      {/* Alien Nebula Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-xeno-purple opacity-[0.05] blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-xeno-blue opacity-[0.05] blur-[120px] rounded-full" />
    </div>
  );
}
