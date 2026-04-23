
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as PromptsService from "@/services/prompts";
import { Routes } from "@/lib/routes";

export async function linkPrompts(promptIdA: string, promptIdB: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    await PromptsService.linkPromptsService(session.user.id, promptIdA, promptIdB);
    revalidatePath(`${Routes.PROMPTS}/${promptIdA}`);
    revalidatePath(`${Routes.PROMPTS}/${promptIdB}`);
}

export async function unlinkPrompts(promptIdA: string, promptIdB: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    await PromptsService.unlinkPromptsService(session.user.id, promptIdA, promptIdB);
    revalidatePath(`${Routes.PROMPTS}/${promptIdA}`);
    revalidatePath(`${Routes.PROMPTS}/${promptIdB}`);
}

export async function searchCandidatePrompts(query: string, excludeId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    return PromptsService.searchPromptsForLinkingService(session.user.id, query, excludeId);
}
