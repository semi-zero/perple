import type { Metadata } from 'next';
// import { Montserrat } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/theme/Provider';
import { UIProvider } from '@/contexts/UIContext';  // 추가

// const montserrat = Montserrat({
//   weight: ['300', '400', '500', '700'],
//   subsets: ['latin'],
//   display: 'swap',
//   fallback: ['Arial', 'sans-serif'],
// });

export const metadata: Metadata = {
  title: 'SDI R&D Assistant',
  description:
    'SAMSUNG SDI R&D 채팅 시스템입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <body className={cn('h-full bg-white text-black dark:bg-dark-primary dark:text-white')}>
      <UIProvider>  {/* 추가 */}
        <ThemeProvider>
          <Sidebar>{children}</Sidebar>
          <div id="modal-root" />  {/* 모달을 위한 container 추가 */}
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
        </UIProvider>  {/* 추가 */}
      </body>
    </html>
  );
}
