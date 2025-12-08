/**
 * Utility functions để làm việc với Socket.io
 * 
 * Các hàm này:
 * - getSocketUrl: Lấy socket URL từ window.location
 */

/**
 * Lấy socket URL từ window.location
 * @returns Socket URL string
 */
export function getSocketUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  const port = window.location.port || '3000';
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
}

