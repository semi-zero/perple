import { Clock, Edit, Share, Trash } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';
import DeleteChat from './DeleteChat';
import { focusModes } from '@/components/MessageInputActions/Focus';
import { useUI } from '@/contexts/UIContext';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;  // '2023-01-02T10:30:00Z' 같은 형식이라고 가정
  focusMode: string;
}

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
  const { isSidebarOpen } = useUI();
  
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



  ////////////////////채팅 삭제 관련 기능////////////////////
  // 채팅 목록
  const [chats, setChats] = useState<Chat[]>([]);

  // 삭제 확인 모달
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  const openDeleteConfirmModal = (chatId: string) => {
    setDeleteConfirmModal({ open: true, chatId });
  };

  const closeDeleteConfirmModal = () => {
    setDeleteConfirmModal({ open: false, chatId: null });
  };

  const deleteChat = async () => {
    if (!deleteConfirmModal.chatId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chats/${deleteConfirmModal.chatId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) throw new Error('Failed to delete chat');

      // 성공 후 state에서 해당 항목 제거
      setChats((prev) => prev.filter((chat) => chat.id !== deleteConfirmModal.chatId));
      closeDeleteConfirmModal();
    } catch (error) {
      console.error(error);
    }
  };

  console.log('[Navbar]:', chatId)

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
    <div className={`fixed top-0 right-0 px-4 lg:pr-[60px] flex flex-row items-center justify-between py-3 
      text-sm text-black dark:text-white/80 border-b bg-white/80 dark:bg-dark-primary/80 backdrop-blur-md
      transition-all duration-300 ${
        isSidebarOpen 
          ? 'left-64 lg:pl-[60px]' 
          : 'left-24 lg:pl-[40px]'
      }`}>
        
      <div className="flex items-center space-x-2">
        <Clock size={16} />
        <p className="text-sm font-medium">{formatDateTime(messagesCreatedAt.toString())}</p>
      </div>
      <p className="text-sm font-semibold truncate w-1/2 text-center">{title}</p>
      <div className="flex flex-row items-center space-x-3">
        <button className="p-2.5 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200">
          <Share size={16} />
        </button>
        <button 
        className="p-2.5 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200  text-red-500"
        onClick={() => openDeleteConfirmModal(chatId)}
        >
          <Trash size={16} />
        </button>
        {/* <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} /> */}

        {/* ------------ 채팅 삭제 확인 모달 ------------ */}
        {deleteConfirmModal.open && (
        <div className="fixed inset-0 flex bg-black bg-opacity-50 items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-primary p-4 rounded-lg shadow-lg w-full max-w-sm">
            {/* 모달 제목 */}
            <h2 className="text-base font-semibold">채팅을 삭제하시겠습니까?</h2>
            {/* 모달 안내 문구 */}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              이 행동으로 채팅이 삭제됩니다.
              <br />
            </p>
            {/* 하단 버튼 영역 */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-white-200 dark:bg-gray-700 rounded-2xl text-sm border border-light-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={closeDeleteConfirmModal}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-2xl text-sm hover:bg-red-600"
                onClick={deleteChat}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default Navbar;