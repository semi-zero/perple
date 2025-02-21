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

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
  focusMode
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
  focusMode: string
}) => {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);

  useEffect(() => {
    const regex = /\[(\d+)\]/g;

    if (
      message.role === 'assistant' &&
      message?.sources &&
      message.sources.length > 0
    ) {
      return setParsedMessage(
        message.content.replace(
          regex,
          (_, number) =>
            `<a href="${message.sources?.[number - 1]?.metadata?.url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${number}</a>`,
        ),
      );
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(message.content);
  }, [message.content, message.sources, message.role]);

  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });

  /////////////////////focusMode 추가 /////////////////////
  const [answerFocusMode] = useState(focusMode)
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
          <h2 className="text-gray-900 dark:text-gray-100 font-semibold text-3xl lg:w-9/12 leading-tight">
            {message.content}
          </h2>
        </div>
      )}

      {message.role === 'assistant' && (
        <div className="flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between lg:space-x-9">
          <div
            ref={dividerRef}
            className="flex flex-col space-y-6 w-full lg:w-9/12"
          >
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-col space-y-6">
                <div className="flex flex-row items-center space-x-2">
                  <BookOpen className="text-gray-700 dark:text-gray-300" size={20} />
                  <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                    출처
                  </h3>
                </div>
                <MessageSources sources={message.sources} />
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
                      {getFocusModeIcon(answerFocusMode)}
                    </div>
                    <div className="text-blue-500 dark:text-gray-100 text-xs">
                      {getFocusModeTitle(answerFocusMode)}
                    </div>
                  </div>
                </div>
              </div>
              <Markdown
                className={cn(
                  'prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200',
                  'leading-relaxed tracking-wide'
                )}
              >
                {parsedMessage}
              </Markdown>
              {loading && isLast ? null : (
                <div className="flex flex-row items-center justify-between w-full text-gray-800 dark:text-gray-200 py-4 -mx-2">
                  <div className="flex flex-row items-center space-x-1">
                    {/*  <button className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black text-black dark:hover:text-white">
                      <Share size={18} />
                    </button> */}
                    <Rewrite rewrite={rewrite} messageId={message.messageId} />
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
              {isLast &&
                message.suggestions &&
                message.suggestions.length > 0 &&
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
                        {message.suggestions.map((suggestion, i) => (
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

          <div className="lg:sticky lg:top-0 flex flex-col items-center space-y-3 w-full lg:w-3/12 z-30 h-full pb-4">
          <a href="https://www.naver.com" target="_blank" rel="noopener noreferrer">
              <img 
                src="https://picsum.photos/400/200" 
                alt="Random placeholder"
                className="w-full h-[200px] object-cover rounded-lg cursor-pointer"
              />
            </a>
            {/* check */}
            {/* <SearchVideos
              chatHistory={history.slice(0, messageIndex - 1)}
              query={history[messageIndex - 1].content}
            /> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBox;
