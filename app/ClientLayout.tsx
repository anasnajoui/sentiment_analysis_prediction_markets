"use client";

import { Toaster } from 'react-hot-toast';

interface ClientLayoutProps {
  children: React.ReactNode;
  geistSans: string;
  geistMono: string;
}

export default function ClientLayout({ children, geistSans, geistMono }: ClientLayoutProps) {
  return (
    <body 
      className={`${geistSans} ${geistMono} antialiased`}
      suppressHydrationWarning={true}
    >
      {children}
      <Toaster position="top-right" />
    </body>
  );
}