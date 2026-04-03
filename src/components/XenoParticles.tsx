import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'spark' | 'glitch' | 'ghost';
}

interface XenoParticlesProps {
  trigger?: { x: number; y: number; type: Particle['type']; count: number };
}

export default function XenoParticles({ trigger }: XenoParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);

  const createParticle = (x: number, y: number, type: Particle['type']): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const maxLife = Math.random() * 50 + 50;
    
    let color = '#00ff41';
    if (type === 'glitch') color = Math.random() > 0.5 ? '#ff003c' : '#00d4ff';
    if (type === 'ghost') color = '#ffffff';

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2 + 1,
      color,
      life: maxLife,
      maxLife,
      type
    };
  };

  useEffect(() => {
    if (trigger) {
      for (let i = 0; i < trigger.count; i++) {
        particlesRef.current.push(createParticle(trigger.x, trigger.y, trigger.type));
      }
    }
  }, [trigger]);

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;

      if (p.type === 'glitch' && Math.random() > 0.9) {
        p.x += (Math.random() - 0.5) * 10;
      }

      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      
      if (p.type === 'ghost') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - alpha) * 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      return p.life > 0;
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[110]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
