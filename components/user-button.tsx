"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";

export const UserButton = () => {
  const { data: session } = useSession();
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isGradeDialogOpen && session?.user?.id) {
      fetchUserGrade();
    }
  }, [isGradeDialogOpen, session?.user?.id]);

  const fetchUserGrade = async () => {
    try {
      const response = await axios.get("/api/user/profile");
      if (response.data.grade) {
        setCurrentGrade(response.data.grade);
        setSelectedGrade(response.data.grade);
      }
    } catch (error) {
      console.error("Error fetching user grade:", error);
    }
  };

  const handleGradeUpdate = async () => {
    if (!selectedGrade) {
      toast.error("يرجى اختيار الصف الدراسي");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.patch("/api/user/grade", { grade: selectedGrade });
      if (response.data.success) {
        toast.success("تم تحديث الصف الدراسي بنجاح");
        setCurrentGrade(selectedGrade);
        setIsGradeDialogOpen(false);
        // Refresh the page to update course filters
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("حدث خطأ في تحديث الصف الدراسي");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage src={session.user.image || ""} />
            <AvatarFallback>
              {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsGradeDialogOpen(true)}
            className="cursor-pointer"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            تغيير الصف الدراسي
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut()}
            className="text-red-600 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير الصف الدراسي</DialogTitle>
            <DialogDescription>
              اختر الصف الدراسي الحالي الخاص بك
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الصف الدراسي</label>
              <Select
                value={selectedGrade}
                onValueChange={setSelectedGrade}
                disabled={isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="اختر الصف الدراسي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الصف الأول الثانوي">الصف الأول الثانوي</SelectItem>
                  <SelectItem value="الصف الثاني الثانوي">الصف الثاني الثانوي</SelectItem>
                  <SelectItem value="الصف الثالث الثانوي">الصف الثالث الثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentGrade && (
              <p className="text-sm text-muted-foreground">
                الصف الدراسي الحالي: {currentGrade}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsGradeDialogOpen(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleGradeUpdate}
                disabled={isLoading || !selectedGrade}
                className="bg-brand hover:bg-brand/90 text-white"
              >
                {isLoading ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 