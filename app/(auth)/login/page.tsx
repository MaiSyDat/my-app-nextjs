/**
 * Trang đăng nhập
 * 
 * Trang này:
 * - Hiển thị form đăng nhập
 * - Redirect về /discord nếu đã đăng nhập (có token trong localStorage)
 * - Route: /login
 */

"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../../ui/login/loginForm';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra nếu đã đăng nhập, redirect về /discord
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/discord");
    }
  }, [router]);

  return (
    <LoginForm />
  )
}
