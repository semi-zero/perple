'use client';

import DeleteChat from '@/components/DeleteChat';
import { cn, formatTimeDifference } from '@/lib/utils';
import { BookOpenText, ClockIcon, Ellipsis, SquarePen, Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SpaceSelectionModal } from '@/components/SpaceSelectionModal';
import { toast } from 'sonner';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

const Page = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 상태 추가
  const [showSpaceModal, setShowSpaceModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // Action menu
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    chatId: string | null;
    x: number;
    y: number;
  }>({ open: false, chatId: null, x: 0, y: 0 });

  // 삭제 확인 모달
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 액션 메뉴 (점 세 개) 제어
  const handleActionClick = (e: React.MouseEvent, chatId: string) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setActionModal({ open: true, chatId, x: rect.right, y: rect.bottom });
  };

  const closeActionModal = () => {
    setActionModal({ open: false, chatId: null, x: 0, y: 0 });
  };

  const openDeleteConfirmModal = (chatId: string) => {
    setDeleteConfirmModal({ open: true, chatId });
    closeActionModal();
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

  // 바깥 클릭 시 액션 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (actionModal.open) closeActionModal();
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [actionModal.open]);

  

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

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setChats(data.chats);
      setLoading(false);
    };
    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const openSpaceSelectionModal = (chatId: string) => {
    setShowSpaceModal({ open: true, chatId });
    closeActionModal();
  };

  const closeSpaceSelectionModal = () => {
    setShowSpaceModal({ open: false, chatId: null });
  };

  // 채팅을 공간에 추가하는 함수
  const addChatToSpace = async (spaceId: string, chatId: string) => {
    try {
      console.log('[addChatToSpace] spaceId:', spaceId)
      console.log('[addChatToSpace] chatId:', chatId)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${spaceId}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatIds: [chatId] }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('채팅을 공간에 추가하는데 실패했습니다.');
      }
      
      toast.success('채팅이 공간에 추가되었습니다.');
      closeActionModal(); // 성공 후 모달 닫기 추가
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen flex flex-col">
      {/* 고정된 상단 바 */}
      <div className="sticky top-0 left-0 w-full bg-white dark:bg-gray-900 z-10 shadow-sm 
      mt-4 py-6 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenText className="w-7 h-7 text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">도서관</h1>
        </div>
        <input
          type="text"
          placeholder="스레드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-2/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* 스레드 헤더 + 버튼 */}
      <div className="flex items-center justify-between mt-12 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">스레드</h2>
        </div>
        <Link href="/">
          <h2 className="p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
            <SquarePen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </h2>
        </Link>
      </div>

      {/* 채팅 리스트 */}
      <div className="flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {filteredChats.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">스레드가 없습니다.</p>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-5 rounded-xl shadow-md bg-white dark:bg-gray-900 transition-all hover:shadow-lg"
                >
                  <Link
                    href={`/c/${chat.id}`}
                    className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-blue-500"
                  >
                    {chat.title}
                  </Link>
                  <div className="flex items-center justify-between mt-2 text-gray-500 text-sm">
                    <div className="flex items-center space-x-2">
                      <ClockIcon size={16} />
                      <div className="p-0.5">
                        {formatDateTime(chat.createdAt)}
                      </div>
                    </div>
                    <button
                      className="p-1 cursor-pointer  rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition-opacity duration-200"
                      onClick={(e) => handleActionClick(e, chat.id)}
                    >
                    <Ellipsis className="h-5 w-5"/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          



        )}
        
      </div>

      {/* ------------ 액션 모달 (점 세개) ------------ */}
      {actionModal.open && (
        <div
          className="fixed z-[60] bg-white dark:bg-dark-primary p-4 rounded-2xl shadow-lg w-48"
          style={{
            top: `${actionModal.y}px`,
            left: `${actionModal.x - 32}px`,
          }}
        >
          <h2 className="text-sm font-semibold mb-4">옵션</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <button
                className="w-full text-left px-1 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                onClick={closeActionModal}
              >
                공유하기
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-1 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                onClick={closeActionModal}
              >
                이름 바꾸기
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-1 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                onClick={() => openSpaceSelectionModal(actionModal.chatId!)}
              >
                공간에 추가
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-1 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-red-600"
                onClick={() => openDeleteConfirmModal(actionModal.chatId!)}
              >
                삭제
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* 공간 선택 모달 */}
      {showSpaceModal.open && (
        <SpaceSelectionModal
          onClose={closeSpaceSelectionModal}  // () => 제거
          chatId={showSpaceModal.chatId ?? ''} // null 체크 추가
          onSelect={async (spaceId, chatId) => {
            await addChatToSpace(spaceId, chatId);
            closeSpaceSelectionModal();
          }}
        />
      )}

      {/* ------------ 채팅 삭제 확인 모달 ------------ */}
      {deleteConfirmModal.open && (
        <div className="fixed z-[80] inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-dark-primary p-4 rounded-lg shadow-lg w-full max-w-sm">
            {/* 모달 제목 */}
            <h2 className="text-base font-semibold">
              채팅을 삭제하시겠습니까?
            </h2>
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
  );
};

export default Page;
