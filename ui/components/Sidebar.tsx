'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Home, 
  FolderKanban, 
  Ellipsis, 
  CircleUserRound ,
  Share, // 공유 아이콘
  Pencil, // 편집 아이콘
  Archive, // 보관함 아이콘
  Trash2, // 삭제 아이콘
  ChevronDown, // 추가
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Layout from './Layout';

import { Modal } from '@/components/ui/modal';
import Button  from '@/components/ui/button/Button';
import Input from './form/input/InputField';
import { toast } from 'sonner';
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Shield } from 'lucide-react';

interface ExtraMessage {
	field1?: string | null;
    field2?: string | null;
    field3?: string | null;
}

interface FileEntity {
	name?: string | null;
    fileId?: string | null;
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
  spaceId?: string;
  userId: string;
  isDeleted?: boolean;
  space?: Space;
}

interface Space {
	id: string;
    spaceName: string;
    description? : string | null;
    createdAt?: Date | null;
    createdBy?: string;
    updatedAt?: Date | null;
    updatedBy?: string;
    isDeleted?: boolean;
}

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();


  ///////////////////(0) 변수 정리////////////////////
  // 채팅 목록
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  // 채팅 액션 모달
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    chatId: string | null;
    x: number;
    y: number;
  }>({ open: false, chatId: null, x: 0, y: 0 });

  // 채팅 삭제 확인 모달
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 채팅 이름 수정
  const [editingChatName, setEditingChatName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);

  //설정 모달
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 공간 목록
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceLoading, setSpaceLoading] = useState(true);

   // 공간 액션 모달
  const [spaceActionModal, setSpaceActionModal] = useState<{
    open: boolean;
    spaceId: string | null;
    x: number;
    y: number;
  }>({ open: false, spaceId: null, x: 0, y: 0 });

  // 공간 삭제 확인 모달
  const [deleteSpaceConfirmModal, setDeleteSpaceConfirmModal] = useState<{
    open: boolean;
    spaceId: string | null;
  }>({ open: false, spaceId: null });

  // 공간 이름 수정
  const [editingSpaceName, setEditingSpaceName] = useState('');
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);

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

  // 공간 목록과 채팅 목록의 열림/닫힘 상태 관리 (기본값: true - 열린 상태)
  const [isSpaceListOpen, setIsSpaceListOpen] = useState(true);
  const [isChatListOpen, setIsChatListOpen] = useState(true);

  // active 상태 체크 함수
  const isActive = (path: string) => {
    // 정확한 경로 매칭
    if (pathname === path) return true;
    
    // 하위 경로 매칭 체크
    if (path === '/spaceMain') {
      // /space/로 시작하는 모든 경로에서 Space 메뉴 활성화
      return pathname.startsWith('/space/');
    }
    
    if (path === '/library') {
      // /c/로 시작하는 모든 경로에서 Library 메뉴 활성화
      return pathname.startsWith('/c/');
    }
    
    return false;
  };

  ////////////////////(1) 채팅 목록 관련 함수////////////////////
  // 채팅 목록을 다시 불러오는 함수
  const fetchChats = async () => {
    try {
      const userId = 'user-1234'; // 현재는 고정값 사용
      const res = await fetch(`http://localhost:3002/api/users/${userId}/chats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) throw new Error('채팅 목록을 불러오는데 실패했습니다');
      
      const data = await res.json();
      // console.log('[DEBUG] 채팅 목록:', data);
      setChats(data.chatList || []); // chatList가 없는 경우 빈 배열로 처리
      // 시간 역순으로 정렬
      const sortedChats = (data.chatList || []).sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setChats(sortedChats);
    } catch (error) {
      console.error(error);
      toast.error('채팅 목록을 불러오는데 실패했습니다.');
    }
  };

  // 초기 useEffect도 fetchChats 함수 사용하도록 수정
  useEffect(() => {
    fetchChats();
  }, [pathname]);

  // useEffect(() => {
  //   fetchChats();
  // }, [chats]);

  ////////////////////(2) 채팅 액션 메뉴 관련 함수////////////////////
   // 액션 메뉴 (점 세 개) 제어
   const handleActionClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setActionModal({ 
      open: true, 
      chatId, 
      x: rect.right, // 버튼의 왼쪽 위치
      y: rect.bottom // 버튼의 아래쪽 위치 + 스크롤 위치
    });
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





  ////////////////////(3) 채팅 삭제 관련 함수////////////////////
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
      toast.success('채팅이 삭제되었습니다.');
      // 삭제 후 홈페이지로 리다이렉트
      router.push('/');
    } catch (error) {
      console.error(error);
      toast.error('채팅 삭제에 실패했습니다.');
    }
  };



  ////////////////////(4) 채팅 이름 수정(PUT) 관련 함수(인라인)////////////////////

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



  ////////////////////(5) 설정 메뉴 관련 함수////////////////////
  // 바깥 클릭 시 설정 메뉴 닫기
  useEffect(() => {
    const handleClickSettingDialogOutside = () => {
      if (isSettingsOpen) setIsSettingsOpen(false);
    };
    document.addEventListener('click', handleClickSettingDialogOutside);
    return () => {
      document.removeEventListener('click', handleClickSettingDialogOutside);
    };
  }, [isSettingsOpen]);



  ////////////////////(6) 공간 목록(GET) 관련 함수////////////////////
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
      console.log('[DEBUG] 공간 목록:', data);
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

  useEffect(() => {
    fetchSpaces();
  }, []);

  // useEffect(() => {
  //   fetchSpaces();
  // }, [spaces]);
  // showSpaceModal이 열릴 때 spaces 목록 조회
  useEffect(() => {
    if (showSpaceModal.open) {
      fetchSpaces();
    }
  }, [showSpaceModal.open]);



  ////////////////////(7) 공간 액션 메뉴 관련 함수////////////////////
  // 액션 메뉴 (점 세 개) 제어
  const handleSpaceActionClick = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setSpaceActionModal({ 
      open: true, 
      spaceId, 
      x: rect.right, // 버튼의 오른쪽 위치
      y: rect.bottom + window.scrollY // 버튼의 아래쪽 위치 + 스크롤 위치
    });
  };

  //공간 액션 모달 닫기
  const closeSpaceActionModal = () => {
    setSpaceActionModal({ open: false, spaceId: null, x: 0, y: 0 });
  };

  // 바깥 클릭 시 액션 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (spaceActionModal.open) closeSpaceActionModal();
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [spaceActionModal.open]);


  ////////////////////(8) 공간 삭제(DELETE) 관련 함수////////////////////

  //삭제 확인 모달 열기
  const openDeleteSpaceConfirmModal = (spaceId: string) => {
    setDeleteSpaceConfirmModal({ open: true, spaceId });
    closeSpaceActionModal();
  };
  // 삭제 확인 모달 닫기  
  const closeDeleteSpaceConfirmModal = () => {
    setDeleteSpaceConfirmModal({ open: false, spaceId: null });
  };

  const deleteSpace = async () => {
    if (!deleteSpaceConfirmModal.spaceId) return;
    try {
      const res = await fetch(
        `http://localhost:3002/api/spaces/${deleteSpaceConfirmModal.spaceId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) throw new Error('Failed to delete chat');

      // 성공 후 state에서 해당 항목 제거
      setSpaces((prev) => prev.filter((space) => space.id !== deleteSpaceConfirmModal.spaceId));
      closeDeleteSpaceConfirmModal();
      toast.success('공간이 삭제되었습니다.');
      // 삭제 후 홈페이지로 리다이렉트
      router.push('/');
    } catch (error) {
      console.error(error);
      toast.error('공간 삭제에 실패했습니다.');
    }
  };
  
  ////////////////////(9) 공간 이름 수정(PUT) 관련 함수(인라인)////////////////////
  //편집모드 시작
  const startSpaceEdit = (spaceId: string, currentSpaceName: string) => {
    setEditingSpaceId(spaceId);
    setEditingSpaceName(currentSpaceName);
    closeSpaceActionModal();
  };

  //편집모드 종료
  const cancelSpaceEdit = () => {
    setEditingSpaceId(null);
    setEditingSpaceName('');
  };

  // 공간 이름 업데이트 처리
  const handleUpdateSpaceName = async (spaceId: string) => {
    try {
      const updateSpaceData = {
        id: spaceId,
        userId: 'user-1234',
        spaceName: editingSpaceName.trim(),
        isDeleted: false
      };

      const res = await fetch(
        `http://localhost:3002/api/spaces`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateSpaceData),
        }
      );
      if (!res.ok) throw new Error('공간 이름 수정에 실패했습니다.');

      // 성공 시 상태 업데이트
      setSpaces((prev) => prev.map((space) => 
        space.id === spaceId 
          ? { ...space, spaceName: editingSpaceName.trim() }
          : space
      ));
      
      toast.success('공간 이름이 수정되었습니다.');
      cancelSpaceEdit();
      
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('[ERROR] 공간 이름 수정 중 오류:', error);
      toast.error('공간 이름 수정에 실패했습니다.');
    }
  };



  ////////////////////(10) 공간 액션 메뉴 관련 함수(채팅 공간에 저장, 채팅 공간에 제거)////////////////////
  const openSpaceSelectionModal = (chatId: string) => {
    setShowSpaceModal({ open: true, chatId });
    closeActionModal();
  };

  const closeSpaceSelectionModal = () => {
    setShowSpaceModal({ open: false, chatId: null });
  };

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

  // 채팅을 공간에서 제거하는 함수 수정
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
      closeActionModal(); 
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
      console.error(error);
    }
  };


  
  ////////////////////(11) 공유하기 함수////////////////////
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
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  return (
    <div className="lg:flex">
      {/* 사이드바 영역 */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col bg-white dark:bg-dark-primary px-5 py-3 
      border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto transition-all duration-300 w-64">
        <div className="flex flex-col h-full">
          {/* 로고 영역 추가 */}
          <div className="py-4 flex items-center justify-start">
            <h1 className="text-2xl font-semibold text-brand-500 dark:text-white">
            <Link href="/">
              BADA AI Chat
              </Link>
            </h1>
          </div>

          {/* 메뉴 섹션 */}
          <nav className="flex-grow">
            <div className="space-y-6">
              {/* 홈 메뉴 */}
              <div>
                <h2 className="mb-4 text-xs uppercase text-gray-400">MENU</h2>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/" 
                      className={`menu-item group ${
                        isActive('/') ? 'menu-item-active' : 'menu-item-inactive'
                      }`}
                    >
                      <Home className={`h-5 w-5 ${
                        isActive('/') ? 'text-brand-500' : 'text-gray-500 group-hover:text-brand-500'
                      }`} />
                      <span className={`text-sm ${
                        isActive('/') ? 'text-brand-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-brand-500'
                      }`}>Home</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile">
                      <button className={`menu-item group w-full ${
                        isActive('/profile') ? 'menu-item-active' : 'menu-item-inactive'
                      }`}>
                        <CircleUserRound className={`h-5 w-5 ${
                          isActive('/profile') ? 'text-brand-500' : 'text-gray-500 group-hover:text-brand-500'
                        }`} />
                        <span className={`text-sm ${
                          isActive('/profile') ? 'text-brand-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-brand-500'
                        }`}>Profile</span>
                      </button>
                    </Link>
                  </li>

                  <li>
                    {/* 공간 메뉴와 목록 */}
                    <div>
                      <div className={`menu-item group justify-between ${
                        isActive('/spaceMain') ? 'menu-item-active' : 'menu-item-inactive'
                      }`}>
                        <Link href="/spaceMain" className="flex items-center gap-3">
                          <FolderKanban className={`h-5 w-5 ${
                            isActive('/spaceMain') ? 'text-brand-500' : 'text-gray-500 group-hover:text-brand-500'
                          }`} />
                          <span className={`text-sm ${
                            isActive('/spaceMain') ? 'text-brand-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-brand-500'
                          }`}>Space</span>
                        </Link>
                        <button
                          onClick={() => setIsSpaceListOpen(!isSpaceListOpen)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <ChevronDown className={`h-4 w-4 ${
                            isActive('/spaceMain') ? 'text-brand-500' : 'text-gray-500'
                          } transition-transform duration-200 ${
                            isSpaceListOpen ? 'rotate-180' : ''
                          }`} />
                        </button>
                      </div>
                      {isSpaceListOpen && (
                        <ul className="mt-2 space-y-1 ml-9">
                          {spaces.slice(0, 5).map((space) => (
                            <li key={space.id}>
                              <div className={`menu-item group relative py-1.5 ${
                                editingSpaceId === space.id 
                                  ? 'menu-item-inactive' 
                                  : isActive(`/space/${space.id}`) 
                                    ? 'menu-item-active' 
                                    : 'menu-item-inactive'
                              }`}>
                                {editingSpaceId === space.id ? (
                                  <Input
                                    type="text"
                                    value={editingSpaceName}
                                    onChange={(e) => setEditingSpaceName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleUpdateSpaceName(space.id);
                                      } else if (e.key === 'Escape') {
                                        cancelSpaceEdit();
                                      }
                                    }}
                                    onBlur={() => cancelSpaceEdit()}
                                    className="text-sm"
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <Link href={`/space/${space.id}`} className="flex-grow">
                                      <span className={`text-sm ${
                                        isActive(`/space/${space.id}`)
                                          ? 'text-brand-500'
                                          : 'text-gray-600 dark:text-gray-300 group-hover:text-brand-500'
                                      }`}>
                                        {space.spaceName}
                                      </span>
                                    </Link>
                                    <button
                                      className="absolute right-2 opacity-0 group-hover:opacity-100"
                                      onClick={(e) => handleSpaceActionClick(e, space.id)}
                                    >
                                      <Ellipsis className="h-4 w-4 text-gray-400" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                  <li>
                    {/* 도서관 메뉴와 채팅 목록 */}
                    <div>
                      <div className={`menu-item group justify-between ${
                        isActive('/library') ? 'menu-item-active' : 'menu-item-inactive'
                      }`}>
                        <Link href="/library" className="flex items-center gap-3">
                          <BookOpen className={`h-5 w-5 ${
                            isActive('/library') ? 'text-brand-500' : 'text-gray-500 group-hover:text-brand-500'
                          }`} />
                          <span className={`text-sm ${
                            isActive('/library') ? 'text-brand-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-brand-500'
                          }`}>Library</span>
                        </Link>
                        <button
                          onClick={() => setIsChatListOpen(!isChatListOpen)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <ChevronDown className={`h-4 w-4 ${
                            isActive('/library') ? 'text-brand-500' : 'text-gray-500'
                          } transition-transform duration-200 ${
                            isChatListOpen ? 'rotate-180' : ''
                          }`} />
                        </button>
                      </div>
                      {isChatListOpen && (
                        <ul className="mt-2 space-y-1 ml-9">
                          {chats.slice(0, 5).map((chat) => (
                            <li key={chat.id}>
                              <div className={`menu-item group relative py-1.5 ${
                                isActive(`/c/${chat.id}`) ? 'menu-item-active' : 'menu-item-inactive'
                              }`}>
                                {editingChatId === chat.id ? (
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
                                ) : (
                                  <>
                                    <Link href={`/c/${chat.id}`} className="flex-grow">
                                      <span className={`text-sm ${
                                        isActive(`/c/${chat.id}`)
                                          ? 'text-brand-500'
                                          : 'text-gray-600 dark:text-gray-300 group-hover:text-brand-500'
                                      }`}>
                                        {chat.title}
                                      </span>
                                    </Link>
                                    <button
                                      className="absolute right-2 opacity-0 group-hover:opacity-100"
                                      onClick={(e) => handleActionClick(e, chat.id)}
                                    >
                                      <Ellipsis className="h-4 w-4 text-gray-400" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                </ul>
              </div>

              
            </div>

            
          </nav>

           {/* 아래 고정 Admin 메뉴 */}
            <div className="mt-6">
              <ul className="space-y-2 border-t pt-4">
                <li>
                  <Link 
                    href="/admin" 
                    className={`menu-item group ${
                      isActive('/admin') ? 'menu-item-active' : 'menu-item-inactive'
                    }`}
                  >
                    <Shield className={`h-5 w-5 ${
                      isActive('/admin') ? 'text-brand-500' : 'text-gray-500 group-hover:text-brand-500'
                    }`} />
                    <span className={`text-sm ${
                      isActive('/admin') ? 'text-brand-500' : 'text-gray-700 dark:text-gray-200 group-hover:text-brand-500'
                    }`}>Admin</span>
                  </Link>
                </li>
              </ul>
            </div>

        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="lg:pl-64 w-full">
        <Layout>{children}</Layout>
      </div>

      {/* ------------ 채팅 액션 모달 (점 세개) ------------ */}
      {actionModal.open && (
        <div 
          className="fixed z-[60]"
          style={{
            top: `${actionModal.y}px`,
            left: `${actionModal.x}px`,
          }}
        >
          <Dropdown
            isOpen={true}
            onClose={closeActionModal}
            className="w-48 p-2"
          >
            <DropdownItem
              onItemClick={() => {
                openShareModal(actionModal.chatId!);
                closeActionModal();
              }}
              className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Share className="h-4 w-4" />
              공유하기
            </DropdownItem>

            <DropdownItem
              onItemClick={() => {
                const chat = chats.find(c => c.id === actionModal.chatId);
                if (chat) {
                  startChatEdit(chat.id, chat.title);
                }
                closeActionModal();
              }}
              className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Pencil className="h-4 w-4" />
              이름 바꾸기
            </DropdownItem>

            <DropdownItem
              onItemClick={() => {
                const chat = chats.find(c => c.id === actionModal.chatId);
                if (chat?.space) {
                  handleRemoveFromSpace(chat.id, chat.space.id);
                } else if (chat) {
                  openSpaceSelectionModal(chat.id);
                }
                closeActionModal();
              }}
              className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Archive className="h-4 w-4" />
              {chats.find(c => c.id === actionModal.chatId)?.space 
                ? '보관함에서 제거' 
                : '보관함에 저장'}
            </DropdownItem>

            <DropdownItem
              onItemClick={() => {
                if (actionModal.chatId) {
                  openDeleteConfirmModal(actionModal.chatId);
                }
                closeActionModal();
              }}
              className="flex w-full items-center gap-3 px-2 py-2 text-sm text-red-600 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-red-500 dark:hover:bg-white/5 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </DropdownItem>
          </Dropdown>
        </div>
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


      {/* ------------ 공간 액션 모달 (점 세개) ------------ */}
      {spaceActionModal.open && (
        <div 
          className="fixed z-[60]"
          style={{
            top: `${spaceActionModal.y}px`,
            left: `${spaceActionModal.x}px`,
          }}
        >
          <Dropdown
            isOpen={true}
            onClose={closeSpaceActionModal}
            className="w-48 p-2"
          >
            <DropdownItem
              onItemClick={() => {
                const space = spaces.find(s => s.id === spaceActionModal.spaceId);
                if (space) {
                  startSpaceEdit(space.id, space.spaceName);
                }
                closeSpaceActionModal();
              }}
              className="flex w-full items-center gap-3 px-2 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Pencil className="h-4 w-4" />
              이름 바꾸기
            </DropdownItem>

            <DropdownItem
              onItemClick={() => {
                if (spaceActionModal.spaceId) {
                  openDeleteSpaceConfirmModal(spaceActionModal.spaceId);
                }
                closeSpaceActionModal();
              }}
              className="flex w-full items-center gap-3 px-2 py-2 text-sm text-red-600 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-red-500 dark:hover:bg-white/5 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </DropdownItem>
          </Dropdown>
        </div>
      )}

      {/* ------------ 공간 삭제 확인 모달 ------------ */}
      {deleteSpaceConfirmModal.open && (
        <Modal isOpen={deleteSpaceConfirmModal.open} onClose={closeDeleteSpaceConfirmModal} className="max-w-[700px] m-4">
          <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                공간 삭제
              </h4>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                이 행동으로 공간이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={closeDeleteSpaceConfirmModal}
              >
                취소
              </Button>
              <Button 
                size="sm"
                className="!bg-red-500 hover:!bg-red-600 text-white"
                onClick={deleteSpace}
              >
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      )}


    </div>
  );
};

export default Sidebar;