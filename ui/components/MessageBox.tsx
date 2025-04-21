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
  ExternalLink,
  Pencil
} from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import MessageSources from './MessageSources';
import { useSpeech } from 'react-text-to-speech';
import Input from './form/input/InputField';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  messages,
  setMessages,
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
  messages: Message[];
  setMessages: (messages: Message[]) => void;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessage, setEditingMessage] = useState(message.content);
  const router = useRouter();
  
  const isFirstMessage = messageIndex === 0;
  
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isFirstMessage && messages.length > 1 && !loading && !window.location.pathname.startsWith('/c/')) {
      setRedirecting(true);
      router.push(`/c/${message.chatId}`);
    }
  }, [isFirstMessage, message.chatId, router, messages.length, loading]);
  

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

  const handleUpdateMessage = async () => {
    try {
      // 1. 메시지 정보 가져오기 (기존과 동일)
      const getMessageRes = await fetch(
        `http://localhost:3002/api/messages/${message.id}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!getMessageRes.ok) throw new Error('메시지 정보 가져오기 실패');
      
      const messageData = await getMessageRes.json();

      // 2. 메시지 수정 API 호출 (기존과 동일)
      const updateMessageData = {
        id: message.id,
        content: editingMessage.trim(),
        chatId: messageData.chat.id,
        role: 'user',
        metadata: {},
        focusMode: messageData.focusMode,
        optimizationMode: messageData.optimizationMode,
        extraMessages: messageData.extraMessages,
        feedbackLike: false,
        feedbackDislike: false,
      };

      const res = await fetch(
        'http://localhost:3002/api/messages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateMessageData),
        }
      );
      

      if (!res.ok) throw new Error('메시지 수정 실패');

      
      // 3. ChatWindow의 messages 상태도 함께 업데이트
      const updatedMessages = messages.map(msg => 
        msg.id === message.id 
          ? { ...msg, content: editingMessage.trim() } 
          : msg
      );
      
      setMessages(updatedMessages);

      // 4. 답변 메시지 찾아서 rewrite 호출
      const currentIndex = messages.findIndex(msg => msg.id === message.id);
      if (currentIndex !== -1 && currentIndex + 1 < messages.length) {
        const answerMessage = messages[currentIndex + 1];
        if (answerMessage && answerMessage.description === message.id) {
          rewrite(answerMessage.id);
        }
      }

      setIsEditing(false);
      toast.success('메시지가 수정되었습니다.');

    } catch (error) {
      console.error(error);
      toast.error('메시지 수정에 실패했습니다.');
      setIsEditing(false);
      setEditingMessage(message.content);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingMessage(message.content);
  };

  if (redirecting) return null; // 또는 skeleton
  
  return (
    <div className="w-full">
      {message.role === 'user' && (
        <div className={cn('w-full group relative', messageIndex === 0 ? 'pt-16' : 'pt-1')}>
          {messageFocusMode === 'writingAssistant' ? (
            <div className="flex justify-end">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 
              inline-block max-w-2xl relative">
                {isEditing ? (
                  <Input
                    type="text"
                    value={editingMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateMessage();
                      } else if (e.key === 'Escape') {
                        cancelEdit();
                      }
                    }}
                    onBlur={cancelEdit}
                    className="text-sm"
                    autoFocus
                  />
                ) : (
                  <>
                    <p className="text-gray-800 dark:text-gray-800 text-theme-sm font-medium">
                      {message.content}
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="absolute right-2 top-2 p-1 rounded-md bg-gray-100 dark:bg-gray-700 
                      opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={14} className="text-gray-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              {isEditing ? (
                <Input
                  type="text"
                  value={editingMessage}
                  onChange={(e) => setEditingMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateMessage();
                    } else if (e.key === 'Escape') {
                      cancelEdit();
                    }
                  }}
                  onBlur={cancelEdit}
                  className="text-xl font-medium"
                  autoFocus
                />
              ) : (
                <>
                  <h2 className="text-gray-800 dark:text-gray-800 text-xl font-medium">
                    {message.content}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute right-2 top-2 p-1 rounded-md bg-gray-100 dark:bg-gray-700 
                    opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil size={14} className="text-gray-500" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
      
      {message.role === 'assistant' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        ref={dividerRef}>
            {messageFocusMode === 'pipelineSearch' && (
              <div>
                <SearchSteps steps={getSearchStepsForMessage(message.id)} />
              </div>
            )}
            {/* Sources 섹션 */}
            {(message.metadata?.sources || messageFocusMode === 'pipelineSearch') && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-6">
                {/* Sources 섹션 - 2/3 너비 */}
                {message.metadata?.sources && message.metadata.sources.length > 0 && (
                  <div className="flex-grow w-2/3">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="text-brand-500 dark:text-brand-400" size={18} />
                      <h3 className="text-brand-500 dark:text-brand-400 font-medium">출처</h3>
                    </div>
                    <MessageSources sources={message.metadata.sources} />
                  </div>
                )}

                {/* Image 섹션 - 1/3 너비 */}
                {messageFocusMode === 'pipelineSearch' && (
                  <div className="w-1/3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-4">
                      <ExternalLink className="text-brand-500 dark:text-brand-400" size={18} />
                      <h3 className="text-brand-500 dark:text-brand-400 font-medium">파이프라인에서 확인</h3>
                    </div>
                    <a 
                      href="https://www.naver.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full aspect-[4/2] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <img 
                        src="https://picsum.photos/200/200" 
                        alt="Random placeholder"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

            {/* 답변 섹션 */}
            <div className="flex flex-col">
              {/* 답변 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {loading && isLast ? (
                    <Loader2 className="animate-spin text-gray-500" size={18} />
                  ) : (
                    <Layers className="text-brand-500 dark:text-brand-400" size={18} />
                  )}
                  <span className="text-brand-500 dark:text-brand-400 font-medium">답변</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 
                text-sm font-medium text-brand-500 dark:bg-gray-800 dark:text-brand-400">
                  {getFocusModeIcon(messageFocusMode)}
                  <span>{getFocusModeTitle(messageFocusMode)}</span>
                </div>
              </div>

              {/* Markdown 컨텐츠 */}
              <div className=" max-w-none mb-6">
                <Markdown className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {parsedMessage}
                </Markdown>
              </div>

              {/* 액션 버튼 */}
              {!loading && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Rewrite rewrite={rewrite} messageId={message.id} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Copy initialMessage={message.content} message={message} />
                    <button
                      onClick={() => speechStatus === 'started' ? stop() : start()}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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

              {/* 관련 질문 섹션 */}
              {/* {isLast && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="text-gray-500" size={18} />
                    <h3 className="text-gray-800 dark:text-gray-200 font-medium">관련 질문</h3>
                  </div>
                  <div className="space-y-2">
                    {message.metadata.suggestions.map((suggestion: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => sendMessage(suggestion)}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700
                        hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{suggestion}</span>
                        <PlusCircle size={18} className="text-brand-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          </div>
      )}
    </div>
  );
};

export default MessageBox;