import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'SDI R&D Assistant',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

export default Layout;
