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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sources.slice(0, 3).map((source, i) => (
        <a
          className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl p-4 flex flex-col space-y-3 border border-gray-200 dark:border-gray-700"
          key={i}
          href={source.metadata.url}
          target="_blank"
        >
          <p className="text-sm font-medium dark:text-white truncate">{source.metadata.title}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {source.metadata.url === 'File' ? (
                <div className="bg-gray-700 p-2 rounded-full flex items-center justify-center">
                  <File size={14} className="text-white" />
                </div>
              ) : (
                <img
                  src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                  width={18}
                  height={18}
                  alt="favicon"
                  className="rounded-lg"
                />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {source.metadata.url.replace(/.+\/\/|www.|\..+/g, '')}
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{i + 1}</span>
          </div>
        </a>
      ))}
      {sources.length > 3 && (
        <button
          onClick={openModal}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white transition-all duration-300 hover:shadow-lg rounded-xl p-4 font-semibold flex flex-col items-center justify-center"
        >
          <p className="text-sm">View {sources.length - 3} more</p>
        </button>
      )}
      <Transition appear show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/50 backdrop-blur">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-6 border border-gray-300 dark:border-gray-700">
                <DialogTitle className="text-lg font-bold dark:text-white">Sources</DialogTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-auto max-h-72 mt-4">
                  {sources.map((source, i) => (
                    <a
                      className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 rounded-lg p-3 flex flex-col space-y-2"
                      key={i}
                      href={source.metadata.url}
                      target="_blank"
                    >
                      <p className="text-xs font-medium dark:text-white truncate">{source.metadata.title}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {source.metadata.url === 'File' ? (
                            <div className="bg-gray-700 p-2 rounded-full flex items-center justify-center">
                              <File size={14} className="text-white" />
                            </div>
                          ) : (
                            <img
                              src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                              width={18}
                              height={18}
                              alt="favicon"
                              className="rounded-lg"
                            />
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {source.metadata.url.replace(
                                /.+\/\/|www.|\..+/g,
                                '',
                              )}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{i + 1}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default MessageSources;
