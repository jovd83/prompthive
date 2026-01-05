"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as CollectionsService from "@/services/collections";
import { CollectionSchema } from "@/lib/validations";

export type ActionState = {
    message?: string;
    errors?: {
        title?: string[];
        description?: string[];
        parentId?: string[];
    };
};

export async function createCollection(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { message: "Unauthorized" };

    const rawData = {
        title: formData.get("title") ?? undefined,
        description: formData.get("description") ?? undefined,
        parentId: formData.get("parentId") ?? undefined,
    };

    const result = CollectionSchema.safeParse(rawData);
    if (!result.success) {
        return {
            message: "Invalid input",
            errors: result.error.flatten().fieldErrors as any,
        };
    }

    const { title, description, parentId } = result.data;

    try {
        await CollectionsService.createCollectionService(session.user.id, title, description || "", parentId || null);
    } catch (e: any) {
        return { message: e.message };
    }

    revalidatePath("/collections");
    revalidatePath("/collections");
    revalidatePath("/", "layout");
    revalidatePath("/prompts/new");
    if (parentId) {
        revalidatePath(`/collections/${parentId}`);
        redirect(`/collections/${parentId}`);
    }
    redirect("/collections");
}

export async function moveCollection(collectionId: string, newParentId: string | null) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await CollectionsService.moveCollectionService(session.user.id, collectionId, newParentId);

    revalidatePath("/");
    revalidatePath("/collections");
}

export async function updateCollectionName(collectionId: string, newName: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Minimal validation inline or add to schema
    if (!newName.trim()) throw new Error("Name cannot be empty");

    await CollectionsService.updateCollectionNameService(session.user.id, collectionId, newName);

    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);
    return { success: true };
}

export async function updateCollectionDetails(collectionId: string, title: string, description: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    if (!title.trim()) throw new Error("Name cannot be empty");

    await CollectionsService.updateCollectionDetailsService(session.user.id, collectionId, title, description || null);

    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);
    return { success: true };
}

export async function deleteCollection(collectionId: string, deletePrompts: boolean = false) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const parentId = await CollectionsService.deleteCollectionService(session.user.id, collectionId, deletePrompts);

    revalidatePath("/collections");
    if (parentId) {
        revalidatePath(`/collections/${parentId}`);
    }
}

export async function emptyCollection(collectionId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await CollectionsService.emptyCollectionService(session.user.id, collectionId);

    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/collections");
}
