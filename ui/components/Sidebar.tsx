'use client';

import React, { useState, useEffect } from 'react';
import { 
  SquarePen, 
  Settings, 
  BookOpen, 
  Search, 
  Home, 
  FolderKanban, 
  Ellipsis, 
  CircleUserRound ,
  MessageCircleMore , // 채팅 아이콘으로 사용
  X, // 닫기 버튼 (Close icon)
  PanelsLeftBottom // 메뉴 아이콘 (Menu icon)
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from './Layout';
import SettingsDialog from './SettingsDialog';
import { useUI } from '@/contexts/UIContext';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;  // '2023-01-02T10:30:00Z' 같은 형식이라고 가정
  focusMode: string;
}

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  ////////////////////채팅 목록 관련 기능////////////////////
  // 채팅 목록
  const [chats, setChats] = useState<Chat[]>([]);
  // 채팅 목록 가져오기
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch chats');
        const data = await res.json();
        // 원하시는 만큼만 잘라서 저장
        setChats(data.chats);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChats();
  }, [chats]);



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



  ////////////////////채팅 검색 관련 기능////////////////////
  // 검색 모달
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 모달 열고 닫기
  const openSearchModal = () => {
    setIsSearchOpen(true);
    setSearchQuery('');
  };
  const closeSearchModal = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // 검색어 입력 시 필터
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 필터링된 채팅 목록
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 검색된 채팅 클릭하면 이동
  const handleSelectChat = (chatId: string) => {
    router.push(`/c/${chatId}`);
    closeSearchModal();
  };



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



  //////////////////// 메뉴 관련 기능////////////////////
  //설정 모달
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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



  ////////////////////사이드바 오픈 관리 기능////////////////////
  const { isSidebarOpen, toggleSidebar } = useUI();



  return (
    <div className="lg:flex">
      {/* ------------ 사이드바 영역 ------------ */}
      {/* 사이드바 영역 - 동적 클래스 적용 */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col bg-gray-40 dark:bg-dark-primary/80 px-4 py-3 rounded-lg backdrop-blur-md shadow-lg h-full overflow-y-auto transition-all duration-300 ${
        isSidebarOpen ? 'lg:w-64' : 'lg:w-24 flex items-center'
      }`}>
        <div className="flex flex-col h-full items-center w-full">
          {/* 상단 버튼들 */}
          <div className={`flex ${isSidebarOpen ? 'justify-between' : 'flex-col gap-2'} items-center w-full`}>
            <button
              onClick={toggleSidebar}
              className="p-2.5 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
            >
              <PanelsLeftBottom className="h-5 w-5" />
            </button>
            <div className={`flex ${isSidebarOpen ? 'items-center' : 'flex-col gap-2'}`}>
              <button
                className="p-2.5 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
                onClick={openSearchModal}
              >
                <Search className="h-5 w-5" />
              </button>
              <Link href="/">
                <button className="p-2.5 cursor-pointer rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200">
                  <SquarePen className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Links & 채팅 목록 */}
          <div className="mt-4 flex-grow w-full">
            <Link href="/">
              <h2 className={`text-base flex items-center ${
                isSidebarOpen 
                  ? 'justify-start gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 mb-3 p-2' 
                  : 'justify-center p-1'
              } transition duration-200`}>    
                <div className={`${
                  !isSidebarOpen ? 'p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700' : ''
                }`}>
                  <Home className="h-5 w-5 text-blue-500 dark:text-black" />
                </div>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Home</span>
              </h2>
            </Link>
            <Link href="/spaceMain">
              <h2 className={` text-base flex items-center ${
                isSidebarOpen 
                  ? 'justify-start gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 mb-3 p-2' 
                  : 'justify-center p-1'
              } transition duration-200`}>    
                <div className={`${
                  !isSidebarOpen ? 'p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700' : ''
                }`}>
                  <FolderKanban className="h-5 w-5 text-blue-500 dark:text-black" />
                </div>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Space</span>
              </h2>
            </Link>
            <Link href="/library">
              <h2 className={` text-base flex items-center ${
                isSidebarOpen 
                  ? 'justify-start gap-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 mb-3 p-2' 
                  : 'justify-center p-1'
              } transition duration-200`}>    
                <div className={`${
                  !isSidebarOpen ? 'p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700' : ''
                }`}>
                  <BookOpen className="h-5 w-5 text-blue-500 dark:text-black" />
                </div>
                <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Library</span>
              </h2>
            </Link>

            <div className={`flex flex-col gap-1 ml-3 pl-2 border-l-2 border-gray-300 dark:border-gray-600 ${
                isSidebarOpen ? 'block' : 'hidden'
              }`}>
              {chats.length > 0 ? (
                chats.slice(0, 5).map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between relative group rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
                  >
                    <Link
                      href={`/c/${chat.id}`}
                      className="p-1.5 text-sm rounded-md text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200 flex-grow"
                    >
                      {chat.title}
                    </Link>
                    <button
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => handleActionClick(e, chat.id)}
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                </p>
              )}
            </div>
          </div>

          {/* 사용자 설정 버튼 */}
          <div className="border-t border-gray-300 dark:border-gray-600 py-1 px-1 flex w-full justify-center lg:justify-start">
            <div className={`flex w-full items-center gap-2 ${
              isSidebarOpen 
                ? 'rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 p-3' 
                : 'pl-2'
            } transition duration-200 cursor-pointer justify-center lg:justify-start`}>
              <div className={`${
                !isSidebarOpen ? 'p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700' : ''
              }`}>
                <CircleUserRound  className="h-5 w-5" />
              </div>
              <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>사용자 설정</span>
            </div>
          </div>

          {/* 관리자 설정 버튼 */}
          <div onClick={()=>setIsSettingsOpen(!isSettingsOpen)}
            className="border-t border-gray-300 dark:border-gray-600 py-1 px-1 flex w-full justify-center lg:justify-start">
            <div className={`flex w-full items-center gap-2 ${
              isSidebarOpen 
                ? 'rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 p-3' 
                : 'pl-2'
            } transition duration-200 cursor-pointer justify-center lg:justify-start`}>
              <div className={`${
                !isSidebarOpen ? 'p-2.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700' : ''
              }`}>
                <Settings className="h-5 w-5" />
              </div>
              <SettingsDialog
                isOpen={isSettingsOpen}
                setIsOpen={setIsSettingsOpen}
              />
              <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>관리자 설정</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------ 메인 컨텐츠 ------------ */}
      <div className={`transition-all duration-300 ${
        isSidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
      } w-full`}>
        <Layout>{children}</Layout>
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
                onClick={closeActionModal}
              >
                아카이브에 보관
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

      {/* ------------ 채팅 검색 모달 ------------ */}
      {isSearchOpen && (
        <div className="fixed z-[80] inset-0 bg-black bg-opacity-50 flex shadow-lg items-center justify-center">
        {/* 모달 컨테이너: 폭을 넓히기 위해 max-w-2xl 사용 */}
        <div className="bg-white dark:bg-dark-primary p-2 rounded-xl shadow-lg w-full max-w-xl relative">
          {/* 상단 영역: 검색창과 닫기 버튼을 같은 줄에 */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
            {/* 검색창 */}
            <div className="relative flex-1 mr-2">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="채팅 검색"
                className="w-full p-2 pl-4 text-sm dark:bg-gray-800 dark:text-white outline-none focus:outline-none"
              />
            </div>
  
            {/* 닫기 버튼 */}
            <button
              className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={closeSearchModal}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
  
          {/* 검색 결과 리스트 */}
          <div className="max-h-72 overflow-y-auto mt-3">
            {filteredChats.length > 0 ? (
              filteredChats.slice(0,10).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className="group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircleMore  className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm pl-2">{chat.title}</span>
                  </div>
                  <span className="hidden group-hover:inline text-xs text-gray-400 dark:text-gray-500">
                    {formatDateTime(chat.createdAt)}
                  </span>
                </div>
              ))
            ) : searchQuery ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                검색 결과가 없습니다.
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                검색어를 입력하세요.
              </p>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Sidebar;
