import { getMoodState, getGradientColor } from '../utils/moodUtils';

interface MoodSliderProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
}

export const MoodSlider = ({ value, onChange, className = '' }: MoodSliderProps) => {
  const { label, description } = getMoodState(value);
  const color = getGradientColor(value);

  // Define segments based on moodUtils logic
  const segments = [
    { width: '10%', color: '#0e0f0f' }, // 0-9: 绝望/崩塌 (Pure Black)
    { width: '10%', color: '#212529' }, // 10-19: 极度痛苦 (Darkest Gray)
    { width: '10%', color: '#495057' }, // 20-29: 焦虑/挣扎 (Deep Gray)
    { width: '10%', color: '#868e96' }, // 30-39: 沮丧/烦躁 (Gray)
    { width: '10%', color: '#ced4da' }, // 40-49: 疲惫/emo (Dim Gray)
    { width: '10%', color: '#d1fae5' }, // 50-59: 平静/归零 (Mint)
    { width: '10%', color: '#6bffb8' }, // 60-69: 惬意/安适 (Fresh Green)
    { width: '10%', color: '#22c55e' }, // 70-79: 开心/愉悦 (Green)
    { width: '10%', color: '#3b82f6' }, // 80-89: 兴奋/激动 (Blue)
    { width: '6%',  color: '#a855f7' }, // 90-95: 狂喜/热爱 (Purple)
    { width: '4%',  color: '#eab308' }  // 96-100: 巅峰/极乐 (Gold)
  ];
  // Corrected mapping based on score ranges:
  // 0-9: #0e0f0f (10%)
  // 10-19: #212529 (10%)
  // 20-29: #495057 (10%)
  // 30-39: #868e96 (10%)
  // 40-49: #ced4da (10%)
  // 50-59: #d1fae5 (10%)
  // 60-69: #6bffb8 (10%)
  // 70-79: #22c55e (10%)
  // 80-89: #3b82f6 (10%)
  // 90-95: #a855f7 (6%)
  // 96-100: #eab308 (4%)

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
      
      <div className="relative w-full h-2 bg-slate-100 rounded-full flex items-center">
        {/* Segmented Background */}
        <div className="absolute inset-0 rounded-full overflow-hidden flex w-full h-full">
           {/* 0-9: 10% */}
           <div style={{ width: '10%', background: '#0e0f0f' }} />
           {/* 10-19: 10% */}
           <div style={{ width: '10%', background: '#212529' }} />
           {/* 20-29: 10% */}
           <div style={{ width: '10%', background: '#495057' }} />
           {/* 30-39: 10% */}
           <div style={{ width: '10%', background: '#868e96' }} />
           {/* 40-49: 10% */}
           <div style={{ width: '10%', background: '#ced4da' }} />
           {/* 50-59: 10% */}
           <div style={{ width: '10%', background: '#d1fae5' }} />
           {/* 60-69: 10% */}
           <div style={{ width: '10%', background: '#6bffb8' }} />
           {/* 70-79: 10% */}
           <div style={{ width: '10%', background: '#22c55e' }} />
           {/* 80-89: 10% */}
           <div style={{ width: '10%', background: '#3b82f6' }} />
           {/* 90-95: 6% */}
           <div style={{ width: '6%', background: '#a855f7' }} />
           {/* 96-100: 4% */}
           <div style={{ width: '4%', background: '#eab308' }} />
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mood-slider absolute inset-0 w-full h-full appearance-none cursor-pointer focus:outline-none z-10 bg-transparent"
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
