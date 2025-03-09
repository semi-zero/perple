'use client';

import { useEffect, useRef, useState } from 'react';
import { Document } from '@langchain/core/documents';
import Navbar from './Navbar';
import Chat from './Chat';
import EmptyChat from './EmptyChat';
import crypto from 'crypto';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { getSuggestions } from '@/lib/actions';
import Error from 'next/error';
import { motion } from 'framer-motion';
import SearchSteps from '@/components/SearchSteps';
import { OptimizationModes } from './MessageInputActions/Optimization';


export type Message = {
  messageId: string;
  chatId: string;
  createdAt: Date;
  content: string;
  role: 'user' | 'assistant';
  suggestions?: string[];
  sources?: Document[];
  focusMode?: string; // focusMode 필드 추가
  optimizationMode?: string; // optimizationMode 필드 추가
};

export interface File {
  fileName: string;
  fileExtension: string;
  fileId: string;
}


const useSocket = (
  url: string,
  setIsWSReady: (ready: boolean) => void,
  setError: (error: boolean) => void,
) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!ws) {
      const connectWs = async () => {
        let chatModel = localStorage.getItem('chatModel');
        let chatModelProvider = localStorage.getItem('chatModelProvider');
        let embeddingModel = localStorage.getItem('embeddingModel');
        let embeddingModelProvider = localStorage.getItem(
          'embeddingModelProvider',
        );
        let openAIBaseURL =
          chatModelProvider === 'custom_openai'
            ? localStorage.getItem('openAIBaseURL')
            : null;
        let openAIPIKey =
          chatModelProvider === 'custom_openai'
            ? localStorage.getItem('openAIApiKey')
            : null;

        const providers = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/models`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ).then(async (res) => await res.json());

        if (
          !chatModel ||
          !chatModelProvider ||
          !embeddingModel ||
          !embeddingModelProvider
        ) {
          if (!chatModel || !chatModelProvider) {
            const chatModelProviders = providers.chatModelProviders;

            chatModelProvider =
              chatModelProvider || Object.keys(chatModelProviders)[0];

            if (chatModelProvider === 'custom_openai') {
              toast.error(
                'Seems like you are using the custom OpenAI provider, please open the settings and enter a model name to use.',
              );
              setError(true);
              return;
            } else {
              chatModel = Object.keys(chatModelProviders[chatModelProvider])[0];

              if (
                !chatModelProviders ||
                Object.keys(chatModelProviders).length === 0
              )
                return toast.error('No chat models available');
            }
          }

          if (!embeddingModel || !embeddingModelProvider) {
            const embeddingModelProviders = providers.embeddingModelProviders;

            if (
              !embeddingModelProviders ||
              Object.keys(embeddingModelProviders).length === 0
            )
              return toast.error('No embedding models available');

            embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
            embeddingModel = Object.keys(
              embeddingModelProviders[embeddingModelProvider],
            )[0];
          }

          localStorage.setItem('chatModel', chatModel!);
          localStorage.setItem('chatModelProvider', chatModelProvider);
          localStorage.setItem('embeddingModel', embeddingModel!);
          localStorage.setItem(
            'embeddingModelProvider',
            embeddingModelProvider,
          );
        } else {
          const chatModelProviders = providers.chatModelProviders;
          const embeddingModelProviders = providers.embeddingModelProviders;

          if (
            Object.keys(chatModelProviders).length > 0 &&
            (((!openAIBaseURL || !openAIPIKey) &&
              chatModelProvider === 'custom_openai') ||
              !chatModelProviders[chatModelProvider])
          ) {
            const chatModelProvidersKeys = Object.keys(chatModelProviders);
            chatModelProvider =
              chatModelProvidersKeys.find(
                (key) => Object.keys(chatModelProviders[key]).length > 0,
              ) || chatModelProvidersKeys[0];

            if (
              chatModelProvider === 'custom_openai' &&
              (!openAIBaseURL || !openAIPIKey)
            ) {
              toast.error(
                'Seems like you are using the custom OpenAI provider, please open the settings and configure the API key and base URL',
              );
              setError(true);
              return;
            }

            localStorage.setItem('chatModelProvider', chatModelProvider);
          }

          if (
            chatModelProvider &&
            (!openAIBaseURL || !openAIPIKey) &&
            !chatModelProviders[chatModelProvider][chatModel]
          ) {
            chatModel = Object.keys(
              chatModelProviders[
                Object.keys(chatModelProviders[chatModelProvider]).length > 0
                  ? chatModelProvider
                  : Object.keys(chatModelProviders)[0]
              ],
            )[0];
            localStorage.setItem('chatModel', chatModel);
          }

          if (
            Object.keys(embeddingModelProviders).length > 0 &&
            !embeddingModelProviders[embeddingModelProvider]
          ) {
            embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
            localStorage.setItem(
              'embeddingModelProvider',
              embeddingModelProvider,
            );
          }

          if (
            embeddingModelProvider &&
            !embeddingModelProviders[embeddingModelProvider][embeddingModel]
          ) {
            embeddingModel = Object.keys(
              embeddingModelProviders[embeddingModelProvider],
            )[0];
            localStorage.setItem('embeddingModel', embeddingModel);
          }
        }

        const wsURL = new URL(url);
        const searchParams = new URLSearchParams({});

        searchParams.append('chatModel', chatModel!);
        searchParams.append('chatModelProvider', chatModelProvider);

        if (chatModelProvider === 'custom_openai') {
          searchParams.append(
            'openAIApiKey',
            localStorage.getItem('openAIApiKey')!,
          );
          searchParams.append(
            'openAIBaseURL',
            localStorage.getItem('openAIBaseURL')!,
          );
        }

        searchParams.append('embeddingModel', embeddingModel!);
        searchParams.append('embeddingModelProvider', embeddingModelProvider);

        wsURL.search = searchParams.toString();

        const ws = new WebSocket(wsURL.toString());

        const timeoutId = setTimeout(() => {
          if (ws.readyState !== 1) {
            toast.error(
              'Failed to connect to the server. Please try again later.',
            );
          }
        }, 10000);

        ws.addEventListener('message', (e) => {
          const data = JSON.parse(e.data);
          if (data.type === 'signal' && data.data === 'open') {
            const interval = setInterval(() => {
              if (ws.readyState === 1) {
                setIsWSReady(true);
                clearInterval(interval);
              }
            }, 5);
            clearTimeout(timeoutId);
            console.log('[DEBUG] opened');
          }
          if (data.type === 'error') {
            toast.error(data.data);
          }
        });

        ws.onerror = () => {
          clearTimeout(timeoutId);
          setError(true);
          toast.error('WebSocket connection error.');
        };

        ws.onclose = () => {
          clearTimeout(timeoutId);
          setError(true);
          console.log('[DEBUG] closed');
        };

        setWs(ws);
      };

      connectWs();
    }
  }, [ws, url, setIsWSReady, setError]);

  return ws;
};

// 더미 검색 단계 데이터를 관리하기 위한 상태
interface SearchStep {
  type: 'start' | 'search' | 'processing' | 'complete';
  query?: string;
  sources?: string[];
  description?: string; // 설명을 위한 새로운 필드 추가
  status: 'pending' | 'active' | 'completed';
}

const loadMessages = async (
  chatId: string,
  setMessages: (messages: Message[]) => void,
  setIsMessagesLoaded: (loaded: boolean) => void,
  setChatHistory: (history: [string, string][]) => void,
  setFocusMode: (mode: string) => void,
  setNotFound: (notFound: boolean) => void,
  setFiles: (files: File[]) => void,
  setFileIds: (fileIds: string[]) => void,
  setSearchStepsMap: (map: Record<string, SearchStep[]>) => void, // 새로운 파라미터 추가
  setOptimizationMode: (mode: string) => void, // 새로운 파라미터 추가
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/chats/${chatId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (res.status === 404) {
    setNotFound(true);
    setIsMessagesLoaded(true);
    return;
  }

  const data = await res.json();

  const messages = data.messages.map((msg: any) => {
    return {
      ...msg,
      metadata: msg.metadata || {},
      sources: msg.metadata?.sources ?? [], // 메시지 타입의 sources 필드에 할당
      focusMode: msg.focusMode, // 메시지에서 focusMode 가져오기
      optimizationMode: msg.optimizationMode, // 메시지에서 optimizationMode 가져오기
    } as Message;
  });

  console.log('[DEBUG] messages:', messages);
  setMessages(messages);
  // optimizationMode 설정 추가
  // if (data.chat.optimizationMode) {
  //   setOptimizationMode(data.chat.optimizationMode);
  // }

  // 메시지에서 searchSteps 정보 추출하여 searchStepsMap 초기화
  const newSearchStepsMap: Record<string, SearchStep[]> = {};
  
  // 사용자와 어시스턴트 메시지 쌍을 찾아 처리
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'assistant' && i > 0 && messages[i-1].role === 'user') {
      const userMessage = messages[i-1];
      const assistantMessage = messages[i];
      
      // focusMode가 pipelineSearch인 메시지에 대해서만 처리
      if (data.chat.focusMode === 'pipelineSearch') {
        // 각 메시지의 optimizationMode를 사용
        const messageOptimizationMode = assistantMessage.optimizationMode || data.chat.optimizationMode;
        const currentOptimizationMode = OptimizationModes.find(
          mode => mode.key === messageOptimizationMode
        );
        const searchDescription = currentOptimizationMode 
          ? `${currentOptimizationMode.description}에서 검색`
          : '검색 중';

        newSearchStepsMap[assistantMessage.messageId] = [
          {
            type: 'start',
            query: userMessage.content,
            status: 'completed'
          },
          {
            type: 'search',
            description: searchDescription,
            status: 'completed'
          },
          {
            type: 'processing',
            sources: assistantMessage.sources?.map((source: Document) => {
              if (source.metadata) {
                return source.metadata.source || source.metadata.title || source.pageContent?.substring(0, 30) || '알 수 없는 소스';
              }
              return source.pageContent?.substring(0, 30) || '알 수 없는 소스';
            }),
            status: 'completed'
          },
          {
            type: 'complete',
            status: 'completed'
          }
        ];
      }
    }
  }
  
  setSearchStepsMap(newSearchStepsMap);

  const history = messages.map((msg) => {
    return [msg.role, msg.content];
  }) as [string, string][];

  console.log('[DEBUG] messages loaded');

  // messages 배열이 비어있지 않을 때만 제목 설정
  if (messages.length > 0) {
    document.title = messages[0].content;
  }

  const files = data.chat.files.map((file: any) => {
    return {
      fileName: file.name,
      fileExtension: file.name.split('.').pop(),
      fileId: file.fileId,
    };
  });


  setFiles(files);
  setFileIds(files.map((file: File) => file.fileId));

  setChatHistory(history);
  setFocusMode(data.chat.focusMode);
  setIsMessagesLoaded(true);
};

const ChatWindow = ({ id }: { id?: string }) => {
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('q');

  const [chatId, setChatId] = useState<string | undefined>(id);
  const [newChatCreated, setNewChatCreated] = useState(false);

  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [isWSReady, setIsWSReady] = useState(false);
  const ws = useSocket(
    process.env.NEXT_PUBLIC_WS_URL!,
    setIsWSReady,
    setHasError,
  );

  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);

  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [fileIds, setFileIds] = useState<string[]>([]);

  const [focusMode, setFocusMode] = useState('writingAssistant');
  const [optimizationMode, setOptimizationMode] = useState('');

  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);

  const [notFound, setNotFound] = useState(false);

  const [extraMessage, setExtraMessage] = useState({
    field1: '',
    field2: '',
    field3: '',
  });

  // 더미 유저 데이터 추가
  const dummyUserData = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "테스트 사용자",
    department: "개발팀",
    email: "test@example.com"
  };

  // 더미 검색 단계 데이터를 관리하기 위한 상태
  // interface SearchStep {
  //   type: 'search' | 'processing' | 'complete';
  //   query?: string;
  //   sources?: string[];
  //   status: 'pending' | 'active' | 'completed';
  // }

  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([]);
  // 메시지 ID를 키로 사용하는 검색 단계 맵 상태 추가
  const [searchStepsMap, setSearchStepsMap] = useState<Record<string, SearchStep[]>>({});
  
  const optimizationModeKey = OptimizationModes.find(mode => mode.key === optimizationMode);
  console.log('[DEBUG] optimizationModeKey:', optimizationModeKey);
  const searchDescription = optimizationModeKey 
    ? `${optimizationModeKey.description}에서 검색`
    : '검색 중';

  
  

  useEffect(() => {
    console.log('[ChatWindow] 초기화 - chatId:', chatId);
    if (
      chatId &&
      !newChatCreated &&
      !isMessagesLoaded &&
      messages.length === 0
    ) {
      console.log('[ChatWindow] 메시지 로딩 시작');
      loadMessages(
        chatId,
        setMessages,
        setIsMessagesLoaded,
        setChatHistory,
        setFocusMode,
        setNotFound,
        setFiles,
        setFileIds,
        setSearchStepsMap, // 새로운 파라미터 전달
        setOptimizationMode  // 새로운 파라미터 전달
      );
    } else if (!chatId) {
      console.log('[ChatWindow] 새 채팅 생성');
      setNewChatCreated(true);
      setIsMessagesLoaded(true);
      setChatId(crypto.randomBytes(20).toString('hex'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (ws?.readyState === 1) {
        ws.close();
        console.log('[DEBUG] closed');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMessagesLoaded && isWSReady) {
      setIsReady(true);
      console.log('[DEBUG] ready');
    }
  }, [isMessagesLoaded, isWSReady]);

  const sendMessage = async (message: string, messageId?: string) => {
    if (loading) return;

    console.log('[ChatWindow] 메시지 전송 시작:', {
      messageId,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      focusMode,
      optimizationMode
    });

    setLoading(true);
    setMessageAppeared(false);


    let sources: Document[] | undefined = undefined;
    let recievedMessage = '';
    let added = false;

    messageId = messageId ?? crypto.randomBytes(7).toString('hex');

    // focusMode가 pipelineSearch일 때만 검색 단계 초기화
    if (focusMode === 'pipelineSearch') {
      setSearchStepsMap(prev => ({
        ...prev,
        [messageId]: [
          {
          type: 'start',
          query: message,
          status: 'completed'
        },
        {
          type: 'search',
          description: searchDescription,
          status: 'active'
        },
      ]
      }));
    }

    ws?.send(
      JSON.stringify({
        type: 'message',
        message: {
          messageId: messageId,
          chatId: chatId!,
          content: message,
          userId: dummyUserData.id, // 더미 유저 ID 추가
        },
        files: fileIds,
        focusMode: focusMode,
        optimizationMode: optimizationMode,
        extraMessage: extraMessage,
        history: [...chatHistory, ['human', message]],
      }),
    );

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: message,
        messageId: messageId!,
        chatId: chatId!,
        role: 'user' as const,  // 'as const'를 추가하여 리터럴 타입으로 명시
        createdAt: new Date(),
        suggestions: undefined,  // 선택적 필드 명시적으로 추가
        sources: undefined      // 선택적 필드 명시적으로 추가
      },
    ]);

    const messageHandler = async (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      if (data.type === 'error') {
        console.error('[ChatWindow] 에러 발생:', data.data);
        toast.error(data.data);
        setLoading(false);
        return;
      }

      if (data.type === 'sources') {
        sources = data.data;
        console.log('[ChatWindow] 소스 수신 sources:', sources);

        // focusMode가 pipelineSearch일 때만 검색 단계 업데이트
        if (focusMode === 'pipelineSearch') {
          setSearchStepsMap(prev => ({
            ...prev,
            [data.messageId]: [
              {
                type: 'start',
                query: message,
                status: 'completed'
              },
              {
                type: 'search',
                description: searchDescription,
                status: 'completed'
              },
              {
                type: 'processing',
                sources: sources?.map((source: Document) => {
                  if (source.metadata) {
                    return source.metadata.source || source.metadata.title || source.pageContent?.substring(0, 30) || '알 수 없는 소스';
                  }
                  return source.pageContent?.substring(0, 30) || '알 수 없는 소스';
                }),
                status: 'active'
              }
            ]
          }));
        }

        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: '',
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
        }
        setMessageAppeared(true);
      }

      if (data.type === 'message') {
        // 첫 메시지를 받으면 처리 단계를 완료로 표시하고 완료 단계 추가
        if (focusMode === 'pipelineSearch' && recievedMessage === '') {
          setSearchStepsMap(prev => ({
            ...prev,
            [data.messageId]: [
              {
                type: 'start',
                query: message,
                status: 'completed'
              },
              {
                type: 'search',
                description: searchDescription,
                status: 'completed'
              },
              {
                type: 'processing',
                sources: sources?.map((source: Document) => {
                  if (source.metadata) {
                    return source.metadata.source || source.metadata.title || source.pageContent?.substring(0, 30) || '알 수 없는 소스';
                  }
                  return source.pageContent?.substring(0, 30) || '알 수 없는 소스';
                }),
                status: 'completed'
              },
              {
                type: 'complete',
                status: 'active'
              }
            ]
          }));
        }

        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: data.data,
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
        }

        setMessages((prev) =>
          prev.map((message) => {
            if (message.messageId === data.messageId) {
              return { ...message, content: message.content + data.data };
            }

            return message;
          }),
        );

        recievedMessage += data.data;
        setMessageAppeared(true);
      }

      if (data.type === 'messageEnd') {

        if (focusMode === 'pipelineSearch') {
          setSearchStepsMap(prev => {
            const currentSteps = prev[data.messageId] || [];
            return {
              ...prev,
              [data.messageId]: currentSteps.map(step => ({...step, status: 'completed'}))
            };
          });
        }


        console.log('[ChatWindow] 메시지 수신 완료');
        setChatHistory((prevHistory) => [
          ...prevHistory,
          ['human', message],
          ['assistant', recievedMessage],
        ]);

        ws?.removeEventListener('message', messageHandler);
        setLoading(false);

        const lastMsg = messagesRef.current[messagesRef.current.length - 1];

        // if (
        //   lastMsg.role === 'assistant' &&
        //   lastMsg.sources &&
        //   lastMsg.sources.length > 0 &&
        //   !lastMsg.suggestions
        // ) {
        //   const suggestions = await getSuggestions(messagesRef.current);
        //   setMessages((prev) =>
        //     prev.map((msg) => {
        //       if (msg.messageId === lastMsg.messageId) {
        //         return { ...msg, suggestions: suggestions };
        //       }
        //       return msg;
        //     }),
        //   );
        // }
      }
    };

    ws?.addEventListener('message', messageHandler);
  };

  // 메시지 컴포넌트에 검색 단계 전달을 위한 함수
  const getSearchStepsForMessage = (messageId: string) => {
    return searchStepsMap[messageId] || [];
  };


  const rewrite = (messageId: string) => {
    console.log('[ChatWindow] 메시지 재작성:', messageId);
    const index = messages.findIndex((msg) => msg.messageId === messageId);

    if (index === -1) return;

    const message = messages[index - 1];

    setMessages((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });
    setChatHistory((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });

    sendMessage(message.content, message.messageId);
  };

  useEffect(() => {
    if (isReady && initialMessage && ws?.readyState === 1) {
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.readyState, isReady, initialMessage, isWSReady]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="dark:text-white/70 text-black/70 text-sm">
          Failed to connect to the server. Please try again later.
        </p>
      </div>
    );
  }



  return isReady ? (
    notFound ? (
      <Error statusCode={404} />
    ) : (
      <div>
        {messages.length > 0 ? (
          <>
            {/* check */}
            <Navbar chatId={chatId!} messages={messages} mode={focusMode} />
             {/* SearchSteps 컴포넌트 추가
             {loading && searchSteps.length > 0 && (
              <SearchSteps steps={searchSteps} />
            )} */}
            <Chat
              loading={loading}
              messages={messages}
              sendMessage={sendMessage}
              messageAppeared={messageAppeared}
              rewrite={rewrite}
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
              searchStepsMap={searchStepsMap} // searchSteps 대신 searchStepsMap 전달
              getSearchStepsForMessage={getSearchStepsForMessage} // 함수 전달
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              optimizationMode={optimizationMode}
              setOptimizationMode={setOptimizationMode}
              extraMessage={extraMessage}
              setExtraMessage={setExtraMessage}
            />
          </>
        ) : (
          <EmptyChat
            sendMessage={sendMessage}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            optimizationMode={optimizationMode}
            setOptimizationMode={setOptimizationMode}
            fileIds={fileIds}
            setFileIds={setFileIds}
            files={files}
            setFiles={setFiles}
            extraMessage={extraMessage}
            setExtraMessage={setExtraMessage}
          />
        )}
      </div>
    )
  ) : (
    <div className="flex flex-row items-center justify-center min-h-screen">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
};

export default ChatWindow;
