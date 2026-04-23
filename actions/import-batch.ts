"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importUnifiedService, importStructureService, resolveAgentSkillLinksService } from "@/services/imports";

import { revalidatePath } from "next/cache";

export async function importStructureAction(definedCollections: any[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    try {
        const idMap = await importStructureService(session.user.id, definedCollections);
        revalidatePath("/");
        revalidatePath("/collections");
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
        revalidatePath("/");
        revalidatePath("/collections");
        return {
            success: true,
            count: result.count,
            skipped: result.skipped,
            pendingSkillUpdates: result.pendingSkillUpdates || []
        };
    } catch (e: any) {
        console.error("Batch Import Error:", e);
        return { success: false, error: `Batch failed: ${e.message}` };
    }
}

/**
 * Resolve agent skill links AFTER all import batches have completed.
 * Called once with the full ID-to-title map from the original file.
 */
export async function resolveSkillLinksAction(
    pendingUpdates: { versionId: string, originalSkillIds: string[] }[],
    idToTitleMap: Record<string, string>
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const result = await resolveAgentSkillLinksService(pendingUpdates, idToTitleMap);
        revalidatePath("/");
        return { success: true, resolved: result.resolved, failed: result.failed };
    } catch (e: any) {
        console.error("Skill Link Resolution Error:", e);
        return { success: false, error: `Resolution failed: ${e.message}` };
    }
}
