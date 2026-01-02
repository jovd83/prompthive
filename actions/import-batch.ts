"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importUnifiedService, importStructureService } from "@/services/imports";

export async function importStructureAction(definedCollections: any[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    try {
        const idMap = await importStructureService(session.user.id, definedCollections);
        return { success: true, idMap };
    } catch (e: any) {
        console.error("Structure Import Error:", e);
        return { success: false, error: e.message };
    }
}

export async function importBatchAction(data: any[], collectionIdMap?: Record<string, string>) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const result = await importUnifiedService(session.user.id, data, collectionIdMap);
        return { success: true, count: result.count, skipped: result.skipped };
    } catch (e: any) {
        console.error("Batch Import Error:", e);
        return { success: false, error: `Batch failed: ${e.message}` };
    }
}
