'use client';

import { cn } from '@/lib/utils';
import { BookOpenText, Home, Search, SquarePen, Settings, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import React, { useState, type ReactNode } from 'react';
import Layout from './Layout';
import SettingsDialog from './SettingsDialog';

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-y-4 w-full">{children}</div>
  );
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navLinks = [
    {
      icon: Home,
      href: '/',
      active: segments.length === 0 || segments.includes('c'),
      label: 'Home',
    },
    {
      icon: Search,
      href: '/discover',
      active: segments.includes('discover'),
      label: 'Discover',
    },
    {
      icon: BookOpenText,
      href: '/library',
      active: segments.includes('library'),
      label: 'Library',
    },
    {
      icon: MessageSquare,
      href: '/chats',
      active: segments.includes('chats'),
      label: 'Chats',
    },
  ];

  return (
    <div>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-28 lg:flex-col">
        <div className="flex grow flex-col items-center justify-between gap-y-6 overflow-y-auto bg-pastel-blue dark:bg-pastel-dark-blue px-3 py-10 rounded-lg shadow-lg">
          <a href="/">
            <SquarePen className="cursor-pointer text-pastel-purple dark:text-pastel-light-purple" />
          </a>
          <VerticalIconContainer>
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className={cn(
                  'relative flex flex-row items-center justify-center cursor-pointer hover:bg-pastel-gray/50 dark:hover:bg-pastel-dark-gray/50 duration-200 transition w-full py-3 rounded-xl',
                  link.active
                    ? 'text-pastel-purple dark:text-pastel-light-purple'
                    : 'text-pastel-gray dark:text-pastel-dark-gray',
                )}
              >
                <link.icon className="h-6 w-6" />
                {link.active && (
                  <div className="absolute right-0 -mr-3 h-full w-2 rounded-l-xl bg-pastel-purple dark:bg-pastel-light-purple" />
                )}
              </Link>
            ))}
          </VerticalIconContainer>

          <Settings
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="cursor-pointer text-pastel-purple dark:text-pastel-light-purple"
          />

          <SettingsDialog
            isOpen={isSettingsOpen}
            setIsOpen={setIsSettingsOpen}
          />
        </div>
      </div>

      <div className="fixed bottom-0 w-full z-50 flex flex-row items-center gap-x-6 bg-pastel-light dark:bg-pastel-dark px-6 py-5 shadow-lg rounded-t-lg lg:hidden">
        {navLinks.map((link, i) => (
          <Link
            href={link.href}
            key={i}
            className={cn(
              'relative flex flex-col items-center space-y-2 text-center w-full',
              link.active
                ? 'text-pastel-purple dark:text-pastel-light-purple'
                : 'text-pastel-gray dark:text-pastel-dark-gray',
            )}
          >
            {link.active && (
              <div className="absolute top-0 -mt-4 h-2 w-full rounded-b-lg bg-pastel-purple dark:bg-pastel-light-purple" />
            )}
            <link.icon className="h-6 w-6" />
            <p className="text-sm">{link.label}</p>
          </Link>
        ))}
      </div>

      <Layout>{children}</Layout>
    </div>
  );
};

export default Sidebar;