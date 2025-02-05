import { Clock, Edit, Share, Trash } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';
import DeleteChat from './DeleteChat';
import { focusModes } from '@/components/MessageInputActions/Focus';

const Navbar = ({
  chatId,
  messages,
  mode,
}: {
  messages: Message[];
  chatId: string;
  mode: string;
}) => {
  const [title, setTitle] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  const getModeTitle = (modeKey: string) => {
    const selectedMode = focusModes.find((m) => m.key === modeKey);
    return selectedMode?.title || '모드';
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
      const newTimeAgo = formatTimeDifference(
        new Date(),
        messages[0].createdAt,
      );
      setTimeAgo(newTimeAgo);
    }
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (messages.length > 0) {
        const newTimeAgo = formatTimeDifference(
          new Date(),
          messages[0].createdAt,
        );
        setTimeAgo(newTimeAgo);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [messages]);

  return (
    <div className="fixed z-50 top-0 left-20 right-0 px-4 flex flex-row items-center justify-between w-full py-3 text-sm text-black dark:text-white/70 border-b bg-white/80 dark:bg-dark-primary/80 backdrop-blur-md shadow-md">
      <div className="flex items-center space-x-2">
        <Clock size={16} />
        <p className="text-sm font-medium">{getModeTitle(mode)}</p>
      </div>
      <p className="text-sm font-semibold truncate w-1/2 text-center">{title}</p>
      <div className="flex flex-row items-center space-x-3">
        <button className="p-2 bg-gray-200 dark:bg-dark-300 rounded-full hover:scale-105 transition-transform">
          <Share size={16} />
        </button>
        <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} />
      </div>
    </div>
  );
};

export default Navbar;