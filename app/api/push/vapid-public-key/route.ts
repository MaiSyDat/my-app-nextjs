/**
 * API Route: Lấy VAPID Public Key
 * 
 * GET /api/push/vapid-public-key
 * 
 * Trả về VAPID public key để client sử dụng khi subscribe
 */

import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { message: "VAPID public key not configured." },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey }, { status: 200 });
}

