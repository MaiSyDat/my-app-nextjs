/**
 * Server-side utility functions để xử lý API requests
 * 
 * Các hàm này chỉ dùng ở server-side (API routes)
 * - normalizeObjectId: Validate và convert string thành ObjectId
 */

import mongoose from "mongoose";

/**
 * Validate và convert string thành ObjectId
 * @param id - ID string cần validate
 * @returns ObjectId hoặc null nếu invalid
 */
export function normalizeObjectId(id: string | null | undefined): mongoose.Types.ObjectId | null {
  if (!id) return null;
  
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    return null;
  }
}


