'use client';

import CustomCard from '@/components/common/CustomCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { 
  Ellipsis, 
  Plus, 
  Pencil,
  Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Input from '@/components/form/input/InputField';
import { Modal } from '@/components/ui/modal';
import Button  from '@/components/ui/button/Button';
import { toast } from 'sonner';
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
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
  
  // 에러 메시지 등을 담을 수 있는 상태
  const [error, setError] = useState('');

  ////////////////////(0) 변수 정리////////////////////
  // 공간 목록
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceLoading, setSpaceLoading] = useState(true);

  // 공간 검색용 상태
  const [spaceSearchQuery, setSpaceSearchQuery] = useState('');

  // 공간 액션 모달
  // const [spaceActionModal, setSpaceActionModal] = useState<{
  //   open: boolean;
  //   spaceId: string | null;
  //   x: number;
  //   y: number;
  // }>({ open: false, spaceId: null, x: 0, y: 0 });

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  // 공간 생성 모달
  const [newSpaceName, setNewSpaceName] = useState('');
  const [createSpaceModal, setCreateSpaceModal] = useState<{
    open: boolean;
  }>({ open: false });

   // 공간 삭제 확인 모달
   const [deleteSpaceConfirmModal, setDeleteSpaceConfirmModal] = useState<{
    open: boolean;
    spaceId: string | null;
  }>({ open: false, spaceId: null });

  // 공간 수정 모달
  const [updateSpaceName, setUpdateSpaceName] = useState('');
  const [updateSpaceModal, setUpdateSpaceModal] = useState<{
    open: boolean;
    spaceId?: string;
    currentSpaceName?: string;
  }>({ open: false });



  ////////////////////(1) 공간 목록(GET) 관련 함수////////////////////
  useEffect(() => {
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
        console.log('[DEBUG] 전체 응답 데이터', data);
        
        const spaceUserList = data.spaceUserList || [];
        const spaces = spaceUserList.map((item: { space: Space }) => item.space);
        setSpaces(spaces);

        if (spaces.length === 0) {
          console.log('[DEBUG] 사용 가능한 공간이 없습니다.');
        } else {
          console.log('[DEBUG] 공간 목록:', spaces);
        }

      } catch (error) {
        console.error('[ERROR] 공간 목록 조회 중 오류 발생:', error);
        // 에러 상태 관리를 위한 state 추가 필요
        setSpaces([]); // 에러 시 빈 배열로 설정
      } finally {
        setSpaceLoading(false);
      }
    };
    fetchSpaces();
  }, []);
  

  ////////////////////(2) 공간 검색 관련 함수////////////////////
  // 검색된 결과 필터링
  const filteredSpaces = spaces.filter((space) =>
    space?.spaceName?.toLowerCase().includes(spaceSearchQuery.toLowerCase())
  );



  ////////////////////(3) 공간 액션 메뉴 관련 함수////////////////////
  // 드롭다운 토글 함수
  const toggleDropdown = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setIsOpen(!isOpen);
  };

  // 드롭다운 닫기 함수
  const closeDropdown = () => {
    setIsOpen(false);
    setSelectedSpaceId(null);
  };
  // // 액션 메뉴 (점 세 개) 제어
  // const handleSpaceActionClick = (e: React.MouseEvent, spaceId: string) => {
  //   const button = e.currentTarget;
  //   const rect = button.getBoundingClientRect();
  //   setSpaceActionModal({ open: true, spaceId, x: rect.right, y: rect.bottom });
  // };

  // //공간 액션 모달 닫기
  // const closeSpaceActionModal = () => {
  //   setSpaceActionModal({ open: false, spaceId: null, x: 0, y: 0 });
  // };

  // // 바깥 클릭 시 액션 메뉴 닫기
  // useEffect(() => {
  //   const handleClickOutside = () => {
  //     if (spaceActionModal.open) closeSpaceActionModal();
  //   };
  //   document.addEventListener('click', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('click', handleClickOutside);
  //   };
  // }, [spaceActionModal.open]);



  ////////////////////(4) 공간 생성(POST) 관련 함수////////////////////
  //공간 생성 모달 열기
  const openCreateSpaceModal = () => {
    setCreateSpaceModal({ open: true });
    closeDropdown();
  };
  // 공간 생성 모달 닫기  
  const closeCreateSpaceModal = () => {
    setCreateSpaceModal({ open: false });
  };

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) {
      alert('스페이스 이름을 입력하세요.');
      return;
    }
  
    try {
      // 임시 ID 생성 (UUID 형식 추천)
      const tempId = `space-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const spaceData = {
        id: tempId,
        userId: 'user-1234', // 실제 로그인된 사용자 ID로 대체 필요
        spaceName: newSpaceName.trim()
      };
  
      const res = await fetch(`http://localhost:3002/api/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spaceData)
      });
  
      if (!res.ok) {
        throw new Error('스페이스 생성에 실패했습니다.');
      }
  
      const data = await res.json();
      const createdSpace = data;
      console.log('[DEBUG] 생성된 스페이스:', data);
      console.log('[DEBUG] createdSpace:', createdSpace);
      
      setSpaces((prev) => [createdSpace, ...prev]);
      setNewSpaceName('');
      closeCreateSpaceModal();
      toast.success('공간이 생성되었습니다.');
      console.log('[DEBUG] 새로운 스페이스가 생성되었습니다:', createdSpace);
      window.location.reload();
    } catch (err: any) {
      console.error('[ERROR] 스페이스 생성 중 오류 발생:', err);
      toast.error('공간 생성에 실패했습니다.');
    }
  };




  ////////////////////(5) 공간 삭제(DELETE) 관련 함수////////////////////
  //삭제 확인 모달 열기
  const openDeleteSpaceConfirmModal = (spaceId: string) => {
    setDeleteSpaceConfirmModal({ open: true, spaceId });
    closeDropdown();
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
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('공간 삭제에 실패했습니다.');
    }
  };

  ////////////////////(6) 공간 수정(PUT) 관련 함수(모달)////////////////////

  //공간 수정 모달 열기
  const openUpdateSpaceModal = (spaceId: string) => {

    const currentSpace = spaces.find((space) => space.id === spaceId);
    
    if (currentSpace) {
      setUpdateSpaceModal({ 
        open: true, 
        spaceId: spaceId, 
        currentSpaceName: currentSpace?.spaceName });
      setUpdateSpaceName(currentSpace?.spaceName || '');
    }
    closeDropdown();
  };
  // 공간 수정 모달 닫기  
  const closeUpdateSpaceModal = () => {
    setUpdateSpaceModal({ open: false });
    setUpdateSpaceName('');
  };


  // 공간 수정
  const handleUpdateSpace = async () => {
    if (!updateSpaceModal.spaceId) return;

    try {
      const updateSpaceData = {
        id: updateSpaceModal.spaceId,
        userId: 'user-1234',
        spaceName: updateSpaceName.trim(),
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
      if (!res.ok) throw new Error('Failed to update space');

       // 성공 후 state에서 해당 항목 업데이트
      setSpaces((prev) => prev.map((space) => 
        space.id === updateSpaceModal.spaceId 
          ? { ...space, spaceName: updateSpaceName.trim() }
          : space
      ));
      closeUpdateSpaceModal();
      toast.success('공간이 수정되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('공간 수정에 실패했습니다.');
    }
  };




  ////////////////////(7) 기타 함수 관련 함수////////////////////
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
      <PageBreadcrumb pageTitle="Space"/>
        <div className="space-y-5 sm:space-y-6">
        <CustomCard 
            className="min-h-screen">
            <div className="flex items-center justify-between">

            {/* 왼쪽 설명 텍스트 */}
            <div className="text-sm text-gray-600 dark:text-white/70">
                나의 공간을 검색하세요.
              </div>

              {/* 오른쪽 검색창 */}
              <div className="relative ml-auto">
                <Input
                  type="text"
                  placeholder="공간 검색..."
                  value={spaceSearchQuery}
                  onChange={(e) => setSpaceSearchQuery(e.target.value)}
                  leftIcon={<SearchIcon />}
                  className="xl:w-[430px]"
                />
              </div>  
            </div>

            {/* 공간 리스트 */}
            <div className="flex-grow">
              {spaceLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {/* 공간 생성 카드 */}
                  <div
                    className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 hover:shadow-theme-xs cursor-pointer"
                    onClick={openCreateSpaceModal}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-brand-500 dark:text-brand-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">새 공간 만들기</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">새로운 공간을 생성합니다</p>
                      </div>
                    </div>
                  </div>

                  {filteredSpaces.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400"></p>
                  ) : (
                    filteredSpaces.map((space) => (
                      <div
                        key={space.id}
                        className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 hover:shadow-theme-xs"
                      >
                        <div className="flex flex-col justify-between h-full">
                          <div className="space-y-2">
                            <Link
                              href={`/space/${space.id}`}
                              className="block text-lg font-semibold text-gray-800 dark:text-white/90 hover:text-brand-500 truncate"
                            >
                              {space.spaceName}
                            </Link>
                            
                            {space.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {space.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <CalendarIcon className="h-4 w-4" />
                              <span className="truncate">{formatDateTime(space.createdAt?.toString() ?? '')}</span>
                            </div>
                            <div className="relative">
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                                onClick={() => toggleDropdown(space.id)}
                              >
                                <Ellipsis className="h-4 w-4"/>
                              </button>

                              {/* 드롭다운 메뉴 */}
                              {isOpen && selectedSpaceId === space.id && (
                                <Dropdown
                                  isOpen={true}
                                  onClose={closeDropdown}
                                  className="absolute left-0 mt-2 w-48 p-2 z-50"
                                >

                                  <DropdownItem
                                    onItemClick={() => {
                                      const space = spaces.find(s => s.id === selectedSpaceId);
                                      if (space) {
                                        openUpdateSpaceModal(space.id);
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
                                      if (selectedSpaceId) {
                                        openDeleteSpaceConfirmModal(selectedSpaceId);
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
            

            
            {/* {spaceActionModal.open && (
              <div
                className="fixed z-[60] bg-white dark:bg-dark-primary p-4 rounded-2xl shadow-lg w-48"
                style={{
                  top: `${spaceActionModal.y}px`,
                  left: `${spaceActionModal.x - 32}px`,
                }}
              >
                <ul className="space-y-2 text-sm">
                  <li>
                    <button
                      className="w-full text-left px-1 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md flex items-center gap-3"
                      onClick={() => openUpdateSpaceModal(spaceActionModal.spaceId!)}
                    >
                    <Pencil className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">이름 바꾸기</span>
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-1 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-red-600 flex items-center gap-3"
                      onClick={() => openDeleteSpaceConfirmModal(spaceActionModal.spaceId!)}
                    >
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <span className="text-sm">삭제</span>
                    </button>
                  </li>
                </ul>
              </div>
            )} */}

            {/* ------------ 공간 생성 모달 ------------ */}
            {createSpaceModal.open && (
              <Modal isOpen={createSpaceModal.open} onClose={closeCreateSpaceModal} className="max-w-[700px] m-4">
                <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                  <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                      새 공간 만들기
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                      새로운 공간의 이름을 입력해주세요.
                    </p>
                    <Input
                      type="text"
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      placeholder="공간 이름"
                      className="mb-6"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={closeCreateSpaceModal}
                    >
                      취소
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleCreateSpace}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              </Modal>
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

            {/* ------------ 공간 수정 모달 ------------ */}
            {updateSpaceModal.open && (
              <Modal isOpen={updateSpaceModal.open} onClose={closeUpdateSpaceModal} className="max-w-[700px] m-4">
                <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                  <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                      공간 이름 수정
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                      공간의 새로운 이름을 입력해주세요.
                    </p>
                    <Input
                      type="text"
                      value={updateSpaceName}
                      onChange={(e) => setUpdateSpaceName(e.target.value)}
                      placeholder="공간 이름"
                      className="mb-6"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={closeUpdateSpaceModal}
                    >
                      취소
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleUpdateSpace}
                    >
                      수정
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
          </CustomCard>
        </div>
      </div>
    </div>
  );
};

export default Page;
