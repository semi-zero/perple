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
    <div className="w-full transition-all duration-500">
      <div className="w-full mx-auto">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg border border-gray-200 dark:border-gray-700  overflow-hidden">
          <div 
            className="px-4 py-2 text-lg text-gray-800 dark:text-gray-200 flex justify-between cursor-pointer transition-colors 
            duration-300 hover:bg-gray-50 dark:hover:bg-gray-750" 
            onClick={() => setCollapsed(!collapsed)}
          >
              <div className="text-blue-500 dark:text-gray-100 text-xs flex items-center space-x-3 mb-1">
                <Globe size={20} /> 
                <span>Pipeline 검색</span>
              </div>
            {allCompleted ? (
              <div className={`transform transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}>
                <ChevronDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
            ) : null}
          </div>
          <div className={`transition-all duration-500 ease-in-out ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            {
              steps.map((step, index) => (
                <div key={`${step.type}-${index}`} className="transform transition-all duration-300 ease-in-out">
                  <div className="flex items-center space-x-3 px-4 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700">
                    <div className="flex-shrink-0 mb-1">
                      {step.status === 'active' && (
                        <RefreshCw  className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {step.status === 'completed' && (
                        <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0 mb-1">
                      {step.type === 'start' && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">검색 시작: </span>
                          <span className="text-gray-600 dark:text-gray-400">{step.query}</span>
                        </div>
                      )}
                      {step.type === 'search' && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">검색 진행: </span>
                          <span className="text-gray-600 dark:text-gray-400">{step.description}</span>
                        </div>
                      )}
                      {step.type === 'processing' && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">검색 출처: </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {step.sources && step.sources.length > 0 ? (
                              step.sources.map((source, i) => (
                                <span key={`${source}-${i}`} className="inline-flex items-center">
                                  <span className="px-2 py-1 mx-1 bg-gray-100 dark:bg-gray-700 rounded">
                                    {source}
                                  </span>
                                  {i < (step.sources?.length || 0) - 1 && ' '}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 mx-1 bg-gray-100 dark:bg-gray-700 rounded">
                                정보 처리 중...
                              </span>
                            )}
                          </span>
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
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSteps;