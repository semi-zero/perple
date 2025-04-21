import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
  Globe,
  RefreshCw 
} from 'lucide-react';

interface SearchStep {
  type: 'start' | 'search' | 'processing' | 'complete';
  query?: string;
  sources?: string[];
  description?: string; // 설명을 위한 새로운 필드 추가
  status: 'pending' | 'active' | 'completed';
}

interface SearchStepsProps {
  steps: SearchStep[];
}

const SearchSteps = ({ steps }: SearchStepsProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    const completed = steps.every(step => step.status === 'completed');
    setAllCompleted(completed);
    if (completed) {
      setCollapsed(true);
    }
  }, [steps]);

  return (
    <div className="w-full mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 헤더 섹션 */}
        <div 
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between px-6 py-4 cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Globe className="text-brand-500 dark:text-brand-400" size={18} />
            <span className="text-gray-800 dark:text-gray-200 font-medium">Pipeline 검색</span>
          </div>
          {allCompleted && (
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300
              ${collapsed ? 'rotate-0' : 'rotate-180'}`}
            />
          )}
        </div>

        {/* 스텝 컨텐츠 */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden
          ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
          {steps.map((step, index) => (
            <div 
              key={`${step.type}-${index}`}
              className="px-6 py-4 border-t border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start gap-4">
                {/* 스텝 상태 아이콘 */}
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'active' && (
                    <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircleIcon className="w-5 h-5 text-brand-500" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                </div>

                {/* 스텝 컨텐츠 */}
                <div className="flex-grow min-w-0">
                  {step.type === 'start' && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        검색 시작
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                        {step.query}
                      </p>
                    </div>
                  )}

                  {step.type === 'search' && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        검색 진행
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  )}

                  {step.type === 'processing' && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        검색 출처
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {step.sources && step.sources.length > 0 ? (
                          step.sources.map((source, i) => (
                            <span 
                              key={`${source}-${i}`}
                              className="px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700/50 
                              text-gray-600 dark:text-gray-400 rounded-full"
                            >
                              {source}
                            </span>
                          ))
                        ) : (
                          <span className="px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700/50 
                          text-gray-600 dark:text-gray-400 rounded-full">
                            정보 처리 중...
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {step.type === 'complete' && (
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      정보 전달 완료
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchSteps;