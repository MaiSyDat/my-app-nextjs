/**
 * Utility functions để validate và normalize username
 * 
 * Username rules:
 * - Chỉ chứa chữ cái, số, và dấu gạch dưới
 * - Không có khoảng trắng
 * - Không có dấu tiếng Việt
 * - Không có ký tự đặc biệt
 * - Độ dài tối thiểu 3 ký tự
 */

/**
 * Normalize username: loại bỏ dấu, khoảng trắng, ký tự đặc biệt
 * @param username - Username cần normalize
 * @returns Username đã được normalize
 */
export function normalizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .normalize("NFD") // Chuyển về dạng NFD để tách dấu
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt
    .replace(/[^a-z0-9_]/g, "") // Chỉ giữ chữ cái, số và dấu gạch dưới
    .replace(/\s+/g, ""); // Loại bỏ khoảng trắng
}

/**
 * Validate username format
 * @param username - Username cần validate
 * @returns true nếu hợp lệ, false nếu không hợp lệ
 */
export function isValidUsername(username: string): boolean {
  // Username chỉ chứa chữ cái, số và dấu gạch dưới
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  
  // Kiểm tra độ dài
  if (username.length < 3 || username.length > 30) {
    return false;
  }
  
  // Kiểm tra format
  return usernameRegex.test(username);
}

/**
 * Validate username format, trả về error message nếu không hợp lệ (KHÔNG normalize)
 * @param username - Username cần validate
 * @returns { isValid: boolean, error?: string }
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = username.trim();
  
  // Kiểm tra độ dài
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: "Username must be at least 3 characters.",
    };
  }
  
  if (trimmed.length > 30) {
    return {
      isValid: false,
      error: "Username must not exceed 30 characters.",
    };
  }
  
  // Kiểm tra có khoảng trắng không
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: "Username cannot contain spaces.",
    };
  }
  
  // Kiểm tra có dấu tiếng Việt không
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Username cannot contain Vietnamese accents.",
    };
  }
  
  // Kiểm tra format (chỉ chữ cái, số và dấu gạch dưới)
  if (!isValidUsername(trimmed)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, and underscores.",
    };
  }
  
  return {
    isValid: true,
  };
}

