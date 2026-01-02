"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as ImportService from "@/services/imports";
import { ImportSchema } from "@/lib/validations";

export async function importPrompts(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file uploaded" };

    let text;
    try {
        text = await file.text();
    } catch (e: any) {
        return { success: false, error: `Failed to read file: ${e.message}` };
    }

    // Strip BOM and whitespace
    text = text.trim();
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }

    // Safer Parse
    let data;
    try {
        data = JSON.parse(text);
    } catch (e: any) {
        // Attempt to fix common formatting issues (like missing commas between objects)
        try {
            const fixedText = text.replace(/}(\s*){/g, "},$1{");
            data = JSON.parse(fixedText);
            console.warn("JSON Import: Successfully repaired malformed JSON (missing commas).");
        } catch (repairError) {
            console.error("JSON Parse Error. Snippet:", text.substring(0, 100));
            // Return error instead of throwing
            return {
                success: false,
                error: `Invalid format: Not a JSON file. Please check for syntax errors (e.g. missing commas). Error: ${e.message}`
            };
        }
    }

    const validation = ImportSchema.safeParse(data);
    if (!validation.success) {
        console.error("Validation Error:", validation.error);
        return { success: false, error: "Invalid data format: The JSON does not match the expected schema." };
    }

    try {
        const result = await ImportService.importUnifiedService(session.user.id, validation.data);
        revalidatePath("/");
        return { success: true, count: result.count, skipped: result.skipped };
    } catch (e: any) {
        console.error("Import Service Error:", e);
        return { success: false, error: `Import failed: ${e.message}` };
    }
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
