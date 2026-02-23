
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TagService } from "@/services/tags";

export async function createTag(name: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    const tag = await TagService.createTagService(name);
    return tag;
}

export async function deleteUnusedTags() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");
    return TagService.deleteUnusedTagsService();
}
