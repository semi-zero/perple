import { ChevronDown, Sliders, Star, Zap, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Fragment } from 'react';

const OptimizationModes = [
  {
    key: 'speed',
    title: 'Speed',
    description: 'Prioritize speed and get the quickest possible answer.',
    icon: <Zap size={20} className="text-[#FF9800]" />,
  },
  {
    key: 'balanced',
    title: 'Balanced',
    description: 'Find the right balance between speed and accuracy',
    icon: <Sliders size={20} className="text-[#4CAF50]" />,
  },
  {
    key: 'quality',
    title: 'Quality (Soon)',
    description: 'Get the most thorough and accurate answer',
    icon: (
      <Star
        size={20}
        className="text-[#2196F3] dark:text-[#BBDEFB] fill-[#BBDEFB] dark:fill-[#2196F3]"
      />
    ),
  },
  {
    key: 'rnd',
    title: 'DGS',
    description: '연구소 DGS 데이터',
    icon: (
      <Star
        size={20}
        className="text-[#2196F3] dark:text-[#BBDEFB] fill-[#BBDEFB] dark:fill-[#2196F3]"
      />
    ),
  },
  {
    key: 'sb',
    title: 'SB',
    description: '소형 개발실 R&D 데이터',
    icon: (
      <Star
        size={20}
        className="text-[#2196F3] dark:text-[#BBDEFB] fill-[#BBDEFB] dark:fill-[#2196F3]"
      />
    ),
  },
  {
    key: 'aeb',
    title: 'AEB',
    description: '중대형 개발실 R&D 데이터',
    icon: (
      <Star
        size={20}
        className="text-[#2196F3] dark:text-[#BBDEFB] fill-[#BBDEFB] dark:fill-[#2196F3]"
      />
    ),
  },
];

const getOptimizationModesByFocusMode = (focusMode: string) => {
  switch (focusMode) {
    case 'academicSearch':
      return OptimizationModes.filter(mode => ['speed', 'balanced'].includes(mode.key));
    case 'pipelineSearch':
      return OptimizationModes.filter(mode => ['rnd', 'sb', 'aeb'].includes(mode.key)); // 모든 모드 표시
    default:
      return OptimizationModes;
  }
};

const Optimization = ({
  optimizationMode,
  setOptimizationMode,
  focusMode,
  isEmptyChat
}: {
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  focusMode: string;
  isEmptyChat: boolean;
}) => {
  const filteredModes = getOptimizationModesByFocusMode(focusMode);
  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        className="text-gray-900 dark:text-white bg-white dark:bg-dark-800 rounded-2xl p-2 border border-light-200 dark:border-dark-200 dark:border-dark-200 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition duration-200"
      >
        <div className="flex flex-row items-center space-x-1">
          {
            OptimizationModes.find((mode) => mode.key === optimizationMode)
              ?.icon
          }
          <p className="text-xs font-medium">
            {
              OptimizationModes.find((mode) => mode.key === optimizationMode)
                ?.title
            }
          </p>
          {isEmptyChat ? <ChevronDown size={20} className="-translate-x-1" /> : <ChevronUp size={20} className="-translate-x-1" />}
        </div>
      </PopoverButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className={`absolute z-10 w-64 md:w-[200px] left-0
            ${isEmptyChat ? ""
            :'bottom-full'}
            `}>
          <div className="flex flex-col gap-2 bg-white dark:bg-dark-800 border rounded-2xl border-light-200 dark:border-dark-200 w-full p-4 max-h-[200px] md:max-h-none overflow-y-auto">
            {filteredModes.map((mode, i) => (
              <PopoverButton
                onClick={() => setOptimizationMode(mode.key)}
                key={i}
                className={cn(
                  'p-2 rounded-lg flex flex-col items-start justify-start text-start space-y-2 duration-200 cursor-pointer transition ',
                  optimizationMode === mode.key
                  ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-black'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700',
                )}
              >
                <div className="flex flex-row items-center space-x-1 text-black dark:text-white">
                  {mode.icon}
                  <p className="text-sm font-medium">{mode.title}</p>
                </div>
                <p className="text-black/70 dark:text-white/70 text-xs">
                  {mode.description}
                </p>
              </PopoverButton>
            ))}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default Optimization;
