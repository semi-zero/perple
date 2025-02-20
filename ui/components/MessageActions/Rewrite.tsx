import { ArrowLeftRight } from 'lucide-react';

const Rewrite = ({
  rewrite,
  messageId,
}: {
  rewrite: (messageId: string) => void;
  messageId: string;
}) => {
  return (
    <button
      onClick={() => rewrite(messageId)}
      className="p-2 text-gray-600 dark:text--gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200 flex flex-row items-center space-x-1"
    >
      <ArrowLeftRight size={18} />
      <p className="text-xs font-medium">다시쓰기</p>
    </button>
  );
};

export default Rewrite;
