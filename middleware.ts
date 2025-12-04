import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware kiểm tra authentication cho các route protected
export function middleware(request: NextRequest) {
  // Lấy token từ cookies (nếu có)
  const token = request.cookies.get("token")?.value;

  // Kiểm tra nếu đang truy cập route /discord
  if (request.nextUrl.pathname.startsWith("/discord")) {
    // Nếu không có token trong cookies, cho phép truy cập (sẽ check localStorage ở client-side)
    // Hoặc redirect về login nếu muốn bắt buộc phải có cookie
    if (!token) {
      // Cho phép truy cập, component client-side sẽ check localStorage và redirect
      return NextResponse.next();
    }
  }

  // Cho phép tiếp tục
  return NextResponse.next();
}

// Cấu hình matcher để chỉ chạy middleware cho các route cụ thể
export const config = {
  matcher: ["/discord/:path*"],
};

