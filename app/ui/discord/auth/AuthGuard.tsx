/**
 * Component bảo vệ route - Kiểm tra authentication
 * 
 * Component này:
 * - Kiểm tra user đã đăng nhập chưa (localStorage)
 * - Redirect về /login nếu chưa đăng nhập
 * - Hiển thị loading state khi đang kiểm tra
 * - Chỉ render children nếu đã authenticated
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../common/LoadingSpinner";

// Component bảo vệ route - kiểm tra token trước khi cho phép truy cập
interface AuthGuardProps {
  children: React.ReactNode;
}

// Component AuthGuard kiểm tra token trong localStorage
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra token trong localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      // Nếu không có token, redirect về trang login
      router.push("/login");
      return;
    }

    // Nếu có token, cho phép truy cập
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  // Hiển thị loading trong khi kiểm tra
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-[#313338] via-[#2B2D31] to-[#1E1F22]">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-[#DBDEE1] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Nếu đã authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Nếu chưa authenticated, không render gì (đang redirect)
  return null;
}

