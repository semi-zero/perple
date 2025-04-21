import { useEffect, useState } from 'react';

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


interface SpaceSelectionModalProps {
  onClose: () => void;
  onSelect: (spaceId: string, chatId: string) => void;  // chatId 매개변수 추가
  chatId: string;
}

export function SpaceSelectionModal({ onClose, onSelect, chatId }: SpaceSelectionModalProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchSpaces = async () => {
  //     try {
  //       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`, {
  //           method: 'GET',
  //           headers: { 'Content-Type': 'application/json' },
  //         });
  //       const data = await res.json();
  //       setSpaces(data.spaces);
  //     } catch (error) {
  //       console.error(error);
  //     } finally {
  //       setLoading(false);
  //     }
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

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">채팅을 추가할 공간 선택</h2>
        {loading ? (
          <div className="text-center py-4">로딩 중...</div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-4">사용 가능한 공간이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {spaces.map((space) => (
              <button
                key={space.id}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                onClick={() => onSelect(space.id, chatId)}  // chatId도 함께 전달
              >
                {space.spaceName}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}