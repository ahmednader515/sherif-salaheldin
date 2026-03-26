import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phoneNumber = String(body?.phoneNumber || "").trim();
    const password = String(body?.password || "");

    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: "Missing phoneNumber or password" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { phoneNumber },
      select: { id: true, hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      // Don't reveal details
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        activeSessionId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AUTH_FORCE_LOGOUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

