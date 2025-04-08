'use client';

import DeleteChat from '@/components/DeleteChat';
import { cn, formatTimeDifference } from '@/lib/utils';
import { BookOpenText, 
  ClockIcon, 
  Ellipsis, 
  SquarePen, 
  Menu,
  Share, // 공유 아이콘
  Pencil, // 편집 아이콘
  Archive, // 보관함 아이콘
  Trash2, // 삭제 아이콘 
  X
  } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SpaceSelectionModal } from '@/components/SpaceSelectionModal';
import { toast } from 'sonner';

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

const Page = () => {
  
  const [loading, setLoading] = useState(true);

  ////////////////////채팅 목록 관련 기능////////////////////
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // useEffect(() => {
  //   const fetchChats = async () => {
  //     setLoading(true);
  //     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //     });
  //     const data = await res.json();
  //     setChats(data.chats);
  //     setLoading(false);
  //   };
  //   fetchChats();
  // }, []);
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true); // 로딩 시작
        const userId = 'user-1234'; // 현재는 고정값 사용
        const res = await fetch(`http://localhost:3002/api/users/${userId}/chats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!res.ok) throw new Error('Failed to fetch chats');
        
        const data = await res.json();
        console.log('[DEBUG] 채팅 목록:', data);
        setChats(data.chatList);
      } catch (error) {
        console.error(error);
        toast.error('채팅 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false); // 로딩 종료 (성공/실패 상관없이)
      }
    };
  
    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );



  ////////////////////채팅 액션 메뉴 관련 기능////////////////////
  // Action menu
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    chatId: string | null;
    x: number;
    y: number;
  }>({ open: false, chatId: null, x: 0, y: 0 });

  // 액션 메뉴 (점 세 개) 제어
  const handleActionClick = (e: React.MouseEvent, chatId: string) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setActionModal({ open: true, chatId, x: rect.right, y: rect.bottom });
  };

  const closeActionModal = () => {
    setActionModal({ open: false, chatId: null, x: 0, y: 0 });
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
  


  ////////////////////채팅 삭제 관련 기능////////////////////
  // 삭제 확인 모달
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

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
    } catch (error) {
      console.error(error);
    }
  };



  ////////////////////채팅 이름 수정(PUT) 관련 기능(인라인)////////////////////
  const [editingChatName, setEditingChatName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);

  //채팅 편집모드 시작
  const startChatEdit = (chatId: string, currentChatName: string) => {
    setEditingChatId(chatId);
    setEditingChatName(currentChatName);
    closeActionModal();
  };

  //채팅 편집모드 종료
  const cancelChatEdit = () => {
    setEditingChatId(null);
    setEditingChatName('');
  };

  // 채팅 이름 업데이트 처리
  const handleUpdateChatName = async (chatId:string) => {
    try {
      const updateChatData = {
        id: chatId,
        title: editingChatName.trim(),
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
      setChats((prev) => prev.map((chat) => 
        chat.id === chatId 
          ? { ...chat, title: editingChatName.trim() }
          : chat
      ));
      cancelChatEdit();
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
      closeActionModal(); // 성공 후 모달 닫기 추가
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
      closeActionModal();
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
    closeActionModal();
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
                  {editingChatId === chat.id ? (
                    // 편집 모드일 때 입력 폼 표시
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={editingChatName}
                        onChange={(e) => setEditingChatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateChatName(chat.id);
                          } else if (e.key === 'Escape') {
                            cancelChatEdit();
                          }
                        }}
                        onBlur={() => cancelChatEdit()}
                        className="w-full px-4 py-2 text-lg font-medium bg-white dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        autoFocus
                      />
                    </div>
                  ) : (
                    // 일반 모드일 때 채팅 제목 표시
                    <Link
                      href={`/c/${chat.id}`}
                      className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-blue-500"
                    >
                      {chat.title}
                    </Link>
                  )}
                  <div className="flex items-center justify-between mt-2 text-gray-500 text-sm">
                    <div className="flex items-center space-x-2">
                      <ClockIcon size={16} />
                      <div className="p-0.5">
                        {formatDateTime(chat.createdAt?.toString() ?? '')}
                      </div>
                      {/* 공간 정보 표시 */}
                      {chat.space && (
                        <Link
                          href={`/space/${chat.space.id}`}
                         className="flex items-center space-x-1 ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                          <Archive className="h-3 w-3" />
                          <span className="text-xs">{chat.space.spaceName}</span>
                        </Link>
                      )}
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
          
          <ul className="space-y-1 text-sm">
            <li>
            <button
                className="w-full text-left px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3"
                onClick={() => openShareModal(actionModal.chatId!)}
              >
                <Share className="h-4 w-4 text-gray-500" />
                <span className="text-sm">공유하기</span>
              </button>
            </li>
            <li>
            <button
                className="w-full text-left px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3"
                onClick={() => {
                  const chat = chats.find(c => c.id === actionModal.chatId);
                  if (chat) {
                    startChatEdit(chat.id, chat.title);
                  }
                }}
              >
                <Pencil className="h-4 w-4 text-gray-500" />
                <span className="text-sm">이름 바꾸기</span>
            </button>
            </li>
            <li>
            <button
                className="w-full text-left px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3"
                onClick={() => {
                  const chat = chats.find(c => c.id === actionModal.chatId);
                  if (chat?.space) {
                    // 공간에서 제거하는 함수 호출
                    handleRemoveFromSpace(chat.id, chat.space.id);
                  } else {
                    // 공간에 추가하는 모달 표시
                    openSpaceSelectionModal(chat!.id);
                  }
                }}
              >
                <Archive className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {chats.find(c => c.id === actionModal.chatId)?.space 
                    ? '보관함에서 제거' 
                    : '보관함에 저장'}
                </span>
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-red-600"
                onClick={() => openDeleteConfirmModal(actionModal.chatId!)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
                <span className="text-sm">삭제</span>
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

      {/* ------------ 공유 모달------------ */}
      {shareModal.open && (
      <div className="fixed z-[80] inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
              className={`px-4 py-2 rounded-lg text-sm transition-colors relative ${
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
      </div>
    )}
    </div>
  );
};

export default Page;
