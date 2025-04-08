'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Loader2,
  Volume2,
  StopCircle,
  Layers,
  PlusCircle,
} from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import MessageSources from './MessageSources';
import { useSpeech } from 'react-text-to-speech';
import SearchImages from './SearchImages';
import SearchVideos from './SearchVideos';

import { focusModes } from '@/components/MessageInputActions/Focus';
import SearchSteps from '@/components/SearchSteps';

// 더미 검색 단계 데이터를 관리하기 위한 상태
interface SearchStep {
  type: 'start' | 'search' | 'processing' | 'complete';
  query?: string;
  sources?: string[];
  description?: string; // 설명을 위한 새로운 필드 추가
  status: 'pending' | 'active' | 'completed';
}


const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
  focusMode,
  searchStepsMap,
  getSearchStepsForMessage,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
  focusMode: string;
  searchStepsMap: Record<string, SearchStep[]>;
  getSearchStepsForMessage: (messageId: string) => SearchStep[];
}) => {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);

  // 0327
  useEffect(() => {
    const regex = /\[(\d+)\]/g;

    if (
      message.role === 'assistant' &&
      message?.metadata?.sources &&
      message.metadata.sources.length > 0
    ) {
      return setParsedMessage(
        message.content.replace(
          regex,
          (_, number) =>
            `<a href="${message.metadata?.sources?.[number - 1]?.metadata?.url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${number}</a>`,
        ),
      );
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(message.content);
  }, [message.content, message.metadata?.sources, message.role]);

  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });

  /////////////////////focusMode 추가 /////////////////////
  // 메시지에 저장된 focusMode를 우선 사용하고, 없으면 상위 컴포넌트에서 전달받은 focusMode 사용
  // const messageFocusMode = message.focusMode || focusMode;
  // const [answerFocusMode] = useState(focusMode)
  const [messageFocusMode, setMessageFocusMode] = useState(
    message.focusMode || focusMode
  );
  const getFocusModeIcon = (modeKey:string) => {
    const selectedMode = focusModes.find((m)=> m.key === modeKey);
    return selectedMode?.icon;
  }

  const getFocusModeTitle = (modeKey:string) => {
    const selectedMode = focusModes.find((m)=> m.key === modeKey);
    return selectedMode?.title;
  }

  return (
    <div className="w-full">
      {message.role === 'user' && (
        <div className={cn('w-full', messageIndex === 0 ? 'pt-16' : 'pt-8')}>
          {messageFocusMode === 'writingAssistant' ? (
            <div className="flex lg:w-9/12 justify-end">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-xl max-w-xl text-left 
              prose leading-relaxed tracking-wide">
                <p>{message.content}</p>
              </div>
            </div>
          ) : (
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-3xl lg:w-9/12 leading-tight">
              {message.content}
            </h2>
          )}
        </div>
      )}

      {message.role === 'assistant' && (
        <div className="flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between lg:space-x-9">
          <div
            ref={dividerRef}
            className="flex flex-col space-y-6 w-full lg:w-9/12  flex-shrink-0"
          >
            {/* 0327 */}
              {messageFocusMode === 'pipelineSearch' && (
                <div>
                  <SearchSteps steps={getSearchStepsForMessage(message.id)} />
                </div>
              )}
            {/* 0327 */}
            {message.metadata?.sources && message.metadata.sources.length > 0 && (
              
              <div className="flex flex-col space-y-6">
                
                <div className="flex flex-row items-center space-x-2">
                  <BookOpen className="text-gray-700 dark:text-gray-300" size={20} />
                  <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    출처
                  </h3>
                </div>
                {/* 0327 */}
                <MessageSources sources={message.metadata.sources} />
              </div>
            )}
            <div className="flex flex-col space-y-6">

              <div className="flex flex-row items-center space-x-2">
              {loading && isLast ? (
                  <Loader2 className="animate-spin text-gray-500 dark:text-gray-400" size={20} />
                ) : (
                  <Layers className="text-gray-700 dark:text-gray-300" size={20} />
                )}
                <div className="flex flex-row justify-between items-center w-full">
                  <div className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    답변
                  </div>
                  <div className="flex flex-row items-center space-x-1">
                    <div className="text-blue-500 dark:text-gray-100 text-xs">
                      {getFocusModeIcon(messageFocusMode)}
                    </div>
                    <div className="text-blue-500 dark:text-gray-100 text-xs">
                      {getFocusModeTitle(messageFocusMode)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Markdown을 감싸는 div에 overflow-x-auto 적용 */}
              <div className="overflow-x-auto">
                <Markdown
                  className={cn(
                    'prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200',
                    'leading-relaxed tracking-wide'
                  )}
                >
                  {parsedMessage}
                </Markdown>
              </div>
              {loading && isLast ? null : (
                <div className="flex flex-row items-center justify-between w-full text-gray-800 dark:text-gray-200 py-4 -mx-2">
                  <div className="flex flex-row items-center space-x-1">
                    
                    {/* 0327 */}
                    <Rewrite rewrite={rewrite} messageId={message.id} />
                  </div>
                  <div className="flex flex-row items-center space-x-1">
                    <Copy initialMessage={message.content} message={message} />
                    <button
                      onClick={() => {
                        if (speechStatus === 'started') {
                          stop();
                        } else {
                          start();
                        }
                      }}
                      className="p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
                    >
                      {speechStatus === 'started' ? (
                        <StopCircle size={18} />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {/* 0327 */}
              {isLast &&
                message.metadata?.suggestions &&
                message.metadata.suggestions.length > 0 &&
                message.role === 'assistant' &&
                !loading && (
                  <>
                    <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex flex-col space-y-3 text-gray-900 dark:text-gray-100">
                      <div className="flex flex-row items-center space-x-2 mt-4">
                        <Layers />
                        <h3 className="text-lg font-semibold">관련 질문</h3>
                      </div>
                      <div className="flex flex-col space-y-3">
                        {message.metadata.suggestions.map((suggestion: string, i: number) => (
                          <div
                            className="flex flex-col space-y-3"
                            key={i}
                          >
                            <div className="h-px w-full bg-gray-300 dark:bg-gray-600" />
                            <div
                              onClick={() => {
                                sendMessage(suggestion);
                              }}
                              className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center transition duration-200 hover:text-blue-500"
                            >
                              <p className="transition duration-200 hover:text-[#24A0ED]">
                                {suggestion}
                              </p>
                              <PlusCircle
                                size={20}
                                className="text-blue-500" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>

          <div className={cn(
            "lg:top-0 flex flex-col items-center space-y-3 w-full lg:w-3/12 h-full pb-4",
            messageFocusMode !== 'pipelineSearch' && "hidden"
          )}>
            <a href="https://www.naver.com" target="_blank" rel="noopener noreferrer">
              <img 
                src="https://picsum.photos/400/200" 
                alt="Random placeholder"
                className="w-full h-[208px] object-cover rounded-lg cursor-pointer"
              />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBox;