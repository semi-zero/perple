/* eslint-disable @next/next/no-img-element */
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Document } from '@langchain/core/documents';
import { File } from 'lucide-react';
import { Fragment, useState } from 'react';

const MessageSources = ({ sources }: { sources: Document[] }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeModal = () => {
    setIsDialogOpen(false);
    document.body.classList.remove('overflow-hidden-scrollable');
  };

  const openModal = () => {
    setIsDialogOpen(true);
    document.body.classList.add('overflow-hidden-scrollable');
  };

  return (
    <div className="space-y-3">
      {/* 메인 소스 리스트 */}
      <div className="grid grid-cols-1 gap-3">
        {sources.slice(0, 3).map((source, i) => (
          <a
            key={i}
            href={source.metadata.url}
            target="_blank"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
            dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* 아이콘/파비콘 */}
            <div className="flex-shrink-0">
              {source.metadata.url === 'File' ? (
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <File size={20} className="text-gray-600 dark:text-gray-400" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <img
                    src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                    width={20}
                    height={20}
                    alt="favicon"
                    className="rounded"
                  />
                </div>
              )}
            </div>

            {/* 소스 정보 */}
            <div className="flex-grow min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {source.metadata.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {source.metadata.url.replace(/.+\/\/|www.|\..+/g, '')}
              </p>
            </div>

            {/* 소스 번호 */}
            <div className="flex-shrink-0 ml-4">
              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full 
              bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                #{i + 1}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* 더보기 버튼 */}
      {sources.length > 3 && (
        <button
          onClick={openModal}
          className="w-full p-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 
          dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 
          transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          더보기 ({sources.length - 3}개의 추가 소스)
        </button>
      )}

      {/* 모달 */}
      <Transition appear show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm">
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      전체 소스 목록
                    </DialogTitle>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-3">
                      {sources.map((source, i) => (
                        <a
                          key={i}
                          href={source.metadata.url}
                          target="_blank"
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700
                          hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          {/* 아이콘/파비콘 */}
                          <div className="flex-shrink-0">
                            {source.metadata.url === 'File' ? (
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <File size={20} className="text-gray-600 dark:text-gray-400" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <img
                                  src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                                  width={20}
                                  height={20}
                                  alt="favicon"
                                  className="rounded"
                                />
                              </div>
                            )}
                          </div>

                          {/* 소스 정보 */}
                          <div className="flex-grow min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {source.metadata.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {source.metadata.url.replace(/.+\/\/|www.|\..+/g, '')}
                            </p>
                          </div>

                          {/* 소스 번호 */}
                          <div className="flex-shrink-0 ml-4">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full 
                            bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                              #{i + 1}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default MessageSources;
