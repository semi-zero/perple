'use client';

import { 
  ClockIcon, 
  Ellipsis, 
  Archive, 
  Trash2 
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import Button  from '@/components/ui/button/Button';
import CustomCard from '@/components/common/CustomCard';
import { Modal } from '@/components/ui/modal';
import CustomPageBreadCrumb from '@/components/common/CustomPageBreadCrumb';
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

const Page = ({ params }: { params: { spaceId: string } }) => {
  const spaceId = params.spaceId;
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 채팅 액션 모달
  // const [actionModal, setActionModal] = useState<{
  //   open: boolean;
  //   chatId: string | null;
  //   x: number;
  //   y: number;
  // }>({ open: false, chatId: null, x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // 채팅 삭제 확인 모달
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    chatId: string | null;
  }>({ open: false, chatId: null });

  // 공간 정보와 채팅 목록을 가져오는 함수
  const fetchSpaceAndChats = async () => {
    if (!spaceId) return;

    try {
      setLoading(true);
      // 1. 공간 정보 가져오기
      const spaceRes = await fetch(`http://localhost:3002/api/spaces/${spaceId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!spaceRes.ok) {
        throw new Error('공간 정보를 가져오는데 실패했습니다.');
      }

      const spaceData = await spaceRes.json();
      setSpaces(spaceData);

      // 2. 채팅 목록 가져오기
      const chatsRes = await fetch(`http://localhost:3002/api/spaces/${spaceId}/chats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!chatsRes.ok) {
        throw new Error('채팅 목록을 가져오는데 실패했습니다.');
      }

      try {
        const chatsData = await chatsRes.json();
        // chatList가 없거나 null인 경우 빈 배열로 처리
        // 시간 역순으로 정렬
        const sortedChats = (chatsData?.chatList || []).sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setChats(sortedChats);
        console.log('[DEBUG] 채팅 목록 데이터:', chatsData);
      } catch (parseError) {
        console.log('[DEBUG] 채팅 목록이 비어있거나 JSON 파싱 실패');
        setChats([]); // 파싱 실패 시 빈 배열로 설정
      }
    } catch (error) {
      console.error('[ERROR] 데이터 가져오기 실패:', error);
      toast.error(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // URL 변경을 감지하여 데이터 다시 불러오기
  useEffect(() => {
    fetchSpaceAndChats();
  }, [spaceId]); // spaceId가 변경될 때마다 실행

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  ////////////////////(2) 채팅 액션 메뉴 관련 함수////////////////////
  // 액션 메뉴 (점 세 개) 제어
  // const handleActionClick = (e: React.MouseEvent, chatId: string) => {
  //   const button = e.currentTarget;
  //   const rect = button.getBoundingClientRect();
  //   setActionModal({ open: true, chatId, x: rect.right, y: rect.bottom });
  // };

  // const closeActionModal = () => {
  //   setActionModal({ open: false, chatId: null, x: 0, y: 0 });
  // };

  // // 바깥 클릭 시 액션 메뉴 닫기
  // useEffect(() => {
  //   const handleClickOutside = () => {
  //     if (actionModal.open) closeActionModal();
  //   };
  //   document.addEventListener('click', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('click', handleClickOutside);
  //   };
  // }, [actionModal.open]);
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
      closeDeleteConfirmModal();
    } catch (error) {
      console.error(error);
    }
  };

  ////////////////////(4) 공간 액션 메뉴 관련 함수(채팅 공간에 제거 // 제거만 함!!!!)////////////////////

  // 채팅을 공간에서 제거하는 함수
  const handleRemoveFromSpace = async (chatId: string) => {
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
      await fetchSpaceAndChats();
      
      toast.success('채팅이 공간에서 제거되었습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
      console.error(error);
    }
  };
  

  
  ////////////////////(5) 기타 함수////////////////////
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
      <CustomPageBreadCrumb pageTitle={spaces?.spaceName ?? ''} topPageLink="/spaceMain" topPageTitle="Space"/>
        <div className="space-y-5 sm:space-y-6"></div>
        <CustomCard   
          className="min-h-screen">
            
            <div className="flex items-center justify-between">
              {/* 왼쪽 설명 텍스트 */}
              <div className="text-sm text-gray-600 dark:text-white/70">
                원하는 채팅을 검색해보세요.
              </div>

              {/* 오른쪽 검색창 */}
              <div className="relative ml-auto">
                <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
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
                      fill=""
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="채팅 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent
                  py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 input-focus
                  focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] 
                  dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
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
                          <Link
                            href={`/c/${chat.id}`}
                            className="text-lg font-semibold text-gray-800 dark:text-white/90 hover:text-blue-500"
                          >
                            {chat.title}
                          </Link>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <ClockIcon size={16} />  
                                <span>{formatDateTime(chat.createdAt?.toString() ?? '')}</span>
                              </div>
                            </div>
                            <div className="relative">
                              <button
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                                onClick={(e) => toggleDropdown(chat.id)}
                              >
                                <Ellipsis className="h-4 w-4" />
                              </button>
                              
                              {isOpen && selectedChatId === chat.id && (
                                <Dropdown
                                  isOpen={true}
                                  onClose={closeDropdown}
                                  className="absolute left-0 mt-2 w-48 p-2 z-50"
                                >
                                  <DropdownItem
                                    onItemClick={() => {
                                      const chat = chats.find(c => c.id === selectedChatId);
                                      if (chat?.space) {
                                        handleRemoveFromSpace(chat.id);
                                      } else if (chat) {
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
            
        </CustomCard>
        </div>
      </div>
  );
};

export default Page;
