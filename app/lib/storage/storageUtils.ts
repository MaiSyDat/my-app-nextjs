/**
 * Utility functions để làm việc với localStorage
 * 
 * Các hàm này:
 * - getUserFromStorage: Lấy thông tin user từ localStorage
 * - getUserIdFromStorage: Lấy userId từ localStorage
 */

/**
 * Lấy thông tin user từ localStorage
 * @returns User object hoặc null nếu không tìm thấy
 */
export function getUserFromStorage(): { id: string; username: string; email?: string; _id?: string } | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem("user");
  if (!userData) return null;

  try {
    const parsedUser = JSON.parse(userData);
    return parsedUser;
  } catch (error) {
    return null;
  }
}

/**
 * Lấy userId từ localStorage
 * @returns userId string hoặc null
 */
export function getUserIdFromStorage(): string | null {
  const user = getUserFromStorage();
  if (!user) return null;
  return user.id || user._id || null;
}

