import { EventEmitter, WebSocket } from 'ws';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import logger from '../utils/logger';
import db from '../db';
import { chats, messages as messagesSchema } from '../db/schema';
import { eq, asc, gt, and } from 'drizzle-orm';
import crypto from 'crypto';
import { getFileDetails } from '../utils/files';
import MetaSearchAgent, {
  MetaSearchAgentType,
} from '../search/metaSearchAgent';
import prompts from '../prompts';
import type { InferModel } from 'drizzle-orm';
import axios from 'axios';

interface ExtraMessage {
  field1: string;
  field2: string;
  field3: string;
}

type Message = {
  messageId: string;
  chatId: string;
  content: string;
  userId: string;
};

type WSMessage = {
  message: Message;
  type: string;
  focusMode: string;
  optimizationMode: string;
  extraMessage: ExtraMessage;
  history: Array<[string, string]>;
  files: Array<string>;
};

export const searchHandlers = {
  webSearch: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: true,
  }),
  academicSearch: new MetaSearchAgent({
    activeEngines: ['arxiv', 'google scholar', 'pubmed'],
    queryGeneratorPrompt: prompts.academicSearchRetrieverPrompt,
    responsePrompt: prompts.academicSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: true,
    summarizer: false,
  }),
  writingAssistant: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    responsePrompt: prompts.writingAssistantPrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: false,
    summarizer: false,
  }),
  wolframAlphaSearch: new MetaSearchAgent({
    activeEngines: ['wolframalpha'],
    queryGeneratorPrompt: prompts.wolframAlphaSearchRetrieverPrompt,
    responsePrompt: prompts.wolframAlphaSearchResponsePrompt,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: true,
    summarizer: false,
  }),
  youtubeSearch: new MetaSearchAgent({
    activeEngines: ['youtube'],
    queryGeneratorPrompt: prompts.youtubeSearchRetrieverPrompt,
    responsePrompt: prompts.youtubeSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
  }),
  pipelineSearch: new MetaSearchAgent({
    activeEngines: ['pipeline'],
    queryGeneratorPrompt: prompts.redditSearchRetrieverPrompt,
    responsePrompt: prompts.redditSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
  }),
};


const handleEmitterEvents = (
  emitter: EventEmitter,
  ws: WebSocket,
  messageId: string,
  chatId: string,
  parsedWSMessage: WSMessage,
) => {
  let recievedMessage = '';
  let sources = [];

  emitter.on('data', (data) => {
    const parsedData = JSON.parse(data);
    if (parsedData.type === 'response') {
      ws.send(
        JSON.stringify({
          type: 'message',
          data: parsedData.data,
          messageId: messageId,
        }),
      );
      recievedMessage += parsedData.data;
    } else if (parsedData.type === 'sources') {
      ws.send(
        JSON.stringify({
          type: 'sources',
          data: parsedData.data,
          messageId: messageId,
        }),
      );
      sources = parsedData.data;
    }
  });
  
  emitter.on('end', () => {
    ws.send(JSON.stringify({ type: 'messageEnd', messageId: messageId }));
    
    
    const newAssistantMessage = {
      id: messageId,
      content: recievedMessage,
      chatId: chatId,
      // createdBy: 'assistant',
      role: 'assistant',
      metadata: {
        ...(sources && sources.length > 0 && { sources }),
      },
      focusMode: parsedWSMessage.focusMode,
      optimizationMode: parsedWSMessage.optimizationMode,
      extraMessages: parsedWSMessage.extraMessage 
        ? [parsedWSMessage.extraMessage] 
        : undefined,
      feedbackLike: false,
      feedbackDislike: false,
      // isDeleted: false
    };

    
    
    try {
      const createResponse = axios.post(
        'http://172.22.16.1:3002/api/messages',
        newAssistantMessage
      );
    } catch (error) {
      throw new Error('Failed to create assistant message');
    }
    
  });

  emitter.on('error', (data) => {
    const parsedData = JSON.parse(data);
    ws.send(
      JSON.stringify({
        type: 'error',
        data: parsedData.data,
        key: 'CHAIN_ERROR',
      }),
    );
  });
};

export const handleMessage = async (
  message: string,
  ws: WebSocket,
  llm: BaseChatModel,
  embeddings: Embeddings,
) => {
  try {
    const parsedWSMessage = JSON.parse(message) as WSMessage;
    const parsedMessage = parsedWSMessage.message;

    if (parsedWSMessage.files.length > 0) {
      /* TODO: Implement uploads in other classes/single meta class system*/
      parsedWSMessage.focusMode = 'webSearch';
    }

    const humanMessageId =
      parsedMessage.messageId ?? crypto.randomBytes(7).toString('hex');
    const aiMessageId = crypto.randomBytes(7).toString('hex');

    if (!parsedMessage.content)
      return ws.send(
        JSON.stringify({
          type: 'error',
          data: 'Invalid message format',
          key: 'INVALID_FORMAT',
        }),
      );

    const history: BaseMessage[] = parsedWSMessage.history.map((msg) => {
      if (msg[0] === 'human') {
        return new HumanMessage({
          content: msg[1],
        });
      } else {
        return new AIMessage({
          content: msg[1],
        });
      }
    });

    if (parsedWSMessage.type === 'message') {
      const handler: MetaSearchAgentType =
        searchHandlers[parsedWSMessage.focusMode];

      if (handler) {
        try {
          // const emitter = await handler.searchAndAnswer(
          //   parsedMessage.content,
          //   history,
          //   llm,
          //   embeddings,
          //   parsedWSMessage.focusMode,
          //   parsedWSMessage.optimizationMode,
          //   parsedWSMessage.extraMessage,
          //   parsedWSMessage.files,
          // );

          // handleEmitterEvents(emitter, 
          //   ws, 
          //   aiMessageId, 
          //   parsedMessage.chatId,
          //   parsedWSMessage);
          

          const emitter = await handler.searchAndAnswer(
            parsedMessage.content,
            history,
            llm,
            embeddings,
            parsedWSMessage.focusMode,
            parsedWSMessage.optimizationMode,
            parsedWSMessage.extraMessage,
            parsedWSMessage.files,
          );

          handleEmitterEvents(emitter, 
            ws, 
            aiMessageId, 
            parsedMessage.chatId,
            parsedWSMessage);
          
          // 1. 채팅 존재 여부 확인
          try {
            const response = await axios.get(`http://172.22.16.1:3002/api/chats/${parsedMessage.chatId}`);

            if (response.status === 200) {
              console.log(`[Debug] Chat ${parsedMessage.chatId} exists`);
              // return; // 정상 존재, 여기서 종료
            } else {
              // 200이 아닌 다른 성공 코드(204 등)면 에러를 던져서 catch에서 처리
              throw { response: { status: response.status } };
            }
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404 || error.response?.status === 204) {
              // 2. 채팅 생성
              console.log(`[Debug] Chat ${parsedMessage.chatId} created start`);
              const newChat = {
                id: parsedMessage.chatId,
                title: parsedMessage.content.length > 12 
                  ? parsedMessage.content.slice(0,12) + "..." 
                  : parsedMessage.content,
                createdBy: parsedMessage.userId || 'unknown',
                userId: parsedMessage.userId || 'unknown',
                focusMode: parsedWSMessage.focusMode,
                optimizationMode: parsedWSMessage.optimizationMode,
                extraMessages: parsedWSMessage.extraMessage 
                  ? [parsedWSMessage.extraMessage] 
                  : undefined,
                // fileEntities: parsedWSMessage.files.map(file => ({
                //   fileId: file,
                //   name: getFileDetails(file).name
                // })),
                // isDeleted: false
              };
              
              const chatResponse = await axios.post('http://172.22.16.1:3002/api/chats', newChat);
              console.log(`[Debug] Chat ${parsedMessage.chatId} created successfully, response:`, chatResponse.status);
              
              // 채팅 생성 후 잠시 대기 (DB 저장 시간 고려)
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.error('[Error] Failed to check chat existence:', error);
              throw error;
            }
          }
          
          // 3. 메시지 존재 여부 확인
          try {
            
            const messageResponse = await axios.get(`http://172.22.16.1:3002/api/messages/${humanMessageId}`);

            if (messageResponse.status === 200) {
              console.log(`[Debug] Message ${humanMessageId} exists`);
            
              // 4. 기존 메시지 이후의 메시지들 삭제
              try {
                const deleteResponse = await axios.delete(
                  `http://172.22.16.1:3002/api/messages`,
                  { params: { chatId: parsedMessage.chatId, messageId: humanMessageId } }
                );
                console.log(`[Debug] Messages after ${humanMessageId} deleted successfully`);
              } catch (deleteError) {
                console.error('[Error] Failed to delete messages:', deleteError);
                throw new Error('Failed to delete messages');
              }
            
              // return; // 삭제 후 종료
            }

            // 204 등 다른 상태코드면 에러를 던져서 catch에서 처리
            throw { response: { status: messageResponse.status } };
            
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404 || error.response?.status === 204) {
              // 5. 새 메시지 생성
              const newMessage = {
                id: humanMessageId,
                content: parsedMessage.content,
                chatId: parsedMessage.chatId,
                // createdBy: parsedMessage.userId || 'unknown',
                role: 'user',
                metadata: {},
                focusMode: parsedWSMessage.focusMode,
                optimizationMode: parsedWSMessage.optimizationMode,
                extraMessages: parsedWSMessage.extraMessage 
                  ? [parsedWSMessage.extraMessage] 
                  : undefined,
                feedbackLike: false,
                feedbackDislike: false,
                // isDeleted: false
              };
              
              console.log(`[Debug] Creating message ${humanMessageId}`);
              const createResponse = await axios.post('http://172.22.16.1:3002/api/messages', newMessage);
              console.log(`[Debug] Message ${humanMessageId} created successfully, response:`, createResponse.status);
            } else {
              console.error('[Error] Failed to check message existence:', error);
              throw error;
            }
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        ws.send(
          JSON.stringify({
            type: 'error',
            data: 'Invalid focus mode',
            key: 'INVALID_FOCUS_MODE',
          }),
        );
      }
    }
  } catch (err) {
    ws.send(
      JSON.stringify({
        type: 'error',
        data: 'Invalid message format',
        key: 'INVALID_FORMAT',
      }),
    );
    logger.error(`Failed to handle message: ${err}`);
  }
};
