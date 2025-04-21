import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Attach from './MessageInputActions/Attach';

import { File } from './ChatWindow';

import Focus from './MessageInputActions/Focus';
import Optimization from './MessageInputActions/Optimization';
import AcademicSearchFields from './MessageInputActions/AcademicSearchFields'; // <-- 분리된 컴포넌트를 가져옵니다.


interface ExtraMessage {
  field1: string;
  field2: string;
  field3: string;
}

const MessageInput = ({
  sendMessage,
  loading,
  fileIds,
  setFileIds,
  files,
  setFiles,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  extraMessage,
  setExtraMessage
}: {
  sendMessage: (message: string) => void;
  loading: boolean;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  extraMessage: ExtraMessage;
  setExtraMessage: React.Dispatch<React.SetStateAction<ExtraMessage>>; 
}) => {
  const [copilotEnabled, setCopilotEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [textareaRows, setTextareaRows] = useState(1);
  const [mode, setMode] = useState<'multi' | 'single'>('single');

  useEffect(() => {
    if (textareaRows >= 2 && message && mode === 'single') {
      setMode('multi');
    } else if (!message && mode === 'multi') {
      setMode('single');
    }
  }, [textareaRows, mode, message]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  ////////////////////화살표 방향 기능////////////////////
  const [isEmptyChat, setIsEmptyChat] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(message);
          setMessage('');
        }
      }}
      className="w-full"
    >
      <div className="flex flex-col bg-white dark:bg-dark-800 shadow-md rounded-3xl 
      p-4 border border-light-200 dark:border-dark-200">

        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={2}
          className="bg-transparent placeholder-gray-500 dark:placeholder-gray-400 
          text-lg text-gray-900 dark:text-white resize-none focus:outline-none w-full"
          placeholder="무엇을 도와드릴까요?"
        />

        {/* agentSimulator 모드일 때만 학술 검색 정보 섹션 렌더링 */}
        {focusMode === 'agentSimulator' && (
          <AcademicSearchFields
            extraMessage={extraMessage}
            setExtraMessage={setExtraMessage}
          />
        )}

        <div className="flex flex-row items-center space-x-2 mt-4 lg:space-x-4">
          <Focus 
          focusMode={focusMode} 
          setFocusMode={setFocusMode} 
          isEmptyChat={isEmptyChat}/>

          <div className="flex flex-row items-center space-x-1 sm:space-x-4">
            {(!focusMode || focusMode === 'academicSearch') && (
              <Attach
                fileIds={fileIds}
                setFileIds={setFileIds}
                files={files}
                setFiles={setFiles}
                showText
              />
            )}
            {focusMode === 'pipelineSearch' && (
              <Optimization
                optimizationMode={optimizationMode}
                setOptimizationMode={setOptimizationMode}
                focusMode={focusMode}
                isEmptyChat={isEmptyChat}/>
            )}
          </div>

          <button
            disabled={!message.trim()}
            className="bg-brand-500 text-white disabled:bg-gray-300 rounded-full p-2 hover:bg-brand-600 transition"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
