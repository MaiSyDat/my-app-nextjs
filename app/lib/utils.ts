/**
 * Utility functions dùng chung cho toàn bộ ứng dụng
 * 
 * File này re-export các utilities từ các modules chuyên biệt
 * để giữ backward compatibility và dễ import
 */

// Re-export storage utilities
export { getUserFromStorage, getUserIdFromStorage } from './storage/storageUtils';

// Re-export socket utilities
export { getSocketUrl } from './socket/socketUtils';
