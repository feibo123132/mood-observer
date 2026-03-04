import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronRight, X } from 'lucide-react';

type SleepQuality = '糟糕' | '一般' | '良好' | '极佳';

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (summary: string) => void;
}

interface ModalShellProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

interface WheelPickerProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  loop?: boolean;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ROWS = 5;
const TOP_BOTTOM_SPACE = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);
const LOOP_REPEAT = 5;
const LOOP_MIDDLE = Math.floor(LOOP_REPEAT / 2);

const HOURS = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'));

const QUANTITY_OPTIONS = [
  '不记',
  '少许',
  '1两',
  '2两',
  '3两',
  '半碗',
  '1碗',
  '2碗',
  '1个',
  '2个',
  '3个',
  '50g',
  '100g',
  '150g',
  '200g',
  '1份',
  '2份',
  '3份'
];

const DIET_OPTIONS = {
  staple: ['不记', '米饭', '红薯', '玉米', '面条', '炒粉'],
  protein: ['不记', '鸡蛋', '大豆', '猪肉', '豆腐类', '鸡肉', '鸭肉', '牛肉', '鱼肉', '章鱼', '生蚝'],
  vegetable: ['不记', '白菜', '芥菜', '番茄', '红萝卜', '白萝卜', '莴苣', '花菜', '南瓜', '冬瓜', '云南小瓜', '蘑菇', '木耳', '青椒'],
  fruit: ['不记', '沃柑', '砂糖橘', '圣女果', '香蕉', '苹果'],
  other: ['不记', '酸菜', '酸笋']
};

const AEROBIC_OPTIONS = ['不记', '跑步', '散步', '骑行', '跳绳', '椭圆机'];
const ANAEROBIC_OPTIONS = ['不记', '波比跳', '深蹲', '俯卧撑', '哑铃', '引体向上', '仰卧起坐', '仰背', '开合跳', '摸脚尖', '仰头'];

const AEROBIC_DURATION_OPTIONS = [
  '不记',
  ...Array.from({ length: 18 }, (_, index) => `${(index + 1) * 10}分钟`)
];

const AEROBIC_DISTANCE_OPTIONS = [
  '不记',
  ...Array.from({ length: 20 }, (_, index) => {
    const value = (index + 1) * 0.5;
    const text = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    return `${text}公里`;
  })
];

const ANAEROBIC_COUNT_OPTIONS = [
  '不记',
  ...Array.from({ length: 30 }, (_, index) => `${(index + 1) * 10}个`)
];

const WheelPicker = ({ label, options, value, onChange, loop = false }: WheelPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollStopTimerRef = useRef<number>();
  const loopResetTimerRef = useRef<number>();

  const displayedOptions = useMemo(
    () =>
      loop
        ? Array.from({ length: options.length * LOOP_REPEAT }, (_, index) => ({
            value: options[index % options.length],
            index
          }))
        : options.map((option, index) => ({ value: option, index })),
    [loop, options]
  );

  useEffect(() => {
    const rawIndex = Math.max(options.indexOf(value), 0);
    const targetIndex = loop ? rawIndex + options.length * LOOP_MIDDLE : rawIndex;
    const targetTop = targetIndex * ITEM_HEIGHT;
    const element = scrollRef.current;

    if (!element) return;
    if (Math.abs(element.scrollTop - targetTop) < 2) return;

    element.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [options, value]);

  useEffect(() => {
    return () => {
      window.clearTimeout(scrollStopTimerRef.current);
      window.clearTimeout(loopResetTimerRef.current);
    };
  }, []);

  const normalizeIndex = (index: number) => {
    if (options.length === 0) return 0;
    return ((index % options.length) + options.length) % options.length;
  };

  const snapToNearest = () => {
    const element = scrollRef.current;
    if (!element) return;

    const index = Math.round(element.scrollTop / ITEM_HEIGHT);
    const normalizedIndex = loop
      ? normalizeIndex(index)
      : Math.max(0, Math.min(options.length - 1, index));
    const targetValue = options[normalizedIndex];
    const top = loop ? index * ITEM_HEIGHT : normalizedIndex * ITEM_HEIGHT;

    element.scrollTo({ top, behavior: 'smooth' });
    if (targetValue !== value) {
      onChange(targetValue);
    }

    if (!loop) return;

    const edgeThreshold = options.length;
    if (index <= edgeThreshold || index >= options.length * (LOOP_REPEAT - 1) - edgeThreshold) {
      window.clearTimeout(loopResetTimerRef.current);
      loopResetTimerRef.current = window.setTimeout(() => {
        const resetIndex = normalizedIndex + options.length * LOOP_MIDDLE;
        element.scrollTo({ top: resetIndex * ITEM_HEIGHT, behavior: 'auto' });
      }, 120);
    }
  };

  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 mb-2 ml-1">{label}</p>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={() => {
            window.clearTimeout(scrollStopTimerRef.current);
            scrollStopTimerRef.current = window.setTimeout(snapToNearest, 80);
          }}
          className="h-60 overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div style={{ height: TOP_BOTTOM_SPACE }} />
          {displayedOptions.map((option) => (
            <button
              key={`${label}-${option.value}-${option.index}`}
              type="button"
              onClick={() => {
                onChange(option.value);
                scrollRef.current?.scrollTo({ top: option.index * ITEM_HEIGHT, behavior: 'smooth' });
              }}
              className={`h-12 w-full snap-center rounded-lg text-center text-base transition-colors ${
                option.value === value ? 'text-slate-900 font-semibold' : 'text-slate-400'
              }`}
            >
              {option.value}
            </button>
          ))}
          <div style={{ height: TOP_BOTTOM_SPACE }} />
        </div>

        <div className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 h-12 rounded-xl border border-slate-200 bg-slate-50/70" />
      </div>
    </div>
  );
};

const ModalShell = ({ isOpen, title, description, onClose, onConfirm, children }: ModalShellProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/25 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>

            <div className="p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={16} />
                完成并写入健康记录
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SleepRecordModal = ({ isOpen, onClose, onConfirm }: QuickRecordModalProps) => {
  const [bedHour, setBedHour] = useState('23');
  const [bedMinute, setBedMinute] = useState('00');
  const [wakeHour, setWakeHour] = useState('07');
  const [wakeMinute, setWakeMinute] = useState('00');
  const [quality, setQuality] = useState<SleepQuality>('良好');
  const [napHour, setNapHour] = useState('00');
  const [napMinute, setNapMinute] = useState('00');
  const [napQuality, setNapQuality] = useState<SleepQuality>('一般');
  const [isNightExpanded, setIsNightExpanded] = useState(false);
  const [isNapExpanded, setIsNapExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsNightExpanded(false);
    setIsNapExpanded(false);
  }, [isOpen]);

  const sleepDuration = useMemo(() => {
    const bedTotal = Number(bedHour) * 60 + Number(bedMinute);
    const wakeTotal = Number(wakeHour) * 60 + Number(wakeMinute);
    let durationMinutes = wakeTotal - bedTotal;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const text = `${hours}小时${minutes}分钟`;
    return { durationMinutes, text };
  }, [bedHour, bedMinute, wakeHour, wakeMinute]);

  const napDurationMinutes = Number(napHour) * 60 + Number(napMinute);
  const napDurationText = `${napHour}时${napMinute}分`;

  const handleConfirm = () => {
    const napSummary =
      napDurationMinutes > 0
        ? `白天小睡：睡眠时长 ${napDurationText}，睡眠质量 ${napQuality}`
        : '白天小睡：不记';
    const summary = `睡眠记录：夜晚睡眠：入睡时间 ${bedHour}:${bedMinute}，起床时间 ${wakeHour}:${wakeMinute}，总睡眠时长 ${sleepDuration.text}，睡眠质量 ${quality}；${napSummary}。`;
    onConfirm(summary);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="睡眠记录"
      description="使用滚轮滑动选择，不需要手动输入。"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsNightExpanded((prev) => !prev)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
          >
            <span className="text-sm font-medium text-slate-800">夜晚睡眠</span>
            {isNightExpanded ? (
              <ChevronDown size={18} className="text-slate-500" />
            ) : (
              <ChevronRight size={18} className="text-slate-500" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {isNightExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-4 space-y-6 border-t border-slate-100 overflow-hidden"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">入睡时间</p>
                  <div className="grid grid-cols-2 gap-3">
                    <WheelPicker label="小时" options={HOURS} value={bedHour} onChange={setBedHour} loop />
                    <WheelPicker label="分钟" options={MINUTES} value={bedMinute} onChange={setBedMinute} loop />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">起床时间</p>
                  <div className="grid grid-cols-2 gap-3">
                    <WheelPicker label="小时" options={HOURS} value={wakeHour} onChange={setWakeHour} loop />
                    <WheelPicker label="分钟" options={MINUTES} value={wakeMinute} onChange={setWakeMinute} loop />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">总睡眠时长（自动计算）</p>
                  <p className="text-base font-semibold text-slate-800 mt-1">{sleepDuration.text}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">睡眠质量</p>
                  <WheelPicker
                    label="质量等级"
                    options={['糟糕', '一般', '良好', '极佳']}
                    value={quality}
                    onChange={(value) => setQuality(value as SleepQuality)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsNapExpanded((prev) => !prev)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
          >
            <span className="text-sm font-medium text-slate-800">白天小睡</span>
            {isNapExpanded ? (
              <ChevronDown size={18} className="text-slate-500" />
            ) : (
              <ChevronRight size={18} className="text-slate-500" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {isNapExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-4 space-y-6 border-t border-slate-100 overflow-hidden"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">睡眠时长</p>
                  <div className="grid grid-cols-2 gap-3">
                    <WheelPicker label="小时" options={HOURS} value={napHour} onChange={setNapHour} loop />
                    <WheelPicker label="分钟" options={MINUTES} value={napMinute} onChange={setNapMinute} loop />
                  </div>
                  <p className="text-xs text-slate-500 mt-3">当前：{napDurationText}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">睡眠质量</p>
                  <WheelPicker
                    label="质量等级"
                    options={['糟糕', '一般', '良好', '极佳']}
                    value={napQuality}
                    onChange={(value) => setNapQuality(value as SleepQuality)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ModalShell>
  );
};

export const DietRecordModal = ({ isOpen, onClose, onConfirm }: QuickRecordModalProps) => {
  const [stapleFood, setStapleFood] = useState('不记');
  const [stapleQty, setStapleQty] = useState('不记');
  const [proteinFood, setProteinFood] = useState('不记');
  const [proteinQty, setProteinQty] = useState('不记');
  const [vegetableFood, setVegetableFood] = useState('不记');
  const [vegetableQty, setVegetableQty] = useState('不记');
  const [fruitFood, setFruitFood] = useState('不记');
  const [fruitQty, setFruitQty] = useState('不记');
  const [otherFood, setOtherFood] = useState('不记');
  const [otherQty, setOtherQty] = useState('不记');

  const buildSegment = (name: string, food: string, qty: string) => {
    if (food === '不记') return null;
    if (qty === '不记') return `${name} ${food}`;
    return `${name} ${food}(${qty})`;
  };

  const handleConfirm = () => {
    const segments = [
      buildSegment('主食', stapleFood, stapleQty),
      buildSegment('蛋白质', proteinFood, proteinQty),
      buildSegment('蔬菜', vegetableFood, vegetableQty),
      buildSegment('水果', fruitFood, fruitQty),
      buildSegment('其他', otherFood, otherQty)
    ].filter(Boolean) as string[];

    const summary = segments.length > 0 ? `饮食记录：${segments.join('；')}。` : '饮食记录：不记具体内容。';
    onConfirm(summary);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="饮食记录"
      description="每个类别都支持滑动选择食物种类和粗略量化。"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">主食</p>
          <div className="grid grid-cols-2 gap-3">
            <WheelPicker label="食物" options={DIET_OPTIONS.staple} value={stapleFood} onChange={setStapleFood} />
            <WheelPicker label="量化" options={QUANTITY_OPTIONS} value={stapleQty} onChange={setStapleQty} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">蛋白质</p>
          <div className="grid grid-cols-2 gap-3">
            <WheelPicker label="食物" options={DIET_OPTIONS.protein} value={proteinFood} onChange={setProteinFood} />
            <WheelPicker label="量化" options={QUANTITY_OPTIONS} value={proteinQty} onChange={setProteinQty} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">蔬菜</p>
          <div className="grid grid-cols-2 gap-3">
            <WheelPicker label="食物" options={DIET_OPTIONS.vegetable} value={vegetableFood} onChange={setVegetableFood} />
            <WheelPicker label="量化" options={QUANTITY_OPTIONS} value={vegetableQty} onChange={setVegetableQty} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">水果</p>
          <div className="grid grid-cols-2 gap-3">
            <WheelPicker label="食物" options={DIET_OPTIONS.fruit} value={fruitFood} onChange={setFruitFood} />
            <WheelPicker label="量化" options={QUANTITY_OPTIONS} value={fruitQty} onChange={setFruitQty} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">其他</p>
          <div className="grid grid-cols-2 gap-3">
            <WheelPicker label="食物" options={DIET_OPTIONS.other} value={otherFood} onChange={setOtherFood} />
            <WheelPicker label="量化" options={QUANTITY_OPTIONS} value={otherQty} onChange={setOtherQty} />
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export const ExerciseRecordModal = ({ isOpen, onClose, onConfirm }: QuickRecordModalProps) => {
  const [aerobicType, setAerobicType] = useState('不记');
  const [aerobicDuration, setAerobicDuration] = useState('不记');
  const [aerobicDistance, setAerobicDistance] = useState('不记');
  const [anaerobicType, setAnaerobicType] = useState('不记');
  const [anaerobicCount, setAnaerobicCount] = useState('不记');

  const handleConfirm = () => {
    const sections: string[] = [];

    if (aerobicType !== '不记') {
      const aerobicDetail = [aerobicDuration, aerobicDistance].filter((item) => item !== '不记');
      sections.push(`有氧 ${aerobicType}${aerobicDetail.length > 0 ? `(${aerobicDetail.join('，')})` : ''}`);
    }

    if (anaerobicType !== '不记') {
      sections.push(`无氧 ${anaerobicType}${anaerobicCount !== '不记' ? `(${anaerobicCount})` : ''}`);
    }

    const summary = sections.length > 0 ? `运动记录：${sections.join('；')}。` : '运动记录：不记具体内容。';
    onConfirm(summary);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="运动记录"
      description="分有氧和无氧两类；有氧支持时长和距离，无氧支持个数。"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">有氧运动</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <WheelPicker label="类型" options={AEROBIC_OPTIONS} value={aerobicType} onChange={setAerobicType} />
            <WheelPicker label="时间" options={AEROBIC_DURATION_OPTIONS} value={aerobicDuration} onChange={setAerobicDuration} />
            <WheelPicker label="距离" options={AEROBIC_DISTANCE_OPTIONS} value={aerobicDistance} onChange={setAerobicDistance} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">无氧运动</p>
          <div className="grid grid-cols-2 gap-3">
            <WheelPicker label="类型" options={ANAEROBIC_OPTIONS} value={anaerobicType} onChange={setAnaerobicType} />
            <WheelPicker label="个数" options={ANAEROBIC_COUNT_OPTIONS} value={anaerobicCount} onChange={setAnaerobicCount} />
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
