import { useEffect, useState } from 'react';

interface Space {
  id: string;
  spaceName: string;
}

interface SpaceSelectionModalProps {
  onClose: () => void;
  onSelect: (spaceId: string, chatId: string) => void;  // chatId 매개변수 추가
  chatId: string;
}

export function SpaceSelectionModal({ onClose, onSelect, chatId }: SpaceSelectionModalProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
        const data = await res.json();
        setSpaces(data.spaces);
      } catch (error) {
        console.error(error);
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