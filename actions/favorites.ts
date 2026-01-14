"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import * as FavoritesService from "@/services/favorites";

export async function toggleFavorite(promptId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if ((session.user as any).role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    // Verify user exists in DB (handles stale sessions after DB reset)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
    });

    if (!user) {
        throw new Error("Session invalid. Please sign out and sign in again.");
    }

    const result = await FavoritesService.toggleFavoriteService(session.user.id, promptId);

    // Revalidate relevant paths
    revalidatePath("/");
    revalidatePath(`/prompts/${promptId}`);
    revalidatePath("/favorites");

    return result;
}

export async function getFavorites(query?: string, sort?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    return FavoritesService.getFavoritesService(session.user.id, query, sort);
}
