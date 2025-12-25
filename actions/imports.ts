"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as ImportService from "@/services/imports";
import { ImportSchema } from "@/lib/validations";

export async function importPrompts(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const text = await file.text();

    // Safer Parse
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Invalid format: Not a JSON file");
    }

    const validation = ImportSchema.safeParse(data);
    if (!validation.success) throw new Error("Invalid data format");

    const result = await ImportService.importUnifiedService(session.user.id, validation.data);

    revalidatePath("/");
    redirect(`/?importedCount=${result.count}&skippedCount=${result.skipped}`);
}



export async function importLocalFolderAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const path = formData.get("path") as string;
    const targetCollectionId = formData.get("targetCollectionId") as string | undefined;

    if (!path) return { success: false, error: "Path is required" };

    try {
        const { importLocalFolder } = await import("@/services/importer");
        const count = await importLocalFolder(path, session.user.id, targetCollectionId);

        revalidatePath("/");
        revalidatePath("/collections");

        return { success: true, count };
    } catch (e: any) {
        console.error("Local Import Error:", e);
        return { success: false, error: e.message };
    }
}
