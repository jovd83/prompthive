
"use server";
// Force recompile

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import * as PromptsService from "@/services/prompts";
import { CreatePromptSchema, CreateVersionSchema } from "@/lib/validations";
import { Routes, AuthCallbackUrls } from "@/lib/routes";


export async function createTag(name: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const tag = await PromptsService.createTagService(name);
    revalidatePath(Routes.HOME);
    return tag;
}

export async function createPrompt(formData: FormData) {
    console.log("SERVER ACTION: createPrompt called");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) redirect(AuthCallbackUrls.LOGIN_CALLBACK);

    const rawData = {
        title: formData.get("title") ?? undefined,
        description: formData.get("description") ?? undefined,
        content: formData.get("content") ?? undefined,
        shortContent: formData.get("shortContent") ?? undefined,
        usageExample: formData.get("usageExample") ?? undefined,
        variableDefinitions: formData.get("variableDefinitions") ?? undefined,
        collectionId: formData.get("collectionId") ?? undefined,
        resultText: formData.get("resultText") ?? undefined,
        resource: formData.get("resource") ?? undefined,
        tagIds: formData.getAll("tagIds"),
    };

    const result = CreatePromptSchema.safeParse(rawData);

    if (!result.success) {
        console.error("Validation Error:", result.error);
        if (result.error instanceof Error) {
            throw new Error("Invalid input data: " + result.error.message);
        }
        throw new Error("Invalid input data");
    }

    const data: PromptsService.CreatePromptInput = {
        title: result.data.title,
        description: result.data.description || "",
        content: result.data.content,
        shortContent: result.data.shortContent || "",
        usageExample: result.data.usageExample || "",
        variableDefinitions: result.data.variableDefinitions || "",
        collectionId: result.data.collectionId || "",
        tagIds: (result.data.tagIds || []) as string[],
        resultText: result.data.resultText || "",
        resource: result.data.resource,
    };

    const attachments = formData.getAll("attachments") as File[];
    const resultImages = formData.getAll("resultImages") as File[];

    const prompt = await PromptsService.createPromptService(userId, data, attachments, resultImages);

    revalidatePath(Routes.HOME);
    redirect(`${Routes.PROMPTS}/${prompt.id}`);
}

export async function createVersion(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) redirect(AuthCallbackUrls.LOGIN_CALLBACK);

    const rawData = {
        promptId: formData.get("promptId") ?? undefined,
        title: formData.get("title") ?? undefined,
        content: formData.get("content") ?? undefined,
        shortContent: formData.get("shortContent") ?? undefined,
        usageExample: formData.get("usageExample") ?? undefined,
        variableDefinitions: formData.get("variableDefinitions") ?? undefined,
        changelog: formData.get("changelog") ?? undefined,
        resultText: formData.get("resultText") ?? undefined,
        collectionId: formData.get("collectionId") ?? undefined,
        description: formData.get("description") ?? undefined,
        resource: formData.get("resource") ?? undefined,
        tagIds: formData.getAll("tagIds"),
        existingResultImagePath: formData.get("existingResultImagePath") ?? undefined,
        keepAttachmentIds: formData.getAll("keepAttachmentIds"),
        keepResultImageIds: formData.getAll("keepResultImageIds"),
    };

    const result = CreateVersionSchema.safeParse(rawData);

    if (!result.success) {
        if (result.error instanceof Error) {
            throw new Error("Invalid input: " + result.error.message);
        }
        throw new Error("Invalid input");
    }

    const data: PromptsService.CreateVersionInput = {
        promptId: result.data.promptId,
        title: result.data.title || "",
        content: result.data.content,
        shortContent: result.data.shortContent || "",
        usageExample: result.data.usageExample || "",
        variableDefinitions: result.data.variableDefinitions || "",
        changelog: result.data.changelog || "",
        resultText: result.data.resultText || "",
        collectionId: result.data.collectionId || "",
        description: result.data.description,
        resource: result.data.resource,
        tagIds: result.data.tagIds,
        keepAttachmentIds: (result.data.keepAttachmentIds || []) as string[],
        keepResultImageIds: (result.data.keepResultImageIds || []) as string[],
        existingResultImagePath: result.data.existingResultImagePath || "",
    };

    const attachments = formData.getAll("attachments") as File[];
    const resultImages = formData.getAll("resultImages") as File[];

    await PromptsService.createVersionService(userId, data, attachments, resultImages);

    revalidatePath(Routes.HOME);
    revalidatePath(`${Routes.PROMPTS}/${data.promptId}`);
    redirect(`${Routes.PROMPTS}/${data.promptId}`);
}



export async function restorePromptVersion(promptId: string, versionId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await PromptsService.restoreVersionService(session.user.id, promptId, versionId);

    revalidatePath(Routes.HOME);
    revalidatePath(`${Routes.PROMPTS}/${promptId}`);
    redirect(`${Routes.PROMPTS}/${promptId}`);
}

export async function deletePrompt(promptId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await PromptsService.deletePromptService(session.user.id, promptId);

    revalidatePath(Routes.HOME);
    revalidatePath(Routes.COLLECTIONS);
}

export async function deleteUnusedTags() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    return PromptsService.deleteUnusedTagsService();
}

export async function cleanupPromptAssets(promptId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return;
    return PromptsService.cleanupPromptAssetsService(promptId);
}

export async function movePrompt(promptId: string, collectionId: string | null) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await PromptsService.movePromptService(session.user.id, promptId, collectionId);

    revalidatePath(Routes.HOME);
    revalidatePath(Routes.COLLECTIONS);
}

export async function bulkMovePrompts(promptIds: string[], collectionId: string | null) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await PromptsService.bulkMovePromptsService(session.user.id, promptIds, collectionId);

    revalidatePath(Routes.HOME);
    revalidatePath(Routes.COLLECTIONS);
}

export async function bulkAddTags(promptIds: string[], tagIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await PromptsService.bulkAddTagsService(session.user.id, promptIds, tagIds);

    revalidatePath(Routes.HOME);
    revalidatePath(Routes.COLLECTIONS);
}

export async function toggleLock(promptId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await PromptsService.toggleLockService(session.user.id, promptId);

    revalidatePath(`${Routes.PROMPTS}/${promptId}`);
}
