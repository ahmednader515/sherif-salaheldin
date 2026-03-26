import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: true });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId =
      (typeof body?.sessionId === "string" ? body.sessionId : undefined) ||
      ((session.user as any).sessionId as string | undefined);

    if (!sessionId) {
      return NextResponse.json({ success: true });
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { activeSessionId: true },
    });

    // Only the currently-active session is allowed to clear the active flags.
    if (!dbUser?.activeSessionId || dbUser.activeSessionId !== sessionId) {
      return NextResponse.json({ success: true });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { isActive: false, activeSessionId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AUTH_LOGOUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

