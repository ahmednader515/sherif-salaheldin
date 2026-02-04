"use client"

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface GradeFormProps {
    initialData: Course;
    courseId: string;
}

const formSchema = z.object({
    grade: z.string().optional(),
});

export const GradeForm = ({
    initialData,
    courseId
}: GradeFormProps) => {

    const [isEditing, setIsEditing] = useState(false);

    const toggleEdit = () => setIsEditing((current) => !current);

    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            grade: initialData?.grade ?? "",
        }
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await axios.patch(`/api/courses/${courseId}`, values);
            toast.success("تم تحديث الكورس");
            toggleEdit();
            router.refresh();
        } catch {
            toast.error("حدث خطأ");
        }
    }

    return (
        <div className="mt-6 border bg-card rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                الصف الدراسي
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing && (<>إلغاء</>)}
                    {!isEditing && (
                    <>
                        <Pencil className="h-4 w-4 mr-2" />
                        تعديل الصف الدراسي
                    </>)}
                </Button>
            </div>
            {!isEditing && (
                <p className={cn(
                    "text-sm mt-2 text-muted-foreground",
                    !initialData.grade && "text-muted-foreground italic"
                )}>
                    {initialData.grade || "لم يتم تحديد الصف الدراسي"}
                </p>
            )}

            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField 
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={field.onChange}
                                            disabled={isSubmitting}
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
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-x-2">
                            <Button disabled={isSubmitting} type="submit">
                                حفظ
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    )
}

