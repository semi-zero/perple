import { Settings } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsDialog from './SettingsDialog';
import { useState } from 'react';
import { File } from './ChatWindow';

interface ExtraMessage {
  field1: string;
  field2: string;
  field3: string;
}

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
  extraMessage,
  setExtraMessage,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  extraMessage: ExtraMessage;
  setExtraMessage: React.Dispatch<React.SetStateAction<ExtraMessage>>;  // 여기를 수정
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

 

  return (
    <div className="relative">
      <SettingsDialog isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} />
      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <Settings
          className="cursor-pointer lg:hidden"
          onClick={() => setIsSettingsOpen(true)}
        />
      </div>
      <div className="flex flex-col items-center justify-center h-screen max-w-screen-md mx-auto p-2 space-y-8">
        <h2 className="text-black dark:text-white/70 text-3xl font-semibold -mt-24">
          SAMSUNG SDI R&D AI Assistant
        </h2>
        <EmptyChatMessageInput
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
      </div>
      
    </div>
  );
};

export default EmptyChat;
