import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const sessionId = (session.user as any).sessionId as string | undefined;

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true, activeSessionId: true },
    });

    const valid =
      !!dbUser?.isActive &&
      !!dbUser.activeSessionId &&
      !!sessionId &&
      dbUser.activeSessionId === sessionId;

    if (!valid) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("[AUTH_VALIDATE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

