import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronRight, PenLine, Trash2, X } from 'lucide-react';

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
  visibleRows?: number;
}

const ITEM_HEIGHT = 48;
const DEFAULT_VISIBLE_ROWS = 5;
const LOOP_REPEAT = 5;
const LOOP_MIDDLE = Math.floor(LOOP_REPEAT / 2);

const HOURS = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'));

const PORTION_OPTIONS = ['不记', '小份', '半份', '一份', '两份'];
const SIZE_OPTIONS = ['小', '中', '大'];

const DIET_OPTIONS = {
  staple: ['不记', '米饭', '红薯', '玉米', '面条', '炒粉'],
  protein: ['不记', '鸡蛋', '大豆', '猪肉', '豆腐类', '鸡肉', '鸭肉', '牛肉', '鱼肉', '章鱼', '生蚝'],
  vegetable: ['不记', '白菜', '芥菜', '番茄', '红萝卜', '白萝卜', '莴苣', '花菜', '南瓜', '冬瓜', '云南小瓜', '蘑菇', '木耳', '青椒', '豆芽'],
  fruit: ['不记', '沃柑', '砂糖橘', '圣女果', '香蕉', '苹果'],
  beverage: ['不记', '奶茶', '可乐', '冰红茶'],
  snack: ['不记', '蛋糕', '饼干', '面包', '辣条', '手抓饼', '糖果'],
  other: ['不记', '酸菜', '酸笋']
};
type DietSectionKey = keyof typeof DIET_OPTIONS;

const DIET_SECTION_LABELS: Record<DietSectionKey, string> = {
  staple: '主食',
  protein: '蛋白质',
  vegetable: '蔬菜',
  fruit: '水果',
  beverage: '饮料',
  snack: '零食',
  other: '其他'
};

const STAPLE_MULTI_UNIT_FOODS = new Set(['米饭', '面条', '炒粉']);
const STAPLE_ROOT_FOODS = new Set(['红薯', '玉米']);

const AEROBIC_OPTIONS = ['不记', '跑步', '散步', '骑行', '跳绳', '老年Disco'];
const ANAEROBIC_OPTIONS = ['不记', '波比跳', '深蹲', '俯卧撑', '哑铃', '引体向上', '仰卧起坐', '仰背', '开合跳', '摸脚尖', '仰头'];

const WheelPicker = ({ label, options, value, onChange, loop = false, visibleRows = DEFAULT_VISIBLE_ROWS }: WheelPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollStopTimerRef = useRef<number>();
  const loopResetTimerRef = useRef<number>();
  const normalizedRows = Math.max(3, visibleRows);
  const topBottomSpace = ITEM_HEIGHT * Math.floor(normalizedRows / 2);
  const pickerHeight = ITEM_HEIGHT * normalizedRows;

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
          className="overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ height: pickerHeight }}
        >
          <div style={{ height: topBottomSpace }} />
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
          <div style={{ height: topBottomSpace }} />
        </div>

        <div className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 h-12 rounded-xl border border-slate-200 bg-slate-50/70" />
      </div>
    </div>
  );
};

interface CountInputProps {
  label: string;
  unit: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const CountInput = ({ label, unit, value, placeholder = '__', onChange }: CountInputProps) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 mb-2 ml-1">{label}</p>
      <div className="h-12 rounded-xl border border-slate-200 bg-white px-3 flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          className="flex-1 min-w-0 bg-transparent text-slate-800 text-sm outline-none"
        />
        <span className="text-sm text-slate-500 whitespace-nowrap">{unit}</span>
      </div>
    </div>
  );
};

interface TextInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const TextInput = ({ label, value, placeholder = '可选', onChange }: TextInputProps) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 mb-2 ml-1">{label}</p>
      <div className="h-12 rounded-xl border border-slate-200 bg-white px-3 flex items-center">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-slate-800 text-sm outline-none"
        />
      </div>
    </div>
  );
};

interface TimeInputProps {
  label: string;
  hourValue: string;
  minuteValue: string;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
}

const TimeInput = ({ label, hourValue, minuteValue, onHourChange, onMinuteChange }: TimeInputProps) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 mb-2 ml-1">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded-xl border border-slate-200 bg-white px-3 flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={hourValue}
            placeholder="__"
            onChange={(e) => onHourChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
            className="flex-1 min-w-0 bg-transparent text-slate-800 text-sm outline-none"
          />
          <span className="text-sm text-slate-500 whitespace-nowrap">时</span>
        </div>
        <div className="h-12 rounded-xl border border-slate-200 bg-white px-3 flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={minuteValue}
            placeholder="__"
            onChange={(e) => onMinuteChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
            className="flex-1 min-w-0 bg-transparent text-slate-800 text-sm outline-none"
          />
          <span className="text-sm text-slate-500 whitespace-nowrap">分</span>
        </div>
      </div>
    </div>
  );
};

interface FoodOptionGridProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

const FoodOptionGrid = ({ label, options, value, onChange }: FoodOptionGridProps) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 mb-2 ml-1">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => (
          <button
            key={`${label}-${option}`}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-lg border px-2 py-2 text-xs sm:text-sm font-medium transition-colors ${
              option === value
                ? 'border-slate-700 bg-slate-50 text-slate-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({ title, expanded, onToggle, children }: CollapsibleSectionProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
      >
        <span className="text-sm font-medium text-slate-800">{title}</span>
        {expanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-4 space-y-4 border-t border-slate-100 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ConfirmedFoodListProps {
  title: string;
  items: string[];
  onDelete?: (index: number) => void;
  onEdit?: (index: number, nextValue: string) => void;
}

const ConfirmedFoodList = ({ title, items, onDelete, onEdit }: ConfirmedFoodListProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500 mb-2">{title}</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${title}-${item}-${index}`}
            className="rounded-lg bg-white border border-slate-200 px-2.5 py-2 flex items-center gap-2"
          >
            {editingIndex === index ? (
              <>
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="flex-1 min-w-0 text-xs text-slate-700 outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = editingValue.trim();
                    if (next && onEdit) onEdit(index, next);
                    setEditingIndex(null);
                    setEditingValue('');
                  }}
                  className="p-1 rounded text-slate-500 hover:bg-slate-100"
                  title="保存修改"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    setEditingValue('');
                  }}
                  className="p-1 rounded text-slate-500 hover:bg-slate-100"
                  title="取消修改"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 min-w-0 text-xs text-slate-700 break-all">{item}</span>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(index);
                      setEditingValue(item);
                    }}
                    className="p-1 rounded text-slate-500 hover:bg-slate-100"
                    title="修改"
                  >
                    <PenLine size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(index)}
                    className="p-1 rounded text-slate-500 hover:bg-slate-100"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
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

  const toBoundedInt = (value: string, max: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(max, Math.max(0, Math.floor(parsed)));
  };

  const formatClock = (hour: number, minute: number) =>
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const sleepDuration = useMemo(() => {
    const bedHourNum = toBoundedInt(bedHour, 23);
    const bedMinuteNum = toBoundedInt(bedMinute, 59);
    const wakeHourNum = toBoundedInt(wakeHour, 23);
    const wakeMinuteNum = toBoundedInt(wakeMinute, 59);
    const bedTotal = bedHourNum * 60 + bedMinuteNum;
    const wakeTotal = wakeHourNum * 60 + wakeMinuteNum;
    let durationMinutes = wakeTotal - bedTotal;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const text = `${hours}小时${minutes}分钟`;
    return { durationMinutes, text };
  }, [bedHour, bedMinute, wakeHour, wakeMinute]);

  const napHourNum = toBoundedInt(napHour, 23);
  const napMinuteNum = toBoundedInt(napMinute, 59);
  const napDurationMinutes = napHourNum * 60 + napMinuteNum;
  const napDurationText = `${napHourNum.toString().padStart(2, '0')}时${napMinuteNum.toString().padStart(2, '0')}分`;

  const handleConfirm = () => {
    const bedHourNum = toBoundedInt(bedHour, 23);
    const bedMinuteNum = toBoundedInt(bedMinute, 59);
    const wakeHourNum = toBoundedInt(wakeHour, 23);
    const wakeMinuteNum = toBoundedInt(wakeMinute, 59);
    const napSummary =
      napDurationMinutes > 0
        ? `白天小睡：睡眠时长 ${napDurationText}，睡眠质量 ${napQuality}`
        : '白天小睡：不记';
    const summary = `睡眠记录：夜晚睡眠：入睡时间 ${formatClock(bedHourNum, bedMinuteNum)}，起床时间 ${formatClock(wakeHourNum, wakeMinuteNum)}，总睡眠时长 ${sleepDuration.text}，睡眠质量 ${quality}；${napSummary}。`;
    onConfirm(summary);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="睡眠记录"
      description="时间使用填空输入（__时__分），并自动计算总睡眠时长。"
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
                <TimeInput
                  label="入睡时间"
                  hourValue={bedHour}
                  minuteValue={bedMinute}
                  onHourChange={setBedHour}
                  onMinuteChange={setBedMinute}
                />

                <TimeInput
                  label="起床时间"
                  hourValue={wakeHour}
                  minuteValue={wakeMinute}
                  onHourChange={setWakeHour}
                  onMinuteChange={setWakeMinute}
                />

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">总睡眠时长（自动计算）</p>
                  <p className="text-base font-semibold text-slate-800 mt-1">{sleepDuration.text}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">睡眠质量</p>
                  <FoodOptionGrid
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
                  <TimeInput
                    label="睡眠时长"
                    hourValue={napHour}
                    minuteValue={napMinute}
                    onHourChange={setNapHour}
                    onMinuteChange={setNapMinute}
                  />
                  <p className="text-xs text-slate-500 mt-3">当前：{napDurationText}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">睡眠质量</p>
                  <FoodOptionGrid
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
  const [stapleLiang, setStapleLiang] = useState('');
  const [stapleBowl, setStapleBowl] = useState('');
  const [staplePart, setStaplePart] = useState('');
  const [stapleSize, setStapleSize] = useState('中');
  const [stapleRootCount, setStapleRootCount] = useState('');
  const [proteinFood, setProteinFood] = useState('不记');
  const [proteinCount, setProteinCount] = useState('');
  const [proteinPortion, setProteinPortion] = useState('不记');
  const [proteinCustom, setProteinCustom] = useState('');
  const [vegetableFood, setVegetableFood] = useState('不记');
  const [vegetablePortion, setVegetablePortion] = useState('不记');
  const [vegetableCustom, setVegetableCustom] = useState('');
  const [fruitFood, setFruitFood] = useState('不记');
  const [fruitCount, setFruitCount] = useState('');
  const [beverageFood, setBeverageFood] = useState('不记');
  const [beveragePortion, setBeveragePortion] = useState('不记');
  const [beverageCustom, setBeverageCustom] = useState('');
  const [snackFood, setSnackFood] = useState('不记');
  const [snackPortion, setSnackPortion] = useState('不记');
  const [snackCustom, setSnackCustom] = useState('');
  const [otherFood, setOtherFood] = useState('不记');
  const [otherPortion, setOtherPortion] = useState('不记');
  const [otherCustom, setOtherCustom] = useState('');
  const [confirmedFoods, setConfirmedFoods] = useState<Record<DietSectionKey, string[]>>({
    staple: [],
    protein: [],
    vegetable: [],
    fruit: [],
    beverage: [],
    snack: [],
    other: []
  });
  const [expandedSections, setExpandedSections] = useState({
    staple: false,
    protein: false,
    vegetable: false,
    fruit: false,
    beverage: false,
    snack: false,
    other: false
  });

  useEffect(() => {
    if (!isOpen) return;
    setExpandedSections({
      staple: false,
      protein: false,
      vegetable: false,
      fruit: false,
      beverage: false,
      snack: false,
      other: false
    });
  }, [isOpen]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => {
      const willExpand = !prev[section];
      return {
        staple: false,
        protein: false,
        vegetable: false,
        fruit: false,
        beverage: false,
        snack: false,
        other: false,
        [section]: willExpand
      };
    });
  };

  const toPositiveInt = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  };

  const buildStapleQty = () => {
    if (STAPLE_MULTI_UNIT_FOODS.has(stapleFood)) {
      const parts = [
        toPositiveInt(stapleLiang) > 0 ? `${toPositiveInt(stapleLiang)}两` : '',
        toPositiveInt(stapleBowl) > 0 ? `${toPositiveInt(stapleBowl)}碗` : '',
        toPositiveInt(staplePart) > 0 ? `${toPositiveInt(staplePart)}份` : ''
      ].filter(Boolean) as string[];
      return parts.join('、');
    }

    if (STAPLE_ROOT_FOODS.has(stapleFood)) {
      const parts = [
        `尺寸${stapleSize}`,
        toPositiveInt(stapleRootCount) > 0 ? `${toPositiveInt(stapleRootCount)}根` : ''
      ].filter(Boolean) as string[];
      return parts.join('、');
    }

    return '';
  };

  const buildProteinQty = () => {
    if (proteinFood === '鸡蛋') {
      return toPositiveInt(proteinCount) > 0 ? `${toPositiveInt(proteinCount)}个` : '';
    }
    const parts = [
      proteinPortion !== '不记' ? proteinPortion : '',
      proteinCustom.trim()
    ].filter(Boolean) as string[];
    return parts.join('、');
  };

  const buildVegetableQty = () => {
    const parts = [
      vegetablePortion !== '不记' ? vegetablePortion : '',
      vegetableCustom.trim()
    ].filter(Boolean) as string[];
    return parts.join('、');
  };

  const buildFruitQty = () => {
    return toPositiveInt(fruitCount) > 0 ? `${toPositiveInt(fruitCount)}个` : '';
  };

  const buildPortionWithCustom = (portion: string, custom: string) => {
    const parts = [portion !== '不记' ? portion : '', custom.trim()].filter(Boolean) as string[];
    return parts.join('、');
  };

  const createFoodItem = (food: string, qty: string) => {
    if (!qty || qty === '不记') return food;
    return `${food}(${qty})`;
  };

  const addConfirmedFood = (section: DietSectionKey, item: string) => {
    setConfirmedFoods((prev) => ({
      ...prev,
      [section]: [...prev[section], item]
    }));
  };

  const removeConfirmedFood = (section: DietSectionKey, index: number) => {
    setConfirmedFoods((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const updateConfirmedFood = (section: DietSectionKey, index: number, nextValue: string) => {
    setConfirmedFoods((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) => (i === index ? nextValue : item))
    }));
  };

  const handleAddStapleFood = () => {
    if (stapleFood === '不记') return;
    addConfirmedFood('staple', createFoodItem(stapleFood, buildStapleQty()));
    setStapleFood('不记');
    setStapleLiang('');
    setStapleBowl('');
    setStaplePart('');
    setStapleSize('中');
    setStapleRootCount('');
  };

  const handleAddProteinFood = () => {
    if (proteinFood === '不记') return;
    addConfirmedFood('protein', createFoodItem(proteinFood, buildProteinQty()));
    setProteinFood('不记');
    setProteinCount('');
    setProteinPortion('不记');
    setProteinCustom('');
  };

  const handleAddVegetableFood = () => {
    if (vegetableFood === '不记') return;
    addConfirmedFood('vegetable', createFoodItem(vegetableFood, buildVegetableQty()));
    setVegetableFood('不记');
    setVegetablePortion('不记');
    setVegetableCustom('');
  };

  const handleAddFruitFood = () => {
    if (fruitFood === '不记') return;
    addConfirmedFood('fruit', createFoodItem(fruitFood, buildFruitQty()));
    setFruitFood('不记');
    setFruitCount('');
  };

  const handleAddBeverageFood = () => {
    if (beverageFood === '不记') return;
    addConfirmedFood('beverage', createFoodItem(beverageFood, buildPortionWithCustom(beveragePortion, beverageCustom)));
    setBeverageFood('不记');
    setBeveragePortion('不记');
    setBeverageCustom('');
  };

  const handleAddSnackFood = () => {
    if (snackFood === '不记') return;
    addConfirmedFood('snack', createFoodItem(snackFood, buildPortionWithCustom(snackPortion, snackCustom)));
    setSnackFood('不记');
    setSnackPortion('不记');
    setSnackCustom('');
  };

  const handleAddOtherFood = () => {
    if (otherFood === '不记') return;
    addConfirmedFood('other', createFoodItem(otherFood, buildPortionWithCustom(otherPortion, otherCustom)));
    setOtherFood('不记');
    setOtherPortion('不记');
    setOtherCustom('');
  };

  const allConfirmedFoods = useMemo(
    () =>
      (Object.keys(DIET_SECTION_LABELS) as DietSectionKey[]).flatMap((section) =>
        confirmedFoods[section].map((item) => `${DIET_SECTION_LABELS[section]}·${item}`)
      ),
    [confirmedFoods]
  );

  const handleConfirm = () => {
    const circled = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
    const segmentPayloads = (Object.keys(DIET_SECTION_LABELS) as DietSectionKey[])
      .map((section) => {
        const items = confirmedFoods[section];
        if (items.length === 0) return null;
        return {
          label: DIET_SECTION_LABELS[section],
          text: `${DIET_SECTION_LABELS[section]}：${items.join('、')}`
        };
      })
      .filter(Boolean) as { label: string; text: string }[];

    const segments = segmentPayloads.map((segment, index) => {
      const prefix = circled[index] || `${index + 1}、`;
      return `${prefix}${segment.text}`;
    });

    const summary = segments.length > 0 ? `饮食记录：${segments.join('；')}。` : '饮食记录：不记具体内容。';
    onConfirm(summary);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="饮食记录"
      description="按食物类型提供不同量化方式，支持更细化记录。"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="space-y-6">
        <CollapsibleSection title="主食" expanded={expandedSections.staple} onToggle={() => toggleSection('staple')}>
          <FoodOptionGrid label="食物" options={DIET_OPTIONS.staple} value={stapleFood} onChange={setStapleFood} />
          {STAPLE_MULTI_UNIT_FOODS.has(stapleFood) && (
            <div className="grid grid-cols-3 gap-3">
              <CountInput label="两" unit="两" value={stapleLiang} onChange={setStapleLiang} />
              <CountInput label="碗" unit="碗" value={stapleBowl} onChange={setStapleBowl} />
              <CountInput label="份" unit="份" value={staplePart} onChange={setStaplePart} />
            </div>
          )}
          {STAPLE_ROOT_FOODS.has(stapleFood) && (
            <div className="grid grid-cols-2 gap-3">
              <WheelPicker label="尺寸" options={SIZE_OPTIONS} value={stapleSize} onChange={setStapleSize} visibleRows={3} />
              <CountInput label="根数" unit="根" value={stapleRootCount} onChange={setStapleRootCount} />
            </div>
          )}
          {stapleFood !== '不记' && (
            <button
              type="button"
              onClick={handleAddStapleFood}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              确认加入
            </button>
          )}
          <ConfirmedFoodList
            title="已加入（主食）"
            items={confirmedFoods.staple}
            onDelete={(index) => removeConfirmedFood('staple', index)}
            onEdit={(index, next) => updateConfirmedFood('staple', index, next)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="蛋白质" expanded={expandedSections.protein} onToggle={() => toggleSection('protein')}>
          <FoodOptionGrid label="食物" options={DIET_OPTIONS.protein} value={proteinFood} onChange={setProteinFood} />
          {proteinFood === '鸡蛋' && (
            <CountInput label="个数" unit="个" value={proteinCount} onChange={setProteinCount} />
          )}
          {proteinFood !== '不记' && proteinFood !== '鸡蛋' && (
            <div className="grid grid-cols-2 gap-3">
              <WheelPicker label="份数" options={PORTION_OPTIONS} value={proteinPortion} onChange={setProteinPortion} visibleRows={3} />
              <TextInput label="自定义" value={proteinCustom} placeholder="自定义描述" onChange={setProteinCustom} />
            </div>
          )}
          {proteinFood !== '不记' && (
            <button
              type="button"
              onClick={handleAddProteinFood}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              确认加入
            </button>
          )}
          <ConfirmedFoodList
            title="已加入（蛋白质）"
            items={confirmedFoods.protein}
            onDelete={(index) => removeConfirmedFood('protein', index)}
            onEdit={(index, next) => updateConfirmedFood('protein', index, next)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="蔬菜" expanded={expandedSections.vegetable} onToggle={() => toggleSection('vegetable')}>
          <FoodOptionGrid label="食物" options={DIET_OPTIONS.vegetable} value={vegetableFood} onChange={setVegetableFood} />
          {vegetableFood !== '不记' && (
            <div className="grid grid-cols-2 gap-3">
              <WheelPicker label="份数" options={PORTION_OPTIONS} value={vegetablePortion} onChange={setVegetablePortion} visibleRows={3} />
              <TextInput label="自定义" value={vegetableCustom} placeholder="自定义描述" onChange={setVegetableCustom} />
            </div>
          )}
          {vegetableFood !== '不记' && (
            <button
              type="button"
              onClick={handleAddVegetableFood}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              确认加入
            </button>
          )}
          <ConfirmedFoodList
            title="已加入（蔬菜）"
            items={confirmedFoods.vegetable}
            onDelete={(index) => removeConfirmedFood('vegetable', index)}
            onEdit={(index, next) => updateConfirmedFood('vegetable', index, next)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="水果" expanded={expandedSections.fruit} onToggle={() => toggleSection('fruit')}>
          <FoodOptionGrid label="食物" options={DIET_OPTIONS.fruit} value={fruitFood} onChange={setFruitFood} />
          {fruitFood !== '不记' && (
            <CountInput label="个数" unit="个" value={fruitCount} onChange={setFruitCount} />
          )}
          {fruitFood !== '不记' && (
            <button
              type="button"
              onClick={handleAddFruitFood}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              确认加入
            </button>
          )}
          <ConfirmedFoodList
            title="已加入（水果）"
            items={confirmedFoods.fruit}
            onDelete={(index) => removeConfirmedFood('fruit', index)}
            onEdit={(index, next) => updateConfirmedFood('fruit', index, next)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="饮料" expanded={expandedSections.beverage} onToggle={() => toggleSection('beverage')}>
          <FoodOptionGrid label="食物" options={DIET_OPTIONS.beverage} value={beverageFood} onChange={setBeverageFood} />
          {beverageFood !== '不记' && (
            <div className="grid grid-cols-2 gap-3">
              <WheelPicker label="份数" options={PORTION_OPTIONS} value={beveragePortion} onChange={setBeveragePortion} visibleRows={3} />
              <TextInput label="自定义" value={beverageCustom} placeholder="自定义描述" onChange={setBeverageCustom} />
            </div>
          )}
          {beverageFood !== '不记' && (
            <button
              type="button"
              onClick={handleAddBeverageFood}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              确认加入
            </button>
          )}
          <ConfirmedFoodList
            title="已加入（饮料）"
            items={confirmedFoods.beverage}
            onDelete={(index) => removeConfirmedFood('beverage', index)}
            onEdit={(index, next) => updateConfirmedFood('beverage', index, next)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="零食" expanded={expandedSections.snack} onToggle={() => toggleSection('snack')}>
          <FoodOptionGrid label="食物" options={DIET_OPTIONS.snack} value={snackFood} onChange={setSnackFood} />
          {snackFood !== '不记' && (
            <div className="grid grid-cols-2 gap-3">
              <WheelPicker label="份数" options={PORTION_OPTIONS} value={snackPortion} onChange={setSnackPortion} visibleRows={3} />
              <TextInput label="自定义" value={snackCustom} placeholder="自定义描述" onChange={setSnackCustom} />
            </div>
          )}
          {snackFood !== '不记' && (
            <button
              type="button"
              onClick={handleAddSnackFood}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              确认加入
            </button>
          )}
          <ConfirmedFoodList
            title="已加入（零食）"
            items={confirmedFoods.snack}
            onDelete={(index) => removeConfirmedFood('snack', index)}
            onEdit={(index, next) => updateConfirmedFood('snack', index, next)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="其他" expanded={expandedSections.other} onToggle={() => toggleSection('other')}>
          <FoodOptionGrid label="食物" options={DIET_OPTIONS.other} value={otherFood} onChange={setOtherFood} />
          {otherFood !== '不记' && (
            <div className="grid grid-cols-2 gap-3">
              <WheelPicker label="份数" options={PORTION_OPTIONS} value={otherPortion} onChange={setOtherPortion} visibleRows={3} />
              <TextInput label="自定义" value={otherCustom} placeholder="自定义描述" onChange={setOtherCustom} />
            </div>
          )}
          {otherFood !== '不记' && (
            <button
              type="button"
              onClick={handleAddOtherFood}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              确认加入
            </button>
          )}
          <ConfirmedFoodList
            title="已加入（其他）"
            items={confirmedFoods.other}
            onDelete={(index) => removeConfirmedFood('other', index)}
            onEdit={(index, next) => updateConfirmedFood('other', index, next)}
          />
        </CollapsibleSection>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-sm font-medium text-slate-700 mb-3">全日已选食物（总览）</p>
          {allConfirmedFoods.length === 0 ? (
            <p className="text-xs text-slate-500">暂未确认食物，先在各板块点击“确认加入”。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allConfirmedFoods.map((item, index) => (
                <span
                  key={`all-food-${item}-${index}`}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

export const ExerciseRecordModal = ({ isOpen, onClose, onConfirm }: QuickRecordModalProps) => {
  const [aerobicType, setAerobicType] = useState('不记');
  const [aerobicAmount, setAerobicAmount] = useState('');
  const [aerobicCustom, setAerobicCustom] = useState('');
  const [anaerobicType, setAnaerobicType] = useState('不记');
  const [anaerobicAmount, setAnaerobicAmount] = useState('');
  const [anaerobicCustom, setAnaerobicCustom] = useState('');

  const toPositiveInt = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  };

  const getAerobicUnit = (type: string) => {
    if (type === '跳绳') return '个';
    return '分钟';
  };

  const getAnaerobicUnit = (type: string) => {
    if (type === '哑铃') return '组';
    return '个';
  };

  const handleConfirm = () => {
    const sections: string[] = [];

    if (aerobicType !== '不记') {
      const aerobicUnit = getAerobicUnit(aerobicType);
      const aerobicDetail = [
        toPositiveInt(aerobicAmount) > 0 ? `量化${toPositiveInt(aerobicAmount)}${aerobicUnit}` : '',
        aerobicCustom.trim()
      ].filter(Boolean) as string[];
      sections.push(`有氧 ${aerobicType}${aerobicDetail.length > 0 ? `(${aerobicDetail.join('，')})` : ''}`);
    }

    if (anaerobicType !== '不记') {
      const anaerobicUnit = getAnaerobicUnit(anaerobicType);
      const anaerobicDetail = [
        toPositiveInt(anaerobicAmount) > 0 ? `量化${toPositiveInt(anaerobicAmount)}${anaerobicUnit}` : '',
        anaerobicCustom.trim()
      ].filter(Boolean) as string[];
      sections.push(`无氧 ${anaerobicType}${anaerobicDetail.length > 0 ? `(${anaerobicDetail.join('，')})` : ''}`);
    }

    const summary = sections.length > 0 ? `运动记录：${sections.join('；')}。` : '运动记录：不记具体内容。';
    onConfirm(summary);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="运动记录"
      description="分有氧和无氧两类；项目使用按钮选择，量化改为数字填空并按项目匹配单位。"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">有氧运动</p>
          <div className="grid grid-cols-1 gap-3">
            <FoodOptionGrid label="项目" options={AEROBIC_OPTIONS} value={aerobicType} onChange={setAerobicType} />
            {aerobicType !== '不记' && (
              <div className="grid grid-cols-2 gap-3">
                <CountInput label="量化" unit={getAerobicUnit(aerobicType)} value={aerobicAmount} onChange={setAerobicAmount} />
                <TextInput label="自定义/额外描述" value={aerobicCustom} placeholder="自定义描述" onChange={setAerobicCustom} />
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">无氧运动</p>
          <div className="grid grid-cols-1 gap-3">
            <FoodOptionGrid label="项目" options={ANAEROBIC_OPTIONS} value={anaerobicType} onChange={setAnaerobicType} />
            {anaerobicType !== '不记' && (
              <div className="grid grid-cols-2 gap-3">
                <CountInput label="量化" unit={getAnaerobicUnit(anaerobicType)} value={anaerobicAmount} onChange={setAnaerobicAmount} />
                <TextInput label="自定义/额外描述" value={anaerobicCustom} placeholder="自定义描述" onChange={setAnaerobicCustom} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
