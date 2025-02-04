import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from '@langchain/core/prompts';
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import LineListOutputParser from '../lib/outputParsers/listLineOutputParser';
import LineOutputParser from '../lib/outputParsers/lineOutputParser';
import { getDocumentsFromLinks } from '../utils/documents';
import { Document } from 'langchain/document';
import { searchSearxng } from '../lib/searxng';
import path from 'path';
import fs from 'fs';
import computeSimilarity from '../utils/computeSimilarity';
import formatChatHistoryAsString from '../utils/formatHistory';
import eventEmitter from 'events';
import { StreamEvent } from '@langchain/core/tracers/log_stream';
import { IterableReadableStream } from '@langchain/core/utils/stream';

export interface MetaSearchAgentType {
  searchAndAnswer: (
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
  ) => Promise<eventEmitter>;
}

interface Config {
  searchWeb: boolean;
  rerank: boolean;
  summarizer: boolean;
  rerankThreshold: number;
  queryGeneratorPrompt: string;
  responsePrompt: string;
  activeEngines: string[];
}

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

class MetaSearchAgent implements MetaSearchAgentType {
  private config: Config;
  private strParser = new StringOutputParser();

  constructor(config: Config) {
    console.log('[MetaSearchAgent] Initializing with config:', {
      searchWeb: config.searchWeb,
      rerank: config.rerank,
      summarizer: config.summarizer,
      activeEngines: config.activeEngines
    });
    this.config = config;
  }

  private async createSearchRetrieverChain(llm: BaseChatModel) {
    console.log('[SearchRetrieverChain] Initializing with LLM:', llm);
  
    (llm as unknown as ChatOpenAI).temperature = 0;

    return RunnableSequence.from([
      PromptTemplate.fromTemplate(this.config.queryGeneratorPrompt),
      llm,
      this.strParser,
      RunnableLambda.from(async (input: string) => {
        const linksOutputParser = new LineListOutputParser({
          key: 'links',
        });
        console.log('[SearchRetrieverChain] Processing input:', input);

        const questionOutputParser = new LineOutputParser({
          key: 'question',
        });

        const links = await linksOutputParser.parse(input);
        console.log('[SearchRetrieverChain] Parsed links:', links.length);

        let question = this.config.summarizer
          ? await questionOutputParser.parse(input)
          : input;

        console.log('[SearchRetrieverChain] Parsed question:', question);

        if (question === 'not_needed') {
          return { query: '', docs: [] };
        }

        if (links.length > 0) {
          if (question.length === 0) {
            question = 'summarize';
          }

          let docs = [];

          const linkDocs = await getDocumentsFromLinks({ links });
          console.log('[SearchRetrieverChain] Retrieved documents from links:', linkDocs.length);

          const docGroups: Document[] = [];

          linkDocs.map((doc) => {
            const URLDocExists = docGroups.find(
              (d) =>
                d.metadata.url === doc.metadata.url &&
                d.metadata.totalDocs < 10,
            );

            if (!URLDocExists) {
              docGroups.push({
                ...doc,
                metadata: {
                  ...doc.metadata,
                  totalDocs: 1,
                },
              });
            }

            const docIndex = docGroups.findIndex(
              (d) =>
                d.metadata.url === doc.metadata.url &&
                d.metadata.totalDocs < 10,
            );

            if (docIndex !== -1) {
              docGroups[docIndex].pageContent =
                docGroups[docIndex].pageContent + `\n\n` + doc.pageContent;
              docGroups[docIndex].metadata.totalDocs += 1;
            }
          });

          await Promise.all(
            docGroups.map(async (doc) => {
              const res = await llm.invoke(`
            You are a web search summarizer, tasked with summarizing a piece of text retrieved from a web search. Your job is to summarize the 
            text into a detailed, 2-4 paragraph explanation that captures the main ideas and provides a comprehensive answer to the query.
            If the query is \"summarize\", you should provide a detailed summary of the text. If the query is a specific question, you should answer it in the summary.
            
            - **Journalistic tone**: The summary should sound professional and journalistic, not too casual or vague.
            - **Thorough and detailed**: Ensure that every key point from the text is captured and that the summary directly answers the query.
            - **Not too lengthy, but detailed**: The summary should be informative but not excessively long. Focus on providing detailed information in a concise format.

            The text will be shared inside the \`text\` XML tag, and the query inside the \`query\` XML tag.

            <example>
            1. \`<text>
            Docker is a set of platform-as-a-service products that use OS-level virtualization to deliver software in packages called containers. 
            It was first released in 2013 and is developed by Docker, Inc. Docker is designed to make it easier to create, deploy, and run applications 
            by using containers.
            </text>

            <query>
            What is Docker and how does it work?
            </query>

            Response:
            Docker is a revolutionary platform-as-a-service product developed by Docker, Inc., that uses container technology to make application 
            deployment more efficient. It allows developers to package their software with all necessary dependencies, making it easier to run in 
            any environment. Released in 2013, Docker has transformed the way applications are built, deployed, and managed.
            \`
            2. \`<text>
            The theory of relativity, or simply relativity, encompasses two interrelated theories of Albert Einstein: special relativity and general
            relativity. However, the word "relativity" is sometimes used in reference to Galilean invariance. The term "theory of relativity" was based
            on the expression "relative theory" used by Max Planck in 1906. The theory of relativity usually encompasses two interrelated theories by
            Albert Einstein: special relativity and general relativity. Special relativity applies to all physical phenomena in the absence of gravity.
            General relativity explains the law of gravitation and its relation to other forces of nature. It applies to the cosmological and astrophysical
            realm, including astronomy.
            </text>

            <query>
            summarize
            </query>

            Response:
            The theory of relativity, developed by Albert Einstein, encompasses two main theories: special relativity and general relativity. Special
            relativity applies to all physical phenomena in the absence of gravity, while general relativity explains the law of gravitation and its
            relation to other forces of nature. The theory of relativity is based on the concept of "relative theory," as introduced by Max Planck in
            1906. It is a fundamental theory in physics that has revolutionized our understanding of the universe.
            \`
            </example>

            Everything below is the actual data you will be working with. Good luck!

            <query>
            ${question}
            </query>

            <text>
            ${doc.pageContent}
            </text>

            Make sure to answer the query in the summary.
          `);

              const document = new Document({
                pageContent: res.content as string,
                metadata: {
                  title: doc.metadata.title,
                  url: doc.metadata.url,
                },
              });

              docs.push(document);
            }),
          );
          console.log('[SearchRetrieverChain] Processed link documents:', docs.length);
          return { query: question, docs: docs };
        } else {
          console.log('[SearchRetrieverChain] No links found, performing web search');
          const res = await searchSearxng(question, {
            language: 'en',
            engines: this.config.activeEngines,
          });
          console.log('[SearchRetrieverChain] Search results:', res.results.length);
          const documents = res.results.map(
            (result) =>
              new Document({
                pageContent:
                  result.content ||
                  (this.config.activeEngines.includes('youtube')
                    ? result.title
                    : '') /* Todo: Implement transcript grabbing using Youtubei (source: https://www.npmjs.com/package/youtubei) */,
                metadata: {
                  title: result.title,
                  url: result.url,
                  ...(result.img_src && { img_src: result.img_src }),
                },
              }),
          );

          return { query: question, docs: documents };
        }
      }),
    ]);
  }

  private async createAnsweringChain(
    llm: BaseChatModel,
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
  ) {

    // local_experiment
    // optimizationMode = 'quality'
    console.log('[createAnsweringChain] Optimization mode:', optimizationMode);
    if (this.config.activeEngines.includes('pipeline')) {
      return RunnableSequence.from([
        RunnableMap.from({
            query: (input: BasicChainInput) => input.query,
            chat_history: (input: BasicChainInput) => input.chat_history,
            context: RunnableLambda.from(async (input: BasicChainInput) => {
              try {
                // local_experiment
                  const response = await fetch('http://localhost:8000/api/chat/docs', {  // 문서만 받아오는 새로운 엔드포인트
                  // const response = await fetch('http://fastapi-container:8000/api/chat/docs', {  // 문서만 받아오는 새로운 엔드포인트
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: input.query,
                  })
                });
        
                if (!response.ok) {
                  throw new Error('문서 검색 오류');
                }
        
                const { docs, sql_query } = await response.json();
                return {
                  docs,
                  sql_query
                };
              } catch (error) {
                console.error('[문서 검색 오류]:', error);
                return {
                  docs: [],
                  sql_query: ''
                };
              }
            })
            .withConfig({
              runName: 'FinalSourceTableRetriever',
            })
            .pipe((input) => {
              // processDocs는 docs 배열만 처리
              const processed_docs = this.processDocs(input.docs);
              // sql_query는 그대로 전달
              return {
                processed_docs,
                sql_query: input.sql_query
              };
            }),
          }),
          RunnableLambda.from(async (input: { query: string, 
                                            chat_history: BaseMessage[],
                                            context: { processed_docs: string, sql_query: string } 
          }) => {
              try {
                  console.log('[AnsweringChain] Processing query:', input.query);
                  const history = input.chat_history.map(msg => ({
                      role: msg._getType() === 'human' ? 'user' : 'assistant',
                      content: msg.content
                  }));
                  console.log('[AnsweringChain] Chat history length:', input.chat_history.length);
                  console.log('[AnsweringChain] Context:', input.context);
                  // local_experiment
                  const response = await fetch('http://localhost:8000/api/chat', {
                  // const response = await fetch('http://fastapi-container:8000/api/chat', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                          message: input.query,
                          history: history
                      })
                  });

                  console.log('[AnsweringChain] FastAPI Response:', response);

                  if (!response.ok) {
                      throw new Error('FastAPI 서버 응답 오류');
                  }

                  // const reader = response.body?.getReader();
                  // if (!reader) throw new Error('응답 스트림을 읽을 수 없습니다');

                  // return reader;
                  // 응답을 텍스트 스트림으로 변환
                  const textStream = response.body?.pipeThrough(new TextDecoderStream());
                  console.log('[AnsweringChain] FastAPI textStream:', textStream);
                  if (!textStream) throw new Error('응답 스트림을 읽을 수 없습니다');
                  
                  const reader = textStream.getReader();
                  return new ReadableStream({
                    async start(controller) {
                      try {
                        while (true) {
                          const { done, value } = await reader.read();
                          if (done) break;
                          
                          // FastAPI 응답을 LangChain 형식으로 변환
                          const lines = value.split('\n').filter(line => line.trim());
                          for (const line of lines) {
                            const event = JSON.parse(line);
                            // 객체를 문자열로 적절히 변환
                            // const chunk = typeof event.data === 'object' ? 
                            // event.data.content || JSON.stringify(event.data) : 
                            // event.data.toString();
                            // console.log('[AnsweringChain] FastAPI event:', event);

                            controller.enqueue(
                              event.data
                            );
                          }
                        }
                        controller.close();
                      } catch (error) {
                        controller.error(error);
                      }
                    }
                  });
              } catch (error) {
                  console.error('[FastAPI 요청 오류]:', error);
                  throw error;
              }
          }).withConfig({
              runName: 'FinalResponseGenerator'
          })
      ]);
  }
    
    
    console.log('[createAnsweringChain] Creating chain with mode:', optimizationMode);
    console.log('[createAnsweringChain] File IDs:', fileIds);
    return RunnableSequence.from([
      RunnableMap.from({
        query: (input: BasicChainInput) => {
          console.log('[AnsweringChain] Processing query:', input.query);
          return input.query;
        },
        chat_history: (input: BasicChainInput) => {
          console.log('[AnsweringChain] Chat history length:', input.chat_history.length);
          return input.chat_history;
        },
        date: () => new Date().toISOString(),
        context: RunnableLambda.from(async (input: BasicChainInput) => {
          console.log('[AnsweringChain] Processing context for query:', input.query);
          const processedHistory = formatChatHistoryAsString(
            input.chat_history,
          );
          console.log('[AnsweringChain] Processed history length:', processedHistory.length);

          let docs: Document[] | null = null;
          let query = input.query;

          if (this.config.searchWeb) {
            console.log('[AnsweringChain] Performing web search');
            const searchRetrieverChain =
              await this.createSearchRetrieverChain(llm);

            const searchRetrieverResult = await searchRetrieverChain.invoke({
              chat_history: processedHistory,
              query,
            });
            console.log('[AnsweringChain] Search results:', searchRetrieverResult.docs.length);

            query = searchRetrieverResult.query;
            docs = searchRetrieverResult.docs;
          }

          const sortedDocs = await this.rerankDocs(
            query,
            docs ?? [],
            fileIds,
            embeddings,
            optimizationMode,
          );
          console.log('[AnsweringChain] Sorted docs:', sortedDocs.length);

          return sortedDocs;
        })
          .withConfig({
            runName: 'FinalSourceRetriever',
          })
          .pipe(this.processDocs),
      }),
      ChatPromptTemplate.fromMessages([
        ['system', this.config.responsePrompt],
        new MessagesPlaceholder('chat_history'),
        ['user', '{query}'],
      ]),
      llm,
      this.strParser,
    ]).withConfig({
      runName: 'FinalResponseGenerator',
    });
  }

  private async rerankDocs(
    query: string,
    docs: Document[],
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
  ) {
    console.log('[rerankDocs] Starting reranking');
    console.log('[rerankDocs] Query:', query);
    console.log('[rerankDocs] Docs count:', docs.length);
    console.log('[rerankDocs] File IDs:', fileIds.length);
    console.log('[rerankDocs] Mode:', optimizationMode);
    if (docs.length === 0 && fileIds.length === 0) {
      console.log('[rerankDocs] No documents to rerank');
      return docs;
    }

    const filesData = fileIds
      .map((file) => {
        console.log('[rerankDocs] Processing file:', file);
        const filePath = path.join(process.cwd(), 'uploads', file);

        const contentPath = filePath + '-extracted.json';
        const embeddingsPath = filePath + '-embeddings.json';

        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));

        const fileSimilaritySearchObject = content.contents.map(
          (c: string, i) => {
            return {
              fileName: content.title,
              content: c,
              embeddings: embeddings.embeddings[i],
            };
          },
        );

        return fileSimilaritySearchObject;
      })
      .flat();
      console.log('[rerankDocs] Processed files data length:', filesData.length);

    if (query.toLocaleLowerCase() === 'summarize') {
      return docs.slice(0, 15);
    }

    const docsWithContent = docs.filter(
      (doc) => doc.pageContent && doc.pageContent.length > 0,
    );

    if (optimizationMode === 'speed' || this.config.rerank === false) {
      if (filesData.length > 0) {
        const [queryEmbedding] = await Promise.all([
          embeddings.embedQuery(query),
        ]);

        const fileDocs = filesData.map((fileData) => {
          return new Document({
            pageContent: fileData.content,
            metadata: {
              title: fileData.fileName,
              url: `File`,
            },
          });
        });

        const similarity = filesData.map((fileData, i) => {
          const sim = computeSimilarity(queryEmbedding, fileData.embeddings);

          return {
            index: i,
            similarity: sim,
          };
        });

        let sortedDocs = similarity
          .filter(
            (sim) => sim.similarity > (this.config.rerankThreshold ?? 0.3),
          )
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 15)
          .map((sim) => fileDocs[sim.index]);

        sortedDocs =
          docsWithContent.length > 0 ? sortedDocs.slice(0, 8) : sortedDocs;

        return [
          ...sortedDocs,
          ...docsWithContent.slice(0, 15 - sortedDocs.length),
        ];
      } else {
        return docsWithContent.slice(0, 15);
      }
    } else if (optimizationMode === 'balanced') {
      const [docEmbeddings, queryEmbedding] = await Promise.all([
        embeddings.embedDocuments(
          docsWithContent.map((doc) => doc.pageContent),
        ),
        embeddings.embedQuery(query),
      ]);

      docsWithContent.push(
        ...filesData.map((fileData) => {
          return new Document({
            pageContent: fileData.content,
            metadata: {
              title: fileData.fileName,
              url: `File`,
            },
          });
        }),
      );

      docEmbeddings.push(...filesData.map((fileData) => fileData.embeddings));

      const similarity = docEmbeddings.map((docEmbedding, i) => {
        const sim = computeSimilarity(queryEmbedding, docEmbedding);

        return {
          index: i,
          similarity: sim,
        };
      });

      const sortedDocs = similarity
        .filter((sim) => sim.similarity > (this.config.rerankThreshold ?? 0.3))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 15)
        .map((sim) => docsWithContent[sim.index]);

      return sortedDocs;
    }
  }

  private processDocs(docs: Document[]) {
    return docs
      .map(
        (_, index) =>
          `${index + 1}. ${docs[index].metadata.title} ${docs[index].pageContent}`,
      )
      .join('\n');
  }

  private async handleStream(
    stream: IterableReadableStream<StreamEvent>,
    emitter: eventEmitter,
  ) {
    console.log('[handleStream] Starting stream processing');

    // if (stream instanceof ReadableStreamDefaultReader) {
    //   // FastAPI 스트림 처리
    //   try {
    //       while (true) {
    //           const { done, value } = await stream.read();
    //           if (done) break;

    //           // const text = new TextDecoder().decode(value);
    //           // const lines = text.split('\n').filter(line => line.trim());
    //           // 각 줄을 개별적으로 처리
    //           const lines = value.split('\n').filter(line => line.trim());

    //           for (const line of lines) {
    //               try {
    //                   const event = JSON.parse(line);
    //                   console.log('[AnsweringChain] FastAPI event:', event);
    //                   emitter.emit('data', JSON.stringify({
    //                     type: 'response',
    //                     data: {
    //                       event: 'on_chain_stream',
    //                       name: 'FinalResponseGenerator',
    //                       data: { chunk: event.data }
    //                     }
    //                   }));
    //                   // if (event.type === 'response') {
    //                   //     emitter.emit('data', JSON.stringify({
    //                   //         type: 'response',
    //                   //         data:  event.data.toString()  // 문자열로 변환 확실히
    //                   //     }));
    //                   // } else if (event.type === 'end') {
    //                   //     emitter.emit('end');
    //                   // }
    //               } catch (e) {
    //                   console.error('JSON 파싱 오류:', e);
    //               }
    //           }
    //       }
    //   } catch (error) {
    //       console.error('스트림 처리 오류:', error);
    //       emitter.emit('error', error);
    //   }
    // } else {
      // 기존 LangChain 스트림 처리
      
        for await (const event of stream) {
          if (
            event.event === 'on_chain_end' &&
            event.name === 'FinalSourceRetriever'
          ) {
            ``;
            emitter.emit(
              'data',
              JSON.stringify({ type: 'sources', data: event.data.output }),
            );
          }
          if (
            event.event === 'on_chain_end' &&
            event.name === 'FinalSourceTableRetriever'
          ) {
            
            emitter.emit(
              'data',
              JSON.stringify({ type: 'sources', data: event.data.output.docs }),
            );
          }
          if (
            event.event === 'on_chain_stream' &&
            event.name === 'FinalResponseGenerator'
          ) {
            
            emitter.emit(
              'data',
              JSON.stringify({ type: 'response', data: event.data.chunk }),
            );
          }
          if (
            event.event === 'on_chain_end' &&
            event.name === 'FinalResponseGenerator'
          ) {
            
            emitter.emit('end');
          }
        }
      // }
    }

  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
  ) {
    console.log('\n[searchAndAnswer] Starting new search');
    console.log('[searchAndAnswer] Message:', message);
    console.log('[searchAndAnswer] History:', history);
    console.log('[searchAndAnswer] History length:', history.length);
    console.log('[searchAndAnswer] Optimization mode:', optimizationMode);
    console.log('[searchAndAnswer] File IDs:', fileIds);
    const emitter = new eventEmitter();

    const answeringChain = await this.createAnsweringChain(
      llm,
      fileIds,
      embeddings,
      optimizationMode,
    );

    
    const stream = answeringChain.streamEvents(
      {
        chat_history: history,
        query: message,
      },
      {
        version: 'v1',
      },
    );
    console.log('[searchAndAnswer] Stream created, starting handling');
    console.log('stream', stream)
    this.handleStream(stream, emitter);

    return emitter;
  }
}

export default MetaSearchAgent;
