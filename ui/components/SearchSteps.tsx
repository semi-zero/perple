import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface SearchStep {
  type: 'search' | 'processing' | 'complete';
  query?: string;
  sources?: string[];
  status: 'pending' | 'active' | 'completed';
}

interface SearchStepsProps {
  steps: SearchStep[];
}

const SearchSteps = ({ steps }: SearchStepsProps) => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    // 각 단계를 200ms 간격으로 순차적으로 표시
    steps.forEach((_, index) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, index]);
      }, index * 200);
    });
  }, [steps]);

  return (
    <div className="fixed top-16 left-0 right-0 z-50">
      <div className="max-w-3xl mx-auto px-4 py-2">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`
                transform transition-all duration-300 ease-in-out
                ${visibleSteps.includes(index) 
                  ? 'translate-y-0 opacity-100' 
                  : '-translate-y-4 opacity-0 h-0'
                }
              `}
            >
              <div className="flex items-center space-x-3 px-4 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700">
                <div className="flex-shrink-0">
                  {step.status === 'active' && (
                    <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  {step.type === 'search' && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">검색 중: </span>
                      <span className="text-gray-600 dark:text-gray-400">{step.query}</span>
                    </div>
                  )}
                  {step.type === 'processing' && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">검색 소스: </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {step.sources?.map((source, i) => (
                          <span key={source} className="inline-flex items-center">
                            <span className="px-2 py-1 mx-1 bg-gray-100 dark:bg-gray-700 rounded">
                              {source}
                            </span>
                            {i < (step.sources?.length || 0) - 1 && ', '}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                  {step.type === 'complete' && (
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      정보 수집 완료
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