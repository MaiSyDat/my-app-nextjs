"use client";

import React, { Children } from 'react'
import Login from './login/page';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-r to-purple-600 from-blue-800 font-sans">
      {children}
    </main>
  );
}
