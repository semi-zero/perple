'use client';

import DeleteChat from '@/components/DeleteChat';
import { cn, formatTimeDifference } from '@/lib/utils';
import { BookOpenText, ClockIcon, Ellipsis, Plus, Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

const Page = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setChats(data.chats);
      setLoading(false);
    };
    fetchChats();
  }, []);

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen flex flex-col">
      {/* 고정된 상단 바 */}
      <div className="sticky top-0 left-0 w-full bg-white dark:bg-gray-900 z-10 shadow-sm py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenText className="w-7 h-7 text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">도서관</h1>
        </div>
        <input
          type="text"
          placeholder="스레드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* 스레드 헤더 + 버튼 */}
      <div className="flex items-center justify-between mt-4 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">스레드</h2>
        </div>
        <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
          <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* 채팅 리스트 */}
      <div className="flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {filteredChats.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">스레드가 없습니다.</p>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-5 rounded-xl shadow-md bg-white dark:bg-gray-900 transition-all hover:shadow-lg"
                >
                  <Link
                    href={`/c/${chat.id}`}
                    className="text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-blue-500"
                  >
                    {chat.title}
                  </Link>
                  <div className="flex items-center justify-between mt-2 text-gray-500 text-sm">
                    <div className="flex items-center space-x-2">
                      <ClockIcon size={16} />
                    </div>
                    <Ellipsis className="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
