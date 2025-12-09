/**
 * Utility functions để xử lý user data
 * 
 * Các hàm này:
 * - formatAvatarUrl: Format avatar URL để đảm bảo là URL hợp lệ
 * - getDisplayName: Lấy display name hoặc username
 * - getInitials: Lấy chữ cái đầu của tên
 */

/**
 * Format avatar URL để đảm bảo là URL hợp lệ
 * @param avatarUrl - Avatar URL từ database (có thể là relative hoặc absolute)
 * @returns Formatted avatar URL hoặc null
 */
export function formatAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  
  // Nếu đã là URL đầy đủ, trả về như cũ
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // Nếu không bắt đầu bằng /, thêm /
  if (!avatarUrl.startsWith('/')) {
    return `/${avatarUrl}`;
  }
  
  return avatarUrl;
}

/**
 * Lấy display name hoặc username
 * @param user - User object với displayName và username
 * @returns Display name hoặc username
 */
export function getDisplayName(user: { displayName?: string | null; username?: string }): string {
  return user.displayName || user.username || "Unknown";
}

/**
 * Lấy chữ cái đầu của tên
 * @param name - Tên cần lấy initial
 * @returns Chữ cái đầu viết hoa
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name.charAt(0).toUpperCase();
}

