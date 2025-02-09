import React from 'react';

interface ExtraMessage {
  field1: string;
  field2: string;
  field3: string;
}

interface AcademicSearchFieldsProps {
    extraMessage: ExtraMessage;
    setExtraMessage: React.Dispatch<React.SetStateAction<ExtraMessage>>;
  }
  

const AcademicSearchFields: React.FC<AcademicSearchFieldsProps> = ({
  extraMessage,
  setExtraMessage,
}) => {
  return (
    <div className="w-full bg-white dark:bg-dark-800 shadow-lg rounded-2xl p-4 border border-light-200 dark:border-dark-200 space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">학술 검색 정보</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          연구분야
        </label>
        <input
          type="text"
          value={extraMessage.field1}
          onChange={(e) =>
            setExtraMessage((prev) => ({
              ...prev,
              field1: e.target.value,
            }))
          }
          className="w-full p-2 border rounded-md bg-transparent"
          placeholder="예: 인공지능, 로보틱스, 바이오테크놀로지"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          검색 목적
        </label>
        <select
          value={extraMessage.field2}
          onChange={(e) =>
            setExtraMessage((prev) => ({
              ...prev,
              field2: e.target.value,
            }))
          }
          className="w-full p-2 border rounded-md bg-transparent"
        >
          <option value="">선택하세요</option>
          <option value="논문 작성">논문 작성</option>
          <option value="연구 동향 파악">연구 동향 파악</option>
          <option value="기술 조사">기술 조사</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          주요 키워드
        </label>
        <input
          type="text"
          value={extraMessage.field3}
          onChange={(e) =>
            setExtraMessage((prev) => ({
              ...prev,
              field3: e.target.value,
            }))
          }
          className="w-full p-2 border rounded-md bg-transparent"
          placeholder="예: 딥러닝, 컴퓨터 비전, 자율주행"
        />
      </div>
    </div>
  );
};

export default AcademicSearchFields;
