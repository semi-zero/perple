'use client';

import { Metadata } from 'next';
import React from 'react';
import { motion } from 'framer-motion';

// export const metadata: Metadata = {
//   title: 'SDI R&D Assistant',
// };

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main
      className="relative min-h-screen bg-gradient-to-br 
                 from-pastel-blue to-pastel-lavender 
                 dark:from-dark-primary dark:to-dark-secondary 
                 p-4"
    >
      {/* 상단 고정 타이틀 */}
      <header
        className="fixed top-0 left-0 w-full z-50
        bg-white dark:bg-dark-800 shadow-md p-4"
      >
        <h1 className="text-xl font-bold">SDI R&D Assistant</h1>
      </header>

      {/* 내용 컨테이너 (가로 폭 축소) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="
          max-w-screen-md mx-auto 
          bg-white dark:bg-dark-800 
          p-6 mt-6
          rounded-md
          shadow
        "
      >
        {children}
      </motion.div>
    </main>
  );
};

export default Layout;
