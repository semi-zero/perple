'use client';

import { useEffect, useRef, useState } from 'react';
import { Document } from '@langchain/core/documents';
import Navbar from './Navbar';
import Chat from './Chat';
import EmptyChat from './EmptyChat';
import crypto from 'crypto';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSuggestions } from '@/lib/actions';
import Error from 'next/error';
import { motion } from 'framer-motion';
import SearchSteps from '@/components/SearchSteps';
import { OptimizationModes } from './MessageInputActions/Optimization';


interface ExtraMessage {
	field1?: string | null;
    field2?: string | null;
    field3?: string | null;
}

interface FileEntity {
	name?: string | null;
    fileId?: string | null;
}

export interface Message {
	id: string;
  content: string;
  createdAt?: Date | null;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string;
  description?: string | null;
  role: string;
  metadata?: { [key: string]: any };
  chatId: string;
  focusMode?: string | null;
  optimizationMode?: string | null;
  extraMessages?: ExtraMessage[];
  feedbackLike?: boolean | null;
  feedbackDisLike?: boolean | null;
  isDeleted?: boolean | null;
}


export interface File {
  fileName: string;
  fileExtension: string;
  fileId: string;
}

interface User {
	id: string;
  name: string;
  epId?: string | null;
  department: string;
  email: string;
  idAdmin?: boolean | null;
  createdAt?: Date | null;
  lastActive?: Date | null;
  groupName?: string;
  extraFields?: {[key: string]: any };
  isDeleted?: boolean;
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
  router: ReturnType<typeof useRouter>
) => {

  
  // console.log('[ChatWindow load Messages DEBUG] res:', res.json());
  const res = await fetch(
    `http://localhost:3002/api/chats/${chatId}/messages`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  console.log('[ChatWindow] 메시지 반응', res);

  if (res.status === 204) {
    setNotFound(true);
    setIsMessagesLoaded(true);

    // 0.5초 기다렸다가 홈으로 이동
    setTimeout(() => {
      router.push('/');
    }, 500);

    return;
  }


  const data = await res.json();  
  const rawMessages = data.messageList;
  // 단순히 시간순으로 정렬
  rawMessages.sort((a: any, b: any) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (rawMessages.length === 0) {
    setIsMessagesLoaded(true);
    return;
  }

  const messages = rawMessages.map((msg: any) => ({
    ...msg,
    messageId: msg.id,
    metadata: msg.metadata || {},
    sources: msg.metadata?.sources ?? [],
    focusMode: msg.focusMode,
    optimizationMode: msg.optimizationMode,
  })) as Message[];

  console.log('[DEBUG] messages:', messages);
  setMessages(messages);

  // 메시지에서 searchSteps 정보 추출하여 searchStepsMap 초기화
  const newSearchStepsMap: Record<string, SearchStep[]> = {};
  // 공통 chat 정보는 첫 메시지 기준으로 가져옴
  const commonChatData = rawMessages[0].chat;
  
  // 사용자와 어시스턴트 메시지 쌍을 찾아 처리
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'assistant' && i > 0 && messages[i-1].role === 'user') {
      const userMessage = messages[i-1];
      const assistantMessage = messages[i];
      
      // 각 메시지의 focusMode를 확인
      const messageFocusMode = assistantMessage.focusMode || commonChatData.focusMode;
      
      // focusMode가 pipelineSearch인 메시지에 대해서만 처리
      if (messageFocusMode === 'pipelineSearch') {
        // 각 메시지의 optimizationMode를 사용
        const messageOptimizationMode = assistantMessage.optimizationMode || commonChatData.optimizationMode;
        const currentOptimizationMode = OptimizationModes.find(
          mode => mode.key === messageOptimizationMode
        );
        const searchDescription = currentOptimizationMode 
          ? `${currentOptimizationMode.description}에서 검색`
          : '검색 중';

        newSearchStepsMap[assistantMessage.id] = [
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
            sources: assistantMessage.metadata?.sources?.map((source: Document) => {
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

  const history = messages.map((msg: Message) => {
    return [msg.role, msg.content];
  }) as [string, string][];

  console.log('[DEBUG] messages loaded');

  // messages 배열이 비어있지 않을 때만 제목 설정
  if (messages.length > 0) {
    document.title = messages[0].content;
  }

  // const files = commonChatData.fileEntities?.map((file: any) => ({
  //   fileName: file.name,
  //   fileExtension: file.name.split('.').pop(),
  //   fileId: file.fileId,
  // })) ?? [];
  
  // setFiles(files);
  // setFileIds(files.map((file: File) => file.fileId));

  setChatHistory(history);
  
  const lastMessage = messages[messages.length - 1];
  setFocusMode(lastMessage.focusMode || commonChatData.focusMode);
  setOptimizationMode(lastMessage.optimizationMode || commonChatData.optimizationMode || '');

  
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
  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);
  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState('writingAssistant');
  const [optimizationMode, setOptimizationMode] = useState('rnd');
  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [extraMessage, setExtraMessage] = useState({
    field1: '',
    field2: '',
    field3: '',
  });
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([]);
  // 메시지 ID를 키로 사용하는 검색 단계 맵 상태 추가
  const [searchStepsMap, setSearchStepsMap] = useState<Record<string, SearchStep[]>>({});
  const [userData, setUserData] = useState<User | null>(null);

  //새창
  const router = useRouter();
  const ws = useSocket(
    process.env.NEXT_PUBLIC_WS_URL!,
    setIsWSReady,
    setHasError,
  );


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = 'user-1234'; // 또는 props나 다른 방식으로 받아온 ID
        const response = await fetch(`http://localhost:3002/api/users/${userId}`);
        
        if (!response.ok) {
          const errorMessage = `사용자 데이터를 불러오는데 실패했습니다 (Status: ${response.status})`;
          // throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('[DEBUG] API 응답 데이터:', data);
        // API 응답의 날짜 문자열을 Date 객체로 변환
        const formattedData: User = {
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : null,
          lastActive: data.lastActive ? new Date(data.lastActive) : null
        };
        
        setUserData(formattedData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // 에러 처리 - 필요한 경우 폴백 데이터 사용
        setUserData({
          id: "fallback-id",
          name: "사용자",
          department: "소속 없음",
          email: "unknown@example.com",
          isDeleted: false
        });
      }
    };

    fetchUserData();
  }, []);

  
  const optimizationModeKey = OptimizationModes.find(mode => mode.key === optimizationMode);
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
        setOptimizationMode,  // 새로운 파라미터 전달
        router
      );
    } else if (!chatId) {
      console.log('[ChatWindow] 새 채팅 생성');
      setNewChatCreated(true);
      setIsMessagesLoaded(true);
      setChatId(crypto.randomBytes(20).toString('hex'));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (ws?.readyState === 1) {
        ws.close();
        console.log('[DEBUG] closed');
      }
    };
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

       // 초기 상태 설정 - start는 active로 시작
      setSearchStepsMap(prev => {
        const newMap = {...prev};
        newMap[messageId] = [
          {
            type: 'start',
            query: message,
            status: 'active'
          },
          {
            type: 'search',
            description: searchDescription,
            status: 'pending'
          }
        ];
        return newMap;
      });

    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: messageId!,
        content: message,
        chatId: chatId!,
        createdAt: new Date(),
        createdBy: userData?.id || 'unknown',
        role: 'user',
        metadata: {
          sources: undefined,
          suggestions: undefined
        },
        focusMode: focusMode,
        optimizationMode: optimizationMode,
        isDeleted: false
      },
    ]);

    ws?.send(
      JSON.stringify({
        type: 'message',
        message: {
          messageId: messageId,
          chatId: chatId!,
          content: message,
          userId: userData?.id, // 더미 유저 ID 추가
        },
        files: fileIds,
        focusMode: focusMode,
        optimizationMode: optimizationMode,
        extraMessage: extraMessage,
        history: [...chatHistory, ['human', message]],
      }),
    );

    

    // 검색 단계 업데이트를 위한 타이머 설정 (기존 코드 유지)
  if (focusMode === 'pipelineSearch') {
    setTimeout(() => {
      setSearchStepsMap(prev => {
        const currentSteps = prev[messageId] || [];
        if (currentSteps.length >= 2) {
          return {
            ...prev,
            [messageId]: [
              {
                ...currentSteps[0],
                status: 'completed'
              },
              {
                ...currentSteps[1],
                status: 'active'
              }
            ]
          };
        }
        return prev;
      });
    }, 5000);
  }

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
            id: data.messageId,
            content: '',
            chatId: chatId!,
            createdAt: new Date(),
            createdBy: 'assistant',
            role: 'assistant',
            metadata: {
              sources: sources
            },
            focusMode: focusMode,
            optimizationMode: optimizationMode,
            isDeleted: false
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

        // 0327
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: data.messageId,
              content: data.data,
              chatId: chatId!,
              createdAt: new Date(),
              createdBy: 'assistant',
              role: 'assistant',
              metadata: {
                sources: sources
              },
              focusMode: focusMode,
              optimizationMode: optimizationMode,
              isDeleted: false
            },
          ]);
          added = true;
        }

        // 0327
        setMessages((prev) =>
          prev.map((message) => {
            if (message.id === data.messageId) {
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

      }
    };

    ws?.addEventListener('message', messageHandler);
  };

  /// 메시지 컴포넌트에 검색 단계 전달을 위한 함수 개선
const getSearchStepsForMessage = (messageId: string) => {
  console.log(`[DEBUG] 메시지 ID ${messageId}에 대한 검색 단계 요청:`, searchStepsMap[messageId]);
  return searchStepsMap[messageId] || [];
};

  // 0327
  const rewrite = async (messageId: string) => {
    console.log('[ChatWindow] 메시지 재작성:', messageId);
    const index = messages.findIndex((msg) => msg.id === messageId);

    // if (index === -1) return;

    // const message = messages[index - 1]; // 사용자 메시지
    // const assistantMessage = messages[index]; // AI 메시지
    // const messageFocusMode = message.focusMode;

    // if (messageFocusMode) {
    //   setFocusMode(messageFocusMode);
    // }
    // 1. AI 답변 메시지 정보 가져오기
    const getAnswerRes = await fetch(
      `http://localhost:3002/api/messages/${messageId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const assistantMessage = await getAnswerRes.json();
      
    // 2. description(질문 메시지 ID)으로 원본 질문 메시지 가져오기
    const getUserMessageRes = await fetch(
      `http://localhost:3002/api/messages/${assistantMessage.description}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const message = await getUserMessageRes.json();

    

    // 클라이언트 상태 업데이트 - 사용자 메시지는 유지하고 AI 메시지만 초기화
    console.log('[ChatWindow] 메시지 재작성 assistantMessage:', assistantMessage);
    console.log('[ChatWindow] 메시지 재작성 message:', message);
    // setMessages((prev) =>
    //   prev.map((msg, i) => {
    //     if (i === index) {
    //       return {
    //         ...msg,
    //         content: '',
    //         metadata: { ...msg.metadata, sources: undefined },
    //         description: message.id,
    //       };
    //     }
    //     return msg;
    //   })
    // );
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: '',
            metadata: { ...msg.metadata, sources: undefined },
            description: message.id,
          };
        }
        return msg;
      })
    );
    console.log('[ChatWindow] 메시지 재작성 index:', messages);

    setChatHistory((prev) => {
      return [...prev.slice(0, index)];
    });
    console.log('[ChatWindow] 메시지 재작성 chatHistory:', chatHistory);
    setLoading(true);
    setMessageAppeared(false);

    let sources: Document[] | undefined = undefined;
    let recievedMessage = '';

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
        
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  sources: sources
                }
              };
            }
            return msg;
          })
        );
      }

      if (data.type === 'message') {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              return { ...msg, content: (msg.content || '') + data.data };
            }
            return msg;
          })
        );

        recievedMessage += data.data;
        setMessageAppeared(true);
      }

      if (data.type === 'messageEnd') {
        console.log('[ChatWindow] 메시지 수신 완료');
        setChatHistory((prevHistory) => [
          ...prevHistory,
          ['human', message.content],
          ['assistant', recievedMessage],
        ]);

        ws?.removeEventListener('message', messageHandler);
        setLoading(false);
      }
    };

    // 이벤트 리스너를 먼저 등록
    ws?.addEventListener('message', messageHandler);

    console.log('[ChatWindow] 메시지 재작성 message2:', message);

    // 그 다음 메시지 전송
    ws?.send(
      JSON.stringify({
        type: 'rewrite',
        message: {
          messageId: messageId,
          chatId: chatId!,
          content: message.content,
          userId: message.createdBy,
          description: message.id
        },
        files: fileIds,
        focusMode: message.focusMode || focusMode,
        optimizationMode: optimizationMode,
        extraMessage: extraMessage,
        history: chatHistory.slice(0, index)
      })
    );
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
              setMessages={setMessages}
              sendMessage={sendMessage}
              messageAppeared={messageAppeared}
              rewrite={rewrite}
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
              searchStepsMap={searchStepsMap}
              getSearchStepsForMessage={getSearchStepsForMessage}
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
