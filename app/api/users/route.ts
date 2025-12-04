import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";

// Get: Lấy danh sách users
export async function GET(request: NextRequest) {
    // Connect đến database
    await dbConnect();
    // Lấy tất cả users từ database
    const users = await User.find({});
    // Trả về danh sách users dưới dạng JSON
    return NextResponse.json(users, { status: 200 });
}

// Post: Tạo mới user
export async function POST(request: NextRequest) {
    // Lấy dữ liệu từ body request
    const body = await request.json();
    // Kết nối đến database
    await dbConnect();
    // Tạo mới user trong database
    const newUser = await User.create(body);
    // Trả về user vừa tạo dưới dạng JSON
    return NextResponse.json(newUser, { status: 201 });
}