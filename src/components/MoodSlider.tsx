import { getMoodState, getGradientColor } from '../utils/moodUtils';

interface MoodSliderProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

export const MoodSlider = ({ value, onChange, className = '' }: MoodSliderProps) => {
  const { label, description } = getMoodState(value);
  const color = getGradientColor(value);

  return (
    <div className={`w-full max-w-md flex flex-col items-center gap-6 ${className}`}>
      <div className="text-center space-y-2">
        <div className="text-3xl font-light transition-colors duration-300" style={{ color }}>
          {label}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-mono tracking-wider">
          SCORE: 
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val < 0) val = 0;
              if (val > 100) val = 100;
              onChange(val);
            }}
            className="w-12 bg-transparent border-b border-gray-300 focus:border-slate-500 focus:outline-none text-center font-mono"
          />
        </div>
        <div className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed mt-2 px-4 py-2 bg-slate-50/50 rounded-lg">
          {description}
        </div>
      </div>
      
      <div className="relative w-full h-8 flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mood-slider w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
          style={{
             background: `linear-gradient(to right, #1e293b 0%, #334155 20%, #6366f1 40%, #e2e8f0 50%, #14b8a6 60%, #facc15 80%, #ef4444 100%)`
          }}
        />
      </div>

      <style>{`
        .mood-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: ${color};
          cursor: grab;
          box-shadow: 0 0 15px ${color};
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.1s;
          border: 4px solid white;
        }
        .mood-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .mood-slider::-moz-range-thumb {
          height: 28px;
          width: 28px;
          border: 4px solid white;
          border-radius: 50%;
          background: ${color};
          cursor: grab;
          box-shadow: 0 0 15px ${color};
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.1s;
        }
        .mood-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};
