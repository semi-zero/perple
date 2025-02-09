import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState, FormEvent } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Focus from './MessageInputActions/Focus';
import Optimization from './MessageInputActions/Optimization';
import Attach from './MessageInputActions/Attach';
import AcademicSearchFields from './MessageInputActions/AcademicSearchFields'; // <-- 분리된 컴포넌트를 가져옵니다.
import { File } from './ChatWindow';

interface ExtraMessage {
  field1: string;
  field2: string;
  field3: string;
}

interface EmptyChatMessageInputProps {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  extraMessage: ExtraMessage;
  setExtraMessage: React.Dispatch<React.SetStateAction<ExtraMessage>>; 
}

export default function EmptyChatMessageInput({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
  extraMessage,
  setExtraMessage,
}: EmptyChatMessageInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // '/' 키 눌렀을 때 자동 포커스
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage(message);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col bg-white dark:bg-dark-800 shadow-lg rounded-3xl p-4 border border-light-200 dark:border-dark-200">

        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={2}
          className="bg-transparent placeholder-gray-500 dark:placeholder-gray-400 text-lg text-gray-900 dark:text-white resize-none focus:outline-none w-full"
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
          <Focus focusMode={focusMode} setFocusMode={setFocusMode} />

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
              />
            )}
          </div>

          <button
            disabled={!message.trim()}
            className="bg-blue-500 text-white disabled:bg-gray-300 rounded-full p-2 hover:bg-blue-600 transition"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </form>
  );
}
