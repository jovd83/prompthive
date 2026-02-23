
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as PromptsService from "@/services/prompts";

export async function cleanupPromptAssets(promptId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return;
    return PromptsService.cleanupPromptAssetsService(promptId);
}
