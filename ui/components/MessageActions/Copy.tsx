import { Check, ClipboardList } from 'lucide-react';
import { Message } from '../ChatWindow';
import { useState } from 'react';

// Source 타입 정의 추가
interface Source {
  metadata: {
    url: string;
  };
}

interface MessageWithSources extends Message {
  sources?: Source[];
}

const Copy = ({
  message,
  initialMessage,
}: {
  message: MessageWithSources;
  initialMessage: string;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        const contentToCopy = `${initialMessage}${
          message.sources && message.sources.length > 0
            ? `\n\nCitations:\n${message.sources
                .map((source: Source, i: number) => `[${i + 1}] ${source.metadata.url}`)
                .join('\n')}`
            : ''
        }`;
        navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
      className="p-2 text-gray-600 dark:text--gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
    >
      {copied ? <Check size={18} /> : <ClipboardList size={18} />}
    </button>
  );
};

export default Copy;
