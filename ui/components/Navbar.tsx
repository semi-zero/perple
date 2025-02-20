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

  const messagesCreatedAt = messages[0]?.createdAt || messages[0]?.metadata?.createdAt;

  // 날짜/시간 포매팅 함수(예시)
  const formatDateTime = (datetime: string) => {
    // 예: YYYY-MM-DD HH:mm 으로 간단 변환
    const d = new Date(datetime);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${min}`;
  };

  return (
    <div className="fixed top-0 left-60 right-0 px-4 lg:pl-[60px] lg:pr-[60px] lg:px-4 flex flex-row items-center justify-between py-3 
    text-sm text-black dark:text-white/80 border-b bg-white/80 dark:bg-dark-primary/80 backdrop-blur-md shadow-md">
      <div className="flex items-center space-x-2">
        <Clock size={16} />
        <p className="text-sm font-medium">{formatDateTime(messagesCreatedAt.toString())}</p>
      </div>
      <p className="text-sm font-semibold truncate w-1/2 text-center">{title}</p>
      <div className="flex flex-row items-center space-x-3">
        <button className="p-2 bg-white/80 dark:bg-dark-300 rounded-full hover:scale-105 hover:bg-gray-200 transition-transform">
          <Share size={16} />
        </button>
        <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} />
      </div>
    </div>
  );
};

export default Navbar;