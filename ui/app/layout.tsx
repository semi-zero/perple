import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/theme/Provider';
import { UIProvider } from '@/contexts/UIContext';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SDI R&D Assistant',
  description: 'SAMSUNG SDI R&D 채팅 시스템입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body className={cn(
        outfit.className,
        'h-full bg-white text-black dark:bg-dark-primary dark:text-white'
      )}>
        <UIProvider>
          <ThemeProvider>
            <Sidebar>{children}</Sidebar>
            <div id="modal-root" />
            <Toaster
              toastOptions={{
                unstyled: true,
                classNames: {
                  toast:
                    'bg-white text-black dark:bg-dark-secondary dark:text-white/80 rounded-lg p-4 flex flex-row items-center space-x-2',
                },
              }}
            />
          </ThemeProvider>
        </UIProvider>
      </body>
    </html>
  );
}