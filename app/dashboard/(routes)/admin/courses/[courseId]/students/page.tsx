import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminCourseStudentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { userId, user } = await auth();

  if (!userId) return redirect("/");

  if (user?.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, userId: true },
  });

  if (!course) return redirect("/dashboard/admin/courses");

  const purchases = await db.purchase.findMany({
    where: {
      courseId,
      status: "ACTIVE",
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          parentPhoneNumber: true,
          grade: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">طلاب كورس: {course.title}</h1>
          <p className="text-sm text-muted-foreground">
            إجمالي المشترين: <span className="font-medium">{purchases.length}</span>
          </p>
        </div>

        <Link href={`/dashboard/admin/courses`}>
          <Button variant="outline">رجوع</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">رقم الهاتف</TableHead>
              <TableHead className="text-right">رقم هاتف الوالد</TableHead>
              <TableHead className="text-right">الصف</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  لا يوجد طلاب اشتروا هذا الكورس بعد.
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.user.fullName}</TableCell>
                  <TableCell>{p.user.phoneNumber}</TableCell>
                  <TableCell>{p.user.parentPhoneNumber}</TableCell>
                  <TableCell>{p.user.grade || "-"}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-600 text-white hover:bg-green-700">نشط</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

