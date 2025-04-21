import { Clock, Pencil, Share, Trash2, X, User, Archive, Ellipsis, EllipsisVertical, Plus } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';
import { useUI } from '@/contexts/UIContext';

import { useRouter } from 'next/navigation';  // 이 import 추가
import { toast } from 'sonner';
import { SpaceSelectionModal } from './SpaceSelectionModal';
import Link from 'next/link';

import Modal from '@/components/ui/navmodal';

import Button  from '@/components/ui/button/Button';
import { Dropdown } from './ui/dropdown/Dropdown';
import { DropdownItem } from './ui/dropdown/DropdownItem';

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

  ////////////////////(0) 변수 정리////////////////////
  const [title, setTitle] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('');
  // 채팅 상태관리
  const [chat, setChat] = useState<Chat | null>(null);
  
  // 채팅 목록
  //const [chats, setChats] = useState<Chat[]>([]);
  //const [loading, setLoading] = useState(false);

  // 채팅 삭제 확인 모달
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 채팅 이름 수정
  const [editingChatName, setEditingChatName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);

  // 채팅 이름 수정을 위한 state 추가
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  // 공간 관련 상태
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceLoading, setSpaceLoading] = useState(true);

  // 공간 선택 모달
  const [showSpaceModal, setShowSpaceModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 공유 모달 상태 관리를 위한 state 추가
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 복사 성공 상태 관리를 위한 state 추가 (기존 state 선언부 근처에 추가)
  const [copySuccess, setCopySuccess] = useState(false);
  
  
  const router = useRouter();  // useRouter 초기화

  // 상태 추가
  const [isOpen, setIsOpen] = useState(false);

  // 드롭다운 제어 함수들
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  ////////////////////(1) 채팅 관련 함수////////////////////
  // 채팅 정보 가져오기
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
    } finally {
      //setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatInfo();
  }, [chatId]);

  // 채팅 제목 가져오기
  useEffect(() => {
    if (messages.length > 0 && !chat?.title) {  // chat.title이 없을 때만 messages[0]로 설정
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
    }
  }, [messages, chat?.title]);

  // 채팅 생성 시간 가져오기
  // console.log('[DEBUG] messages:', messages);
  const messagesCreatedAt = messages[0]?.createdAt || (messages[0] as any)?.metadata?.createdAt;


  ////////////////////(2) 채팅 삭제 관련 함수////////////////////
  const openDeleteConfirmModal = (chatId: string) => {
    setDeleteConfirmModal({ open: true, chatId });
    // closeActionModal();
  };

  const closeDeleteConfirmModal = () => {
    setDeleteConfirmModal({ open: false, chatId: null });
  };

  const deleteChat = async () => {
    if (!deleteConfirmModal.chatId) return;
    try {
      const res = await fetch(
        `http://localhost:3002/api/chats/${deleteConfirmModal.chatId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) throw new Error('Failed to delete chat');

      // 성공 후 state에서 해당 항목 제거
      // setChats((prev) => prev.filter((chat) => chat.id !== deleteConfirmModal.chatId));
      toast.success('채팅이 삭제되었습니다.');  
      closeDeleteConfirmModal();
      // 삭제 후 홈페이지로 리다이렉트
      router.push('/');
      // window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('채팅 삭제에 실패했습니다.');
    }
  };



  ////////////////////(3) 채팅 제목 수정(PUT) 관련 함수////////////////////

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
      toast.success('채팅 이름이 수정되었습니다.');

      cancelEditing();

      // 페이지 새로고침
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      toast.error('채팅 이름 수정에 실패했습니다.');
    }
  };

  ////////////////////공간 액션 메뉴 관련 기능(채팅 공간에 저장, 채팅 공간에 제거)////////////////////
  const openSpaceSelectionModal = (chatId: string) => {
    setShowSpaceModal({ open: true, chatId });
    //closeActionModal();
  };

  const closeSpaceSelectionModal = () => {
    setShowSpaceModal({ open: false, chatId: null });
  };

  // Space 목록 조회 함수
  const fetchSpaces = async () => {
    const userId = 'user-1234'; // 현재 고정값으로 사용 중
    try {
      setSpaceLoading(true);
      const res = await fetch(`http://localhost:3002/api/users/${userId}/spaces`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`API 요청 실패: ${res.status}`);
      }

      const data = await res.json();
      const spaceUserList = data.spaceUserList || [];
      const spaces = spaceUserList.map((item: { space: Space }) => item.space);
      setSpaces(spaces);
    } catch (error) {
      console.error('[ERROR] 공간 목록 조회 중 오류 발생:', error);
      setSpaces([]);
    } finally {
      setSpaceLoading(false);
    }
  };

  // showSpaceModal이 열릴 때 spaces 목록 조회
  useEffect(() => {
    if (showSpaceModal.open) {
      fetchSpaces();
    }
  }, [showSpaceModal.open]);

  // 채팅을 공간에 추가하는 함수 수정
  const addChatToSpace = async (spaceId: string, chatId: string) => {
    try {
      console.log('[addChatToSpace] spaceId:', spaceId)
      console.log('[addChatToSpace] chatId:', chatId)
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

      // 성공 후 채팅 목록 새로고침
      await fetchChatInfo();
      
      toast.success('채팅이 공간에 추가되었습니다.');
      closeSpaceSelectionModal();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
      console.error(error);
    }
  };




  ////////////////////(6) 공유하기 함수////////////////////
  // 공유 모달 열기 함수
  const openShareModal = (chatId: string) => {
    setShareModal({ open: true, chatId });
    // closeActionModal();
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
      toast.error('링크 복사에 실패했습니다.');
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
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800">
      <div className="fixed top-0 right-0 px-2 lg:pr-[30px] flex flex-row items-center justify-between py-3
        text-sm text-gray-800 dark:text-white/90 border-b border-gray-200 dark:border-gray-800 bg-white 
        dark:bg-gray-900 backdrop-blur-md transition-all duration-300 z-99999 left-0 lg:left-64 lg:pl-[30px]">
        
        {/* 왼쪽 섹션 - 시계 */}
        <div className="flex-1 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-2 rounded-lg  bg-white px-2.5 py-2.5 
              text-theme-sm font-medium text-gray-700  dark:border-gray-700 
              dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
               <Clock className="h-4 w-4" />
               <p>{formatDateTime(messagesCreatedAt.toString())}</p>
            </div>
          </div>
        </div>

        {/* 중앙 섹션 - 제목과 스페이스 */}
        <div className="flex-1 flex items-center justify-center">
          {isEditing ? (
            <div className="flex justify-center max-w-[200px]">
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
                className="px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-3 focus:ring-brand-500/10 w-full text-center text-gray-800 dark:text-white/90"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 
                text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 
                dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                onClick={startEditing}
              >
                <p className="text-sm font-medium text-brand-500 dark:text-white/90 truncate">{title}</p>
              </button>
              {chat?.space ? (
                <Link 
                  href={`/space/${chat.space.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 
                  text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 
                  dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <Archive className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-400">{chat.space.spaceName}</span>
                </Link>
              ) : (
                <button
                  onClick={() => openSpaceSelectionModal(chatId)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 
                  text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 
                  dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <Plus className="h-4 w-4" />
                  <span> Space</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽 섹션 - 드롭다운 메뉴 */}
        <div className="flex-1 flex items-center justify-end gap-3">
          
          <div className="relative">
            <button 
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3
              text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 
              dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              onClick={toggleDropdown}
            >
              <EllipsisVertical className="h-4 w-4"/>
            </button>
            
            {isOpen && (
              <Dropdown
                isOpen={true}
                onClose={closeDropdown}
                className="absolute right-0 top-full mt-1 w-48 p-2 z-50"
              >
                <DropdownItem
                onClick={() => {
                  startEditing();
                  closeDropdown();
                }}
                className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                <Pencil className="h-4 w-4" />
                이름 바꾸기
              </DropdownItem>

                <DropdownItem
                  onItemClick={() => {
                    openDeleteConfirmModal(chatId);
                    closeDropdown();
                  }}
                  className="flex w-full items-center gap-3 px-2 py-2 text-sm text-red-600 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-red-500 dark:hover:bg-white/5 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </DropdownItem>
              </Dropdown>
            )}
          </div>

          <button 
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 
            text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 
            dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            onClick={() => {
              openShareModal(chatId);
            }}
          >
            <Share className="h-4 w-4" />
            <span>공유하기</span>
          </button>
        </div>

        {/* ------------ 채팅 삭제 확인 모달 ------------ */}
        {deleteConfirmModal.open && (
          <Modal isOpen={deleteConfirmModal.open} onClose={closeDeleteConfirmModal} className="max-w-[700px] m-4">
            <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
              <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  채팅 삭제
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  이 행동으로 채팅이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              
              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={closeDeleteConfirmModal}
                >
                  취소
                </Button>
                <Button 
                  size="sm"
                  className="!bg-red-500 hover:!bg-red-600 text-white"
                  onClick={deleteChat}
                >
                  삭제
                </Button>
              </div>
            </div>
          </Modal>
        )}
      
        {/* ------------ 공간 저장 선택 모달 ------------ */}
        {showSpaceModal.open && (
            <Modal 
              isOpen={showSpaceModal.open} 
              onClose={closeSpaceSelectionModal} 
              className="max-w-[540px] m-4"
            >
              <div className="relative w-full p-6 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900">
                <div className="mb-6">
                  <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                    스페이스 선택
                  </h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    채팅을 추가할 스페이스를 선택해주세요.
                  </p>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {spaceLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                    </div>
                  ) : spaces.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      사용 가능한 공간이 없습니다.
                    </div>
                  ) : (
                    spaces.map((space) => (
                      <button
                        key={space.id}
                        onClick={() => {
                          if (showSpaceModal.chatId) {
                            addChatToSpace(space.id, showSpaceModal.chatId);
                          }
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {space.spaceName}
                        </div>
                        {space.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {space.description}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeSpaceSelectionModal}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </Modal>
          )}

        {/* ------------ 공유하기 모달 ------------ */}
        {shareModal.open && (
          <Modal isOpen={shareModal.open} onClose={closeShareModal} className="max-w-[700px] m-4">
            <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
              <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  채팅 공개 링크
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  이 링크를 가진 모든 사람이 채팅에 접근할 수 있습니다.
                </p>
              </div>
              
              <div className="px-2">
                <div className="flex items-center gap-3 mb-6">
                  <input
                    type="text"
                    value={`${window.location.origin}/c/${shareModal.chatId}`}
                    readOnly
                    className="flex-1 h-11 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-800 dark:text-white/90"
                  />
                  <Button
                    size="sm"
                    onClick={() => shareModal.chatId && copyLink(shareModal.chatId)}
                    className={`min-w-[80px] ${
                      copySuccess 
                        ? '!bg-green-500 hover:!bg-green-600' 
                        : '!bg-brand-500 hover:!bg-brand-600'
                    }`}
                  >
                    {copySuccess ? (
                      <span className="flex items-center justify-center">
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
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
};

export default Navbar;