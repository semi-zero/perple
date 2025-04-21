'use client';

import {  
  ClockIcon, 
  Ellipsis, 
  Share, // 공유 아이콘
  Pencil, // 편집 아이콘
  Archive, // 보관함 아이콘
  Trash2, // 삭제 아이콘 
  } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import Button  from '@/components/ui/button/Button';
import CustomCard from '@/components/common/CustomCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

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

// 검색 아이콘 SVG를 별도의 컴포넌트로 분리
const SearchIcon = () => (
  <svg
    className="fill-gray-500 dark:fill-gray-400"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
    />
  </svg>
);

const Page = () => {

  ////////////////////(0) 변수 정리////////////////////
  // 채팅 목록
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 채팅 액션 모달
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // 채팅 삭제 확인 모달
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 채팅 이름 수정
  const [editingChatName, setEditingChatName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);

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
  


  ////////////////////(1) 채팅 목록 관련 함수////////////////////
  // 채팅 목록을 다시 불러오는 함수
  const fetchChats = async () => {
    try {
      setLoading(true);
      const userId = 'user-1234'; // 현재는 고정값 사용
      const res = await fetch(`http://localhost:3002/api/users/${userId}/chats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) throw new Error('Failed to fetch chats');
      
      const data = await res.json();
      console.log('[DEBUG] 채팅 목록:', data);
      setChats(data.chatList || []); // chatList가 없는 경우 빈 배열로 처리
      // 시간 역순으로 정렬
      const sortedChats = (data.chatList || []).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setChats(sortedChats);
    } catch (error) {
      console.error(error);
      toast.error('채팅 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  ////////////////////(2) 채팅 액션 메뉴 관련 함수////////////////////
  // 드롭다운 토글 함수
  const toggleDropdown = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsOpen(!isOpen);
  };

  // 드롭다운 닫기 함수
  const closeDropdown = () => {
    setIsOpen(false);
    setSelectedChatId(null);
  };

  ////////////////////(3) 채팅 삭제 관련 함수////////////////////
  const openDeleteConfirmModal = (chatId: string) => {
    setDeleteConfirmModal({ open: true, chatId });
    closeDropdown();
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
      setChats((prev) => prev.filter((chat) => chat.id !== deleteConfirmModal.chatId));
      toast.success('채팅이 삭제되었습니다.');  
      closeDeleteConfirmModal();
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('채팅 삭제에 실패했습니다.');
    }
  };

  ////////////////////(4) 채팅 이름 수정(PUT) 관련 함수////////////////////
  //채팅 편집모드 시작
  const startChatEdit = (chatId: string, currentChatName: string) => {
    setEditingChatId(chatId);
    setEditingChatName(currentChatName);
    closeDropdown();
  };

  //채팅 편집모드 종료
  const cancelChatEdit = () => {
    setEditingChatId(null);
    setEditingChatName('');
  };

  // 채팅 이름 업데이트 처리
  const handleUpdateChatName = async (chatId: string) => {
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
      if (!res.ok) throw new Error('채팅 이름 수정에 실패했습니다.');

      // 성공 시 상태 업데이트
      setChats((prev) => prev.map((chat) => 
        chat.id === chatId 
          ? { ...chat, title: editingChatName.trim() }
          : chat
      ));
      
      toast.success('채팅 이름이 수정되었습니다.');
      cancelChatEdit();
      
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('[ERROR] 채팅 이름 수정 중 오류:', error);
      toast.error('채팅 이름 수정에 실패했습니다.');
    }
  };
  
  
  
  
  ////////////////////(5) 공간 액션 메뉴 관련 함수(채팅 공간에 저장, 채팅 공간에 제거)////////////////////
  const openSpaceSelectionModal = (chatId: string) => {
    setShowSpaceModal({ open: true, chatId });
    closeDropdown();
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
      await fetchChats();
      
      toast.success('채팅이 공간에 추가되었습니다.');
      closeSpaceSelectionModal();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
      console.error(error);
    }
  };

  // 채팅을 공간에서 제거하는 함수도 같은 방식으로 수정
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
      
      // 성공 후 채팅 목록 새로고침
      await fetchChats();
      
      toast.success('채팅이 공간에서 제거되었습니다.');
      closeDropdown();
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
    closeDropdown();
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


  ////////////////////(7) 기타 함수////////////////////
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
    <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
      <div className="mt-2">
        <PageBreadcrumb pageTitle="Library"/>
        <div className="space-y-5 sm:space-y-6">
          <CustomCard 
            className="min-h-screen">
            <div className="flex items-center justify-between">
              {/* 왼쪽 설명 텍스트 */}
              <div className="text-sm text-gray-600 dark:text-white/70">
                원하는 채팅을 검색해보세요.
              </div>

              {/* 오른쪽 검색창 */}
              <div className="relative ml-auto">
                <Input
                  type="text"
                  placeholder="채팅 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<SearchIcon />}
                  className="xl:w-[430px]"
                />
              </div>
            </div>

              {/* 채팅 리스트 */}
              <div className="flex-grow">
                
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500"></div>
                  </div>
                ) : (
                  // ... existing code ...
                  <div className="space-y-6 mt-4">
                    {filteredChats.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400"></p>
                    ) : (
                      filteredChats.map((chat) => (
                        <div
                          key={chat.id}
                          className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 hover:shadow-theme-xs"
                        >
                          <div className="flex flex-col gap-4">
                            {editingChatId === chat.id ? (
                              <div className="flex-grow">
                                <Input
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
                                  className="text-lg font-semibold"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <Link
                                href={`/c/${chat.id}`}
                                className="text-lg font-semibold text-gray-800 dark:text-white/90 hover:text-brand-500"
                              >
                                {chat.title}
                              </Link>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <ClockIcon size={16} />
                                  <span>{formatDateTime(chat.createdAt?.toString() ?? '')}</span>
                                </div>
                                {chat.space && (
                                  <>
                                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                    <Link
                                      href={`/space/${chat.space.id}`}
                                      className="flex items-center gap-2 hover:text-gray-800 dark:hover:text-gray-200"
                                    >
                                      <Archive className="h-4 w-4" />
                                      <span>{chat.space.spaceName}</span>
                                    </Link>
                                  </>
                                )}
                              </div>
                              <div className="relative">
                                <button
                                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                                  onClick={() => toggleDropdown(chat.id)}
                                >
                                  <Ellipsis className="h-5 w-5"/>
                                </button>
                                
                                {/* 드롭다운 메뉴 */}
                                {isOpen && selectedChatId === chat.id && (
                                  <Dropdown
                                    isOpen={true}
                                    onClose={closeDropdown}
                                    className="absolute left-0 mt-2 w-48 p-2 z-50"
                                  >
                                    <DropdownItem
                                      onItemClick={() => {
                                        openShareModal(selectedChatId!);
                                        closeDropdown();
                                      }}
                                      className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                    >
                                      <Share className="h-4 w-4" />
                                      공유하기
                                    </DropdownItem>

                                    <DropdownItem
                                      onItemClick={() => {
                                        const chat = chats.find(c => c.id === selectedChatId);
                                        if (chat) {
                                          startChatEdit(chat.id, chat.title);
                                        }
                                        closeDropdown();
                                      }}
                                      className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      이름 바꾸기
                                    </DropdownItem>

                                    <DropdownItem
                                      onItemClick={() => {
                                        const chat = chats.find(c => c.id === selectedChatId);
                                        if (chat?.space) {
                                          handleRemoveFromSpace(chat.id, chat.space.id);
                                        } else if (chat) {
                                          openSpaceSelectionModal(chat.id);
                                        }
                                        closeDropdown();
                                      }}
                                      className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                    >
                                      <Archive className="h-4 w-4" />
                                      {chats.find(c => c.id === selectedChatId)?.space 
                                        ? '보관함에서 제거' 
                                        : '보관함에 저장'}
                                    </DropdownItem>

                                    <DropdownItem
                                      onItemClick={() => {
                                        if (selectedChatId) {
                                          openDeleteConfirmModal(selectedChatId);
                                        }
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
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  



                )}
                
              </div>

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

              {/* ------------ 공유 모달------------ */}
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
            {/* </div> */}
          </CustomCard>
        </div>
      </div>
    </div>
  );
};

export default Page;
