'use client';

import DeleteChat from '@/components/DeleteChat';
import { cn, formatTimeDifference } from '@/lib/utils';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { BookOpenText, 
  ClockIcon, 
  Ellipsis, 
  FolderKanban, 
  Plus, 
  Menu,
  User,
  Pencil,
  Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

// interface SpaceItem {
//     id: string;          // DB의 space.id
//     spaceName: string;   // DB의 space.spaceName
//     createdAt?: string;  // (있다면) 생성시간
//     updatedAt?: string;  // (있다면) 수정시간
//   }
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

const Page = () => {
  const [loading, setLoading] = useState(true);
  // 에러 메시지 등을 담을 수 있는 상태
  const [error, setError] = useState('');

  ////////////////////공간 목록(GET) 관련 기능////////////////////
  const [spaces, setSpaces] = useState<Space[]>([]);
  // useEffect(() => {
  //   const fetchSpaces = async () => {
  //     setLoading(true);
  //     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //     });
  //     const data = await res.json();
  //     setSpaces(data.spaces);
  //     console.log('[DEBUG] 공간 목록:', data.spaces);
  //     setLoading(false);
  //   };
  //   fetchSpaces();
  // }, []);
  useEffect(() => {
    const fetchSpaces = async () => {
      const userId = 'user-1234'; // 현재 고정값으로 사용 중
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };
    fetchSpaces();
  }, []);
  



  ////////////////////공간 검색 관련 기능////////////////////
  // 검색용 상태
  const [spaceSearchQuery, setSpaceSearchQuery] = useState('');

  // 검색된 결과 필터링
  const filteredSpaces = spaces.filter((space) =>
    space?.spaceName?.toLowerCase().includes(spaceSearchQuery.toLowerCase())
  );



  ////////////////////공간 액션 메뉴 관련 기능////////////////////
  // Action menu
  const [spaceActionModal, setSpaceActionModal] = useState<{
    open: boolean;
    spaceId: string | null;
    x: number;
    y: number;
  }>({ open: false, spaceId: null, x: 0, y: 0 });

  // 액션 메뉴 (점 세 개) 제어
  const handleSpaceActionClick = (e: React.MouseEvent, spaceId: string) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setSpaceActionModal({ open: true, spaceId, x: rect.right, y: rect.bottom });
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



  ////////////////////공간 생성(POST) 관련 기능////////////////////
  // 새 스페이스 생성용
  const [newSpaceName, setNewSpaceName] = useState('');
  // 새 공간 생성 모달
  const [createSpaceModal, setCreateSpaceModal] = useState<{
    open: boolean;
  }>({ open: false });

  //공간 생성 모달 열기
  const openCreateSpaceModal = () => {
    setCreateSpaceModal({ open: true });
    closeSpaceActionModal();
  };
  // 공간 생성 모달 닫기  
  const closeCreateSpaceModal = () => {
    setCreateSpaceModal({ open: false });
  };

  // 스페이스 생성
  // const handleCreateSpace = async () => {
  //   if (!newSpaceName.trim()) {
  //     alert('스페이스 이름을 입력하세요.');
  //     return;
  //   }

  //   try {
  //     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ spaceName: newSpaceName.trim() }),
  //     });
  //     if (!res.ok) {
  //       throw new Error('Failed to create space');
  //     }
  //     const data = await res.json();
  //     // 새 스페이스(단일 객체) 응답: { space: {...} } 라고 가정
  //     const createdSpace = data.space;
  //     // 리스트 갱신
  //     setSpaces((prev) => [createdSpace, ...prev]);
  //     setNewSpaceName('');
  //     closeCreateSpaceModal();
  //   } catch (err: any) {
  //     console.error(err);
  //     alert(`생성 실패: ${err.message}`);
  //   }
  // };
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
      
      console.log('[DEBUG] 새로운 스페이스가 생성되었습니다:', createdSpace);
    } catch (err: any) {
      console.error('[ERROR] 스페이스 생성 중 오류 발생:', err);
      alert(`생성 실패: ${err.message}`);
    }
  };




  ////////////////////공간 삭제(DELETE) 관련 기능////////////////////
  // 삭제 확인 모달
  const [deleteSpaceConfirmModal, setDeleteSpaceConfirmModal] = useState<{
    open: boolean;
    spaceId: string | null;
  }>({ open: false, spaceId: null });

  //삭제 확인 모달 열기
  const openDeleteSpaceConfirmModal = (spaceId: string) => {
    setDeleteSpaceConfirmModal({ open: true, spaceId });
    closeSpaceActionModal();
  };
  // 삭제 확인 모달 닫기  
  const closeDeleteSpaceConfirmModal = () => {
    setDeleteSpaceConfirmModal({ open: false, spaceId: null });
  };

  // 공간 삭제
  // const deleteSpace = async () => {
  //   if (!deleteSpaceConfirmModal.spaceId) return;
  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/spaces/${deleteSpaceConfirmModal.spaceId}`,
  //       {
  //         method: 'DELETE',
  //         headers: { 'Content-Type': 'application/json' },
  //       }
  //     );
  //     if (!res.ok) throw new Error('Failed to delete chat');

  //     // 성공 후 state에서 해당 항목 제거
  //     setSpaces((prev) => prev.filter((space) => space.id !== deleteSpaceConfirmModal.spaceId));
  //     closeDeleteSpaceConfirmModal();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };
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
    } catch (error) {
      console.error(error);
    }
  };

  ////////////////////공간 수정(PUT) 관련 기능(모달)////////////////////
  // 수정 스페이스 생성용
  const [updateSpaceName, setUpdateSpaceName] = useState('');

  // 공간 수정 모달
  const [updateSpaceModal, setUpdateSpaceModal] = useState<{
    open: boolean;
    spaceId?: string;
    currentSpaceName?: string;
  }>({ open: false });

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
    closeSpaceActionModal();
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
    } catch (error) {
      console.error(error);
      alert('공간 수정에 실패했습니다.');
    }
  };




  ////////////////////기타 함수 관련 기능////////////////////
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
          <FolderKanban className="w-7 h-7 text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">공간</h1>
        </div>
        <input
          type="text"
          placeholder="공간 검색..."
          value={spaceSearchQuery}
          onChange={(e) => setSpaceSearchQuery(e.target.value)}
          className="w-2/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* 공간 헤더 + 버튼 */}
      <div className="flex items-center justify-between mt-12 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">공간 목록</h2>
        </div>
        <button onClick={openCreateSpaceModal}
        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
        
          <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* 공간 리스트 */}
      <div className="flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* 공간 생성 카드 */}
            <div
              className="relative p-6 rounded-xl shadow-md bg-white dark:bg-gray-900 transition-all hover:shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={openCreateSpaceModal}
            >
              <div className="h-full flex flex-col items-start justify-start text-left gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">새 공간 만들기</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {filteredSpaces.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">스레드가 없습니다.</p>
            ) : (
                filteredSpaces.map((space) => (
                <div
                  key={space.id}
                  className="relative p-6 rounded-xl shadow-md bg-white dark:bg-gray-900 transition-all hover:shadow-lg"
                >
                  {/* 우측 상단 사용자 아이콘 */}
                  <div className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 p-3">
                    <User className="h-5 w-5" />
                  </div>
                  <Link
                    href={`/space/${space.id}`}
                    className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-blue-500"
                  >
                    {space.spaceName}
                  </Link>
                  <div className="flex items-center justify-between mt-8 text-gray-500 text-sm">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(space.createdAt?.toString() || '')}
                      </span>
                    </div>
                    <button
                      className="p-1 cursor-pointer  rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 
                      hover:text-gray-700 dark:hover:text-gray-400 transition-opacity duration-200"
                      onClick={(e) => handleSpaceActionClick(e, space.id)}
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

      {/* ------------ 공간 액션 모달 (점 세개) ------------ */}
      {spaceActionModal.open && (
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
      )}

      {/* ------------ 공간 생성 모달 ------------ */}
      {createSpaceModal.open && (
        <div className="fixed z-[80] inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-dark-primary p-4 rounded-lg shadow-lg w-full max-w-sm">
            {/* 모달 제목 */}
            
            <h2 className="text-base font-semibold">
              공간을 생성하시겠습니까?
            </h2>
            <input
              type="text"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              className="w-full mt-4 p-2 border rounded-lg mb-4"
              placeholder="공간 이름"
            />
            {/* 하단 버튼 영역 */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-white-200 dark:bg-gray-700 rounded-2xl text-sm border border-light-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={closeCreateSpaceModal}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm hover:bg-blue-600"
                onClick={handleCreateSpace}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------ 공간 삭제 확인 모달 ------------ */}
      {deleteSpaceConfirmModal.open && (
        <div className="fixed z-[80] inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-dark-primary p-4 rounded-lg shadow-lg w-full max-w-sm">
            {/* 모달 제목 */}
            <h2 className="text-base font-semibold">
              공간을 삭제하시겠습니까?
            </h2>
            {/* 모달 안내 문구 */}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              이 행동으로 공간이 삭제됩니다.
              <br />
            </p>
            {/* 하단 버튼 영역 */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-white-200 dark:bg-gray-700 rounded-2xl text-sm border border-light-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={closeDeleteSpaceConfirmModal}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-2xl text-sm hover:bg-red-600"
                onClick={deleteSpace}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------ 공간 수정 모달 ------------ */}
      {updateSpaceModal.open && (
        <div className="fixed z-[80] inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-dark-primary p-4 rounded-lg shadow-lg w-full max-w-sm">
            {/* 모달 제목 */}
            
            <h2 className="text-base font-semibold">
              공간을 수정하시겠습니까?
            </h2>
            <input
              type="text"
              value={updateSpaceName}
              onChange={(e) => setUpdateSpaceName(e.target.value)}
              className="w-full mt-4 p-2 border rounded-lg mb-4"
              placeholder="공간 이름"
            />
            {/* 하단 버튼 영역 */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-white-200 dark:bg-gray-700 rounded-2xl text-sm border border-light-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={closeUpdateSpaceModal}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm hover:bg-blue-600"
                onClick={handleUpdateSpace}
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default Page;
