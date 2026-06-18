import React from 'react';
import AppLayoutClient from './AppLayoutClient';

// Tối ưu hóa Technical SEO: Ngăn chặn công cụ tìm kiếm index các trang thuộc Dashboard / App cá nhân.
export const metadata = {
  title: 'NexaFlow Workspace Dashboard',
  robots: {
    index: false,
    follow: false
  }
};

export default function AppLayout({ children }) {
  return (
    <AppLayoutClient>
      {children}
    </AppLayoutClient>
  );
}
