import {
  BadgePercent,
  ChevronDown,
  Globe,
  Pencil,
  ScanEye,
  SwatchBook,
  Atom,
  ChevronUp,
  BotMessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { SiReddit, SiYoutube } from '@icons-pack/react-simple-icons';
import { Fragment } from 'react';

export const focusModes = [
  // {
  //   key: 'webSearch',
  //   title: 'All',
  //   description: 'Searches across all of the internet',
  //   icon: <Globe size={20} />,
  // },
  {
    key: 'writingAssistant',
    title: '글쓰기',
    description: '텍스트 생성 또는 채팅',
    icon: <BotMessageSquare size={16} />,
  },
  {
    key: 'pipelineSearch',
    title: 'Pipeline 검색',
    description: '파이프라인에서 R&D 데이터 검색',
    icon: <Globe size={20} />,
  },
  {
    key: 'academicSearch',
    title: '논문 검색',
    description: '최신 배터리 논문 검색',
    icon: <SwatchBook size={20} />,
  },
  {
    key: 'agentSimulator',
    title: '시뮬레이터 작동',
    description: '시뮬레이션 실행',
    icon: <Atom size={20} />,
  },
  // {
  //   key: 'wolframAlphaSearch',
  //   title: 'Wolfram Alpha',
  //   description: 'Computational knowledge engine',
  //   icon: <BadgePercent size={20} />,
  // },
  // {
  //   key: 'youtubeSearch',
  //   title: 'Youtube',
  //   description: 'Search and watch videos',
  //   icon: (
  //     <SiYoutube
  //       className="h-5 w-auto mr-0.5"
  //       onPointerEnterCapture={undefined}
  //       onPointerLeaveCapture={undefined}
  //     />
  //   ),
  // },
];

const Focus = ({
  focusMode,
  setFocusMode,
  isEmptyChat
}: {
  focusMode: string;
  setFocusMode: (mode: string) => void;
  isEmptyChat: boolean;
}) => {
  return (
    <Popover className="relative w-full">
      <PopoverButton
        type="button"
        className="text-brand-500 dark:text-white bg-white dark:bg-dark-800 rounded-2xl p-2 border border-light-200 dark:border-dark-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition duration-200"
      >
        {focusMode !== 'webSearch' ? (
          <div className="flex flex-row items-center space-x-1">
            {focusModes.find((mode) => mode.key === focusMode)?.icon}
            <p className="text-xs font-medium hidden lg:block">
              {focusModes.find((mode) => mode.key === focusMode)?.title}
            </p>
            {isEmptyChat ? <ChevronDown size={20} className="-translate-x-1" /> : <ChevronUp size={20} className="-translate-x-1" />}
          </div>
        ) : (
          <div className="flex flex-row items-center space-x-1">
            <ScanEye size={20} />
            <p className="text-xs font-medium hidden lg:block">모드</p>
          </div>
        )}
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
        <PopoverPanel className={`absolute z-10 w-64 md:w-[500px] left-0
            ${isEmptyChat ? ""
            :'bottom-full'}
            `}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-white dark:bg-dark-800 border rounded-2xl border-light-200 dark:border-dark-200 w-full p-4 max-h-[200px] md:max-h-none overflow-y-auto">
            {focusModes.map((mode, i) => (
              <PopoverButton
                onClick={() => setFocusMode(mode.key)}
                key={i}
                className={cn(
                  'p-2 rounded-lg flex flex-col items-start justify-start text-start space-y-2 hover:bg-gray-100 dark:hover:bg-gray-700 duration-200 cursor-pointer transition',
                  focusMode === mode.key
                  ? 'bg-gray-100 dark:bg-gray-700 text-brand-500 dark:text-black'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                )}
              >
                <div
                  className={cn(
                    'flex flex-row items-center space-x-1',
                    focusMode === mode.key
                  )}
                >
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

export default Focus;
