import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import CopilotToggle from './MessageInputActions/Copilot';
import Focus from './MessageInputActions/Focus';
import Optimization from './MessageInputActions/Optimization';
import Attach from './MessageInputActions/Attach';
import { File } from './ChatWindow';

const EmptyChatMessageInput = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      className="w-full"
    >
      <div className="flex flex-col bg-white dark:bg-dark-800 shadow-lg rounded-2xl p-4 border border-light-200 dark:border-dark-200">
        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={2}
          className="bg-transparent placeholder-gray-500 dark:placeholder-gray-400 text-lg text-gray-900 dark:text-white resize-none focus:outline-none w-full"
          placeholder="무엇을 도와드릴까요?"
        />
        <div className="flex items-center justify-between mt-4">
          <Focus focusMode={focusMode} setFocusMode={setFocusMode} />
          {/* Wrap Attach and Optimization inside a div for inline display */}
          <div className="flex items-center gap-2">
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
};

export default EmptyChatMessageInput;
