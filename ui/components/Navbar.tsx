import { Clock, Pencil, Share, Trash2, X, User, Archive } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';
import DeleteChat from './DeleteChat';
import { focusModes } from '@/components/MessageInputActions/Focus';
import { useUI } from '@/contexts/UIContext';
import Modal from '@/components/Modal';  // Modal 컴포넌트 import
import { useRouter } from 'next/navigation';  // 이 import 추가
import { toast } from 'sonner';
import { SpaceSelectionModal } from './SpaceSelectionModal';
import Link from 'next/link';

interface ExtraMessage {
	field1?: string | null;
    field2?: string | null;
    field3?: string | null;
}

interface FileEntity {
	name?: string | null;
    fileId?: string | null;
}

// Space 인터페이스 추가
interface Space {
  id: string;
  spaceName: string;
  description: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
}

// User 인터페이스 추가
interface User {
  id: string;
  name: string;
  epId: string;
  department: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastActive: string;
  groupName: string;
  extraFields: {
    location: string;
    position: string;
  };
  isDeleted: boolean;
}

export interface Chat {
	id: string;
  title: string;
  createdAt?: Date | null;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string;
  description?: string | null;
  focusMode?: string | null;
  optimizationMode?: string | null;
  extraMessages?: ExtraMessage[];
  fileEntities?: FileEntity[];
  space?: Space | null;  // Space 타입 추가
  user?: User | null;    // User 타입 추가
  isDeleted?: boolean;
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
  const [chat, setChat] = useState<Chat | null>(null);
  const { isSidebarOpen } = useUI();
  
  // const getModeTitle = (modeKey: string) => {
  //   const selectedMode = focusModes.find((m) => m.key === modeKey);
  //   return selectedMode?.title || '모드';
  // };
  const router = useRouter();  // useRouter 초기화
  // 채팅 정보 가져오기
  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const res = await fetch(`http://localhost:3002/api/chats/${chatId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch chat info');
        const data = await res.json();
        console.log(data);
        setTitle(data.title); // 채팅 테이블의 title 사용
        setChat(data);
      } catch (error) {
        console.error('채팅 정보 가져오기 실패:', error);
      }
    };

    fetchChatInfo();
  }, [chatId]);

  // 0327
  useEffect(() => {
    if (messages.length > 0) {
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
      const newTimeAgo = formatTimeDifference(
        new Date(),
        messages[0]?.createdAt || new Date(),
      );
      setTimeAgo(newTimeAgo);
    }
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (messages.length > 0) {
        const newTimeAgo = formatTimeDifference(
          new Date(),
          messages[0]?.createdAt || new Date(),
        );
        setTimeAgo(newTimeAgo);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [messages]);

  const messagesCreatedAt = messages[0]?.createdAt || (messages[0] as any)?.metadata?.createdAt;



  
  // 채팅 목록
  const [chats, setChats] = useState<Chat[]>([]);

  ////////////////////채팅 삭제 관련 기능////////////////////
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
      // const res = await fetch(
      //   `${process.env.NEXT_PUBLIC_API_URL}/chats/${deleteConfirmModal.chatId}`,
      //   {
      //     method: 'DELETE',
      //     headers: { 'Content-Type': 'application/json' },
      //   }
      // );
      const res = await fetch(
        `http://localhost:3002/api/chats/${deleteConfirmModal.chatId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) throw new Error('Failed to delete chat');

      // 성공 후 state에서 해당 항목 제거
      setChats((prev) => prev.filter((chat) => chat.id !== deleteConfirmModal.chatId));
      closeDeleteConfirmModal();

      // 삭제 후 홈페이지로 리다이렉트
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('채팅 삭제에 실패했습니다.');
    }
  };



  ////////////////////채팅 이름 수정(PUT) 관련 기능(인라인)////////////////////
  const [editingChatName, setEditingChatName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);

  // 채팅 이름 수정을 위한 state 추가
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  // 편집 모드 시작
  const startEditing = () => {
    setIsEditing(true);
    setEditingTitle(title);
  };

  // 편집 모드 종료
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTitle('');
  };

  // 채팅 이름 업데이트 처리
  const handleUpdateTitle = async () => {
    try {
      const updateChatData = {
        id: chatId,
        title: editingTitle.trim(),
        createdBy: 'user-1234',
        userId: 'user-1234',
      };

      const res = await fetch(
        `http://localhost:3002/api/chats`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateChatData),
        }
      );
      if (!res.ok) throw new Error('Failed to update chat');

      // 성공 시 상태 업데이트
      setTitle(editingTitle.trim());
      cancelEditing();
    } catch (error) {
      console.error(error);
      alert('채팅 이름 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

   ////////////////////공간 액션 메뉴 관련 기능(채팅 공간에 저장, 채팅 공간에 제거)////////////////////
  // 상태 추가
  const [showSpaceModal, setShowSpaceModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  const openSpaceSelectionModal = (chatId: string) => {
    setShowSpaceModal({ open: true, chatId });
  };

  const closeSpaceSelectionModal = () => {
    setShowSpaceModal({ open: false, chatId: null });
  };

  // 채팅을 공간에 추가하는 함수
  const addChatToSpace = async (spaceId: string, chatId: string) => {
    try {
      console.log('[addChatToSpace] spaceId:', spaceId)
      console.log('[addChatToSpace] chatId:', chatId)
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces/${spaceId}/chats`, {
      const response = await fetch(`http://localhost:3002/api/spaces/${spaceId}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([chatId]),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('채팅을 공간에 추가하는데 실패했습니다.');
      }
      
      toast.success('채팅이 공간에 추가되었습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
      console.error(error);
    }
  };

  const handleRemoveFromSpace = async (chatId: string, spaceId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/spaces/${spaceId}/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('채팅을 공간에서 제거하는데 실패했습니다.');
      }
      
      // 성공 시 상태 업데이트
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, space: null }  // space 정보 제거
          : chat
      ));
      
      toast.success('채팅이 공간에서 제거되었습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
      console.error(error);
    }
  };




  ////////////////////공유하기 기능////////////////////
  // 공유 모달 상태 관리를 위한 state 추가
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 복사 성공 상태 관리를 위한 state 추가 (기존 state 선언부 근처에 추가)
  const [copySuccess, setCopySuccess] = useState(false);

  // 공유 모달 열기 함수
  const openShareModal = (chatId: string) => {
    setShareModal({ open: true, chatId });
  };

  // 공유 모달 닫기 함수
  const closeShareModal = () => {
    setShareModal({ open: false, chatId: null });
  };

  // 링크 복사 함수 수정
  const copyLink = async (chatId: string) => {
    const link = `${window.location.origin}/c/${chatId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      // 2초 후에 성공 표시 숨기기
      setTimeout(() => {
        setCopySuccess(false);
        closeShareModal();
      }, 2000);
    } catch (err) {
      console.error('링크 복사 실패:', err);
      alert('링크 복사에 실패했습니다.');
    }
  };



  ////////////////////기타 기능////////////////////

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
      transition-all duration-300 z-10 ${
        isSidebarOpen 
          ? 'left-64 lg:pl-[60px]' 
          : 'left-24 lg:pl-[40px]'
      }`}>
        
      <div className="flex items-center gap-6">
      {/* 날짜와 사용자 정보를 하나의 그룹으로 묶음 */}
      <div className="flex items-center gap-4">
        {chat?.user && (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {chat.user.name}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <p className="text-sm font-medium">{formatDateTime(messagesCreatedAt.toString())}</p>
        </div>
      </div>
    </div>
      {/* <p className="text-sm font-semibold truncate w-1/2 text-center">{title}</p> */}
       {/* 채팅 제목 영역 수정 */}
       
        {isEditing ? (
          <div className="flex-1 flex justify-center max-w-[200px]">
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateTitle();
                } else if (e.key === 'Escape') {
                  cancelEditing();
                }
              }}
              onBlur={cancelEditing}
              className="px-2 py-1 text-sm bg-white dark:bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-center"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 max-w-[200px]">
            <div 
              className="flex items-center gap-2 group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1 rounded-md"
              onClick={startEditing}
            >
              <p className="text-sm font-semibold truncate">{title}</p>
            </div>
            {chat?.space ? (
              <Link 
              href={`/space/${chat.space.id}`}
              className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                <Archive className="h-3 w-3" />
                <span className="text-sm">{chat.space.spaceName}</span>
              </Link>
            ) : (
              <button
                onClick={() => openSpaceSelectionModal(chatId)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 py-1 rounded-md transition-colors"
              >
                <span>/   +  공간</span>
              </button>
            )}
          </div>
        )}


      <div className="flex flex-row items-center">
        <button 
          className="p-2.5 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
          onClick={() => openShareModal(chatId)}
        >
          <Share className="h-5 w-5" />
        </button>
        <button 
        className="p-2.5 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200  text-red-500"
        onClick={() => openDeleteConfirmModal(chatId)}
        >
          <Trash2 className="h-5 w-5" />
        </button>
        {/* <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} /> */}

        {/* ------------ 채팅 삭제 확인 모달 ------------ */}
        <Modal isOpen={deleteConfirmModal.open} onClose={closeDeleteConfirmModal}>
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
        </Modal>  
      
        {/* 공간 선택 모달 */}
        <Modal isOpen={showSpaceModal.open} onClose={closeSpaceSelectionModal}>
          <div className="bg-white dark:bg-dark-primary p-4 rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">공간 선택</h2>
              <button
                onClick={closeSpaceSelectionModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SpaceSelectionModal
              onClose={closeSpaceSelectionModal}
              chatId={showSpaceModal.chatId ?? ''}
              onSelect={async (spaceId, chatId) => {
                await addChatToSpace(spaceId, chatId);
                closeSpaceSelectionModal();
              }}
            />
          </div>
        </Modal>

      {/* ------------ 공유하기 모달 ------------ */}
      <Modal isOpen={shareModal.open} onClose={closeShareModal}>
          <div className="bg-white dark:bg-dark-primary p-4 rounded-lg shadow-lg w-full max-w-sm">
            {/* 모달 제목 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">채팅 공개 링크</h2>
              <button
                onClick={closeShareModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* 링크 표시 및 복사 영역 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-sm truncate">
                {`${window.location.origin}/c/${shareModal.chatId}`}
              </div>
              <button
                onClick={() => shareModal.chatId && copyLink(shareModal.chatId)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  copySuccess 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {copySuccess ? (
                  <span className="flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </span>
                ) : (
                  '복사'
                )}
              </button>
            </div>
            
            {/* 안내 문구 */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              이 링크를 가진 모든 사람이 채팅에 접근할 수 있습니다.
            </p>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default Navbar;