/**
 * Utility functions để detect và parse URLs trong text
 * 
 * Các hàm này:
 * - isValidUrl: Kiểm tra URL có hợp lệ không
 * - normalizeUrl: Chuẩn hóa URL (thêm https:// nếu thiếu)
 * - parseTextWithUrls: Parse text và detect URLs, trả về array với text và URL objects
 * - Hỗ trợ detect URLs với nhiều format (http://, https://, www., domain pattern)
 */

// Regex pattern để detect URLs (http://, https://, www., hoặc domain pattern)
const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s<>"']*)/gi;

/**
 * Kiểm tra xem một string có phải là URL hợp lệ không
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url.match(/^https?:\/\//i) ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize URL - thêm protocol nếu thiếu
 */
export function normalizeUrl(url: string): string {
  return url.match(/^https?:\/\//i) ? url : `https://${url}`;
}

/**
 * Parse text và tìm tất cả URLs
 * Trả về array của { text, isUrl, url }
 */
export interface TextSegment {
  text: string;
  isUrl: boolean;
  url?: string;
}

export function parseTextWithUrls(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  URL_REGEX.lastIndex = 0;

  let match;
  while ((match = URL_REGEX.exec(text)) !== null) {
    // Thêm text trước URL
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) segments.push({ text: textBefore, isUrl: false });
    }

    // Thêm URL hoặc text thường
    const urlText = match[0];
    if (isValidUrl(urlText)) {
      segments.push({ text: urlText, isUrl: true, url: normalizeUrl(urlText) });
    } else {
      segments.push({ text: urlText, isUrl: false });
    }

    lastIndex = match.index + match[0].length;
  }

  // Thêm text còn lại
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), isUrl: false });
  }

  return segments.length > 0 ? segments : [{ text, isUrl: false }];
}

