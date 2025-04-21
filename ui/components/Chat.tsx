'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import { File, Message } from './ChatWindow';
import MessageBox from './MessageBox';
import MessageBoxLoading from './MessageBoxLoading';

import SearchSteps from '@/components/SearchSteps';
import CustomCard from '@/components/common/CustomCard';

// 더미 검색 단계 데이터를 관리하기 위한 상태
interface SearchStep {
  type: 'start' | 'search' | 'processing' | 'complete';
  query?: string;
  sources?: string[];
  description?: string; // 설명을 위한 새로운 필드 추가
  status: 'pending' | 'active' | 'completed';
}

interface ExtraMessage {
  field1: string;
  field2: string;
  field3: string;
}

interface ChatProps {
  loading: boolean;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  sendMessage: (message: string) => void;
  messageAppeared: boolean;
  rewrite: (messageId: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  searchStepsMap: Record<string, SearchStep[]>;
  getSearchStepsForMessage: (messageId: string) => SearchStep[];
  focusmode: string;
}

const Chat = ({
  loading,
  messages,
  setMessages,
  sendMessage,
  messageAppeared,
  rewrite,
  fileIds,
  setFileIds,
  files,
  setFiles,
  searchStepsMap,
  getSearchStepsForMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  extraMessage,
  setExtraMessage
}: {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  sendMessage: (message: string) => void;
  loading: boolean;
  messageAppeared: boolean;
  rewrite: (messageId: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  searchStepsMap: Record<string, SearchStep[]>;
  getSearchStepsForMessage: (messageId: string) => SearchStep[];
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  extraMessage: ExtraMessage;
  setExtraMessage: React.Dispatch<React.SetStateAction<ExtraMessage>>; 
}) => {
  const [dividerWidth, setDividerWidth] = useState(0);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateDividerWidth = () => {
      if (dividerRef.current) {
        setDividerWidth(dividerRef.current.scrollWidth);
      }
    };

    updateDividerWidth();

    window.addEventListener('resize', updateDividerWidth);

    return () => {
      window.removeEventListener('resize', updateDividerWidth);
    };
  });

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: 'smooth' });

    if (messages.length === 1) {
      document.title = `${messages[0].content.substring(0, 30)} - Perplexica`;
    }
  }, [messages]);

  return (
    <div className="flex flex-col relative min-h-screen max-w-6xl mx-auto">
      <div className="flex flex-col space-y-6 pt-6 pb-40">
        
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;

          // 0327
          return (
            
            <Fragment key={msg.id}>
              
                <MessageBox
                  key={i}
                  message={msg}
                  messageIndex={i}
                  messages={messages}
                  setMessages={setMessages}
                  loading={loading}
                  dividerRef={isLast ? dividerRef : undefined}
                  isLast={isLast}
                  rewrite={rewrite}
                  sendMessage={sendMessage}
                  focusMode={focusMode}
                  searchStepsMap={searchStepsMap}
                  getSearchStepsForMessage={getSearchStepsForMessage}
                />
              
              {!isLast && msg.role === 'assistant' && (
                <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
              )}
            </Fragment>
            
          );
        })}
        {loading && !messageAppeared && (
            <MessageBoxLoading 
              searchSteps={messages.length > 0 ? getSearchStepsForMessage(messages[messages.length - 1].id) : []}
              focusMode={focusMode}
            />
          )}
        <div ref={messageEnd} className="h-0" />
      </div>
      
      {dividerWidth > 0 && (
      <div 
        className="fixed bottom-0 pb-4 bg-gradient-to-t from-white dark:from-dark-800"
        style={{width: dividerWidth}}
      >
        <MessageInput
          loading={loading}
          sendMessage={sendMessage}
          fileIds={fileIds}
          setFileIds={setFileIds}
          files={files}
          setFiles={setFiles}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          optimizationMode={optimizationMode}
          setOptimizationMode={setOptimizationMode}
          extraMessage={extraMessage}
          setExtraMessage={setExtraMessage}
        />
      </div>
      )}
    </div>
  );
};

export default Chat;