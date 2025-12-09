import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware kiểm tra authentication cho các route protected
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite /channels/@me to /channels/me (vì Next.js coi @ là parallel route)
  // Xử lý cả root path và nested paths
  if (pathname === '/channels/@me' || pathname.startsWith('/channels/@me/')) {
    const newPath = pathname.replace('/channels/@me', '/channels/me');
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.rewrite(url);
  }

  // Lấy token từ cookies (nếu có)
  const token = request.cookies.get("token")?.value;

  // Kiểm tra nếu đang truy cập route /discord
  if (pathname.startsWith("/discord")) {
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
// Dùng catch-all để bắt tất cả routes, sau đó filter trong middleware function
export const config = {
  matcher: [
    "/discord/:path*",
    "/channels/:path*", // Catch all /channels routes để xử lý rewrite
  ],
};
