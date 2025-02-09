import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Attach from './MessageInputActions/Attach';
import CopilotToggle from './MessageInputActions/Copilot';
import { File } from './ChatWindow';
import AttachSmall from './MessageInputActions/AttachSmall';

const MessageInput = ({
  sendMessage,
  loading,
  fileIds,
  setFileIds,
  files,
  setFiles,
  focusMode,
}: {
  sendMessage: (message: string) => void;
  loading: boolean;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  focusMode: string;
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

  return (
    <form
      onSubmit={(e) => {
        if (loading) return;
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !loading) {
          e.preventDefault();
          sendMessage(message);
          setMessage('');
        }
      }}
      className={cn(
        'flex flex-col bg-white dark:bg-dark-800 shadow-lg rounded-2xl p-4 border border-light-200 dark:border-dark-200',
        mode === 'multi' ? 'flex-col rounded-lg' : 'flex-row rounded-full',
      )}
    >
      {mode === 'single' && focusMode === 'academicSearch' && (
        <AttachSmall
          fileIds={fileIds}
          setFileIds={setFileIds}
          files={files}
          setFiles={setFiles}
        />
      )}
      <TextareaAutosize
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onHeightChange={(height, props) => {
          setTextareaRows(Math.ceil(height / props.rowHeight));
        }}
        className="transition bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-sm text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none w-full px-2 max-h-24 lg:max-h-36 xl:max-h-48 flex-grow flex-shrink"
        placeholder="후속 질문하기"
      />
      {mode === 'single' && (
        <div className="flex flex-row items-center space-x-4">
          {/* check */}
          {/* <CopilotToggle
            copilotEnabled={copilotEnabled}
            setCopilotEnabled={setCopilotEnabled}
          /> */}
          <button
            disabled={message.trim().length === 0 || loading}
            className="bg-blue-500 text-white disabled:text-gray-300 dark:disabled:text-gray-500 hover:bg-blue-600 transition duration-100 disabled:bg-gray-200 dark:disabled:bg-gray-700 rounded-full p-2"
          >
            <ArrowUp className="bg-background" size={17} />
          </button>
        </div>
      )}
      {mode === 'multi' && (
        <div className="flex flex-row items-center justify-end w-full pt-2 space-x-4">
          {focusMode === 'academicSearch' && (
            <AttachSmall
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
            />
          )}
          <div className="flex flex-row items-center space-x-4">
            {/* <CopilotToggle
              copilotEnabled={copilotEnabled}
              setCopilotEnabled={setCopilotEnabled}
            /> */}
            <button
              disabled={message.trim().length === 0 || loading}
              className="bg-blue-500 text-white disabled:text-gray-300 dark:disabled:text-gray-500 hover:bg-blue-600 transition duration-100 disabled:bg-gray-200 dark:disabled:bg-gray-700 rounded-full p-2"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default MessageInput;
