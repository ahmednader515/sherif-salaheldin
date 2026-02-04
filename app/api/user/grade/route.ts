import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { grade } = await req.json();

        // Validate grade
        const validGrades = ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"];
        if (grade && !validGrades.includes(grade)) {
            return new NextResponse("Invalid grade", { status: 400 });
        }

        // Update user's grade
        const updatedUser = await db.user.update({
            where: {
                id: session.user.id
            },
            data: {
                grade: grade || null
            }
        });

        return NextResponse.json({ success: true, grade: updatedUser.grade });
    } catch (error) {
        console.error("[USER_GRADE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

