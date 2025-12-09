/**
 * API Route: Upload Avatar
 * 
 * POST /api/users/upload-avatar - Upload avatar image
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create avatars directory if it doesn't exist
    const avatarsDir = join(process.cwd(), "public", "avatars");
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;
    const filePath = join(avatarsDir, fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Return file URL
    const fileUrl = `/avatars/${fileName}`;

    return NextResponse.json(
      {
        message: "Avatar uploaded successfully.",
        avatarUrl: fileUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

