import SearchSteps from '@/components/SearchSteps';

// 검색 단계 인터페이스 추가
interface SearchStep {
  type: 'start' | 'search' | 'processing' | 'complete';
  query?: string;
  sources?: string[];
  description?: string;
  status: 'pending' | 'active' | 'completed';
}

const MessageBoxLoading = ({ 
  searchSteps,
  focusMode
}: { 
  searchSteps?: SearchStep[],
  focusMode?: string
}) => {
  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* 검색 모드일 때만 검색 단계 표시 */}
      {focusMode === 'pipelineSearch' && searchSteps && searchSteps.length > 0 && (
        <div className="mb-4">
          <SearchSteps steps={searchSteps} />
        </div>
      )}
      
      <div className="bg-light-primary dark:bg-dark-primary animate-pulse rounded-lg py-3 space-y-2">
        <div className="h-2 rounded-full w-full bg-light-secondary dark:bg-dark-secondary" />
        <div className="h-2 rounded-full w-9/12 bg-light-secondary dark:bg-dark-secondary" />
        <div className="h-2 rounded-full w-10/12 bg-light-secondary dark:bg-dark-secondary" />
      </div>
    </div>
  );
};

export default MessageBoxLoading;