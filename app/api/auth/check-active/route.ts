import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phoneNumber = String(body?.phoneNumber || "").trim();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Missing phoneNumber" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { phoneNumber },
      select: { id: true, fullName: true, isActive: true },
    });

    // Don't leak whether the user exists; just say not active.
    if (!user) {
      return NextResponse.json({ isActive: false });
    }

    return NextResponse.json({
      isActive: !!user.isActive,
      fullName: user.fullName,
      userId: user.id,
    });
  } catch (error) {
    console.error("[AUTH_CHECK_ACTIVE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

