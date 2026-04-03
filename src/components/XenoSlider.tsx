import { motion } from 'motion/react';

interface XenoSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}

export default function XenoSlider({ label, value, min, max, step = 1, onChange, unit = '' }: XenoSliderProps) {
  return (
    <div className="space-y-3 group">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest group-hover:text-xeno-green transition-colors">
          {label}
        </label>
        <span className="text-[10px] font-mono text-xeno-green bg-xeno-green/10 px-2 py-0.5 rounded border border-xeno-green/20">
          {value}{unit}
        </span>
      </div>
      
      <div className="relative h-1.5 flex items-center">
        {/* Track */}
        <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-xeno-green/40 shadow-[0_0_10px_rgba(0,255,65,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${((value - min) / (max - min)) * 100}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          />
        </div>
        
        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 z-10"
        />
        
        {/* Thumb simulation */}
        <motion.div 
          className="absolute w-3 h-3 bg-white border-2 border-xeno-green rounded-full shadow-[0_0_10px_rgba(0,255,65,0.5)] pointer-events-none"
          animate={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        />
      </div>
    </div>
  );
}
