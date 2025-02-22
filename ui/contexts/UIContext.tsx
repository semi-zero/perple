'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const setSidebarOpen = (isOpen: boolean) => setIsSidebarOpen(isOpen);

  return (
    <UIContext.Provider value={{ isSidebarOpen, toggleSidebar, setSidebarOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}