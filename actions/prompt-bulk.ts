
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as PromptsService from "@/services/prompts";
import { Routes } from "@/lib/routes";

export async function movePrompt(promptId: string, collectionId: string | null) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    await PromptsService.movePromptService(session.user.id, promptId, collectionId);

    revalidatePath(Routes.HOME);
    revalidatePath(Routes.COLLECTIONS);
}

export async function bulkMovePrompts(promptIds: string[], collectionId: string | null) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    await PromptsService.bulkMovePromptsService(session.user.id, promptIds, collectionId);

    revalidatePath(Routes.HOME);
    revalidatePath(Routes.COLLECTIONS);
}

export async function bulkAddTags(promptIds: string[], tagIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    await PromptsService.bulkAddTagsService(session.user.id, promptIds, tagIds);

    revalidatePath(Routes.HOME);
    revalidatePath(Routes.COLLECTIONS);
}

export async function bulkDeletePrompts(promptIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    const result = await PromptsService.bulkDeletePromptsService(session.user.id, promptIds);
    return { success: true, count: result.count };
}
