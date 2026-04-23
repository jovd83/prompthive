"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import * as PromptsService from "@/services/prompts";
import { Routes, AuthCallbackUrls } from "@/lib/routes";

export async function createSkill(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    const userId = session.user.id;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) redirect(AuthCallbackUrls.LOGIN_CALLBACK);

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const repoUrl = formData.get("repoUrl") as string;
    const url = formData.get("url") as string;
    const installCommand = formData.get("installCommand") as string;
    const collectionId = formData.get("collectionId") as string;
    const tagIds = formData.getAll("tagIds") as string[];
    const agentUsage = formData.get("agentUsage") as string;
    const agentSkillIds = formData.get("agentSkillIds") as string;

    if (!title || (!repoUrl && !url)) {
        throw new Error("Title and either Repository URL or URL are required.");
    }

    const effectiveRepoUrl = repoUrl || url;
    const skillNameMatch = effectiveRepoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
    const skillName = skillNameMatch ? skillNameMatch[1].replace(/\.git$/, '').replace(/\/$/, '') : title;

    const data: PromptsService.CreatePromptInput = {
        title: title,
        description: description || "",
        content: `Do the following task by making use of the ${skillName} skill:\n\n`,
        shortContent: "",
        usageExample: "",
        variableDefinitions: "[]",
        collectionId: collectionId || "",
        tagIds: tagIds || [],
        resultText: "",
        resource: effectiveRepoUrl,
        isPrivate: false,
        itemType: "AGENT_SKILL",
        repoUrl: repoUrl || url,
        url: url || repoUrl,
        installCommand: installCommand,
        agentUsage: agentUsage || "",
        agentSkillIds: agentSkillIds || "[]",
    };

    const prompt = await PromptsService.createPromptService(userId, data, [], []);

    revalidatePath(Routes.HOME);

    const destination = `${Routes.PROMPTS}/${prompt.id}` + (data.collectionId ? `?expandedCollectionId=${data.collectionId}` : "");
    redirect(destination);
}

export async function updateSkill(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    const userId = session.user.id;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) redirect(AuthCallbackUrls.LOGIN_CALLBACK);

    const skillId = formData.get("skillId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const repoUrl = formData.get("repoUrl") as string;
    const url = formData.get("url") as string;
    const installCommand = formData.get("installCommand") as string;
    const collectionId = formData.get("collectionId") as string;
    const tagIds = formData.getAll("tagIds") as string[];
    const agentUsage = formData.get("agentUsage") as string;
    const agentSkillIds = formData.get("agentSkillIds") as string;

    if (!skillId || !title || (!repoUrl && !url)) {
        throw new Error("ID, Title, and either Repository URL or URL are required.");
    }

    const effectiveRepoUrl = repoUrl || url;
    const skillNameMatch = effectiveRepoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
    const skillName = skillNameMatch ? skillNameMatch[1].replace(/\.git$/, '').replace(/\/$/, '') : title;

    const data: PromptsService.CreateVersionInput = {
        promptId: skillId,
        title: title,
        description: description || "",
        content: `Do the following task by making use of the ${skillName} skill:\n\n`,
        shortContent: "",
        usageExample: "",
        variableDefinitions: "[]",
        changelog: "Updated Agent Skill information",
        collectionId: collectionId || "",
        tagIds: tagIds || [],
        resultText: "",
        resource: effectiveRepoUrl,
        isPrivate: false,
        itemType: "AGENT_SKILL",
        repoUrl: repoUrl || url,
        url: url || repoUrl,
        installCommand: installCommand,
        agentUsage: agentUsage || "",
        agentSkillIds: agentSkillIds || "[]",
        keepAttachmentIds: [],
        keepResultImageIds: [],
    };

    await PromptsService.createVersionService(userId, data, [], []);

    revalidatePath(Routes.HOME);
    revalidatePath(`${Routes.PROMPTS}/${skillId}`);

    const destination = `${Routes.PROMPTS}/${skillId}` + (data.collectionId ? `?expandedCollectionId=${data.collectionId}` : "");
    redirect(destination);
}

export async function importGroupSkills(urls: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.role === 'GUEST') throw new Error("Unauthorized: Guest account is read-only.");

    const userId = session.user.id;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) throw new Error("User not found");

    // filter valid GitHub URLs
    const validUrls = urls
        .map(u => u.trim())
        .filter(u => u && u.match(/github\.com\/([^\/]+)\/([^\/]+)/));

    if (validUrls.length === 0) {
        throw new Error("No valid GitHub repository URLs provided.");
    }

    // Date formatted as YYYYMMDD
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const collectionTitle = `${dateStr}_Skillimport`;

    // Create the new collection
    const collection = await prisma.collection.create({
        data: {
            title: collectionTitle,
            ownerId: userId,
            description: "Automatically imported skills"
        }
    });

    let successCount = 0;
    const errors: string[] = [];

    // Import each URL
    for (const repoUrl of validUrls) {
        try {
            const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) continue;

            const owner = match[1];
            // Remove any trailing .git or slashes from the repo name
            const repo = match[2].replace(/\.git$/, '').replace(/\/$/, '');

            let title = repo;
            let description = "";
            let installCommand = `npx skills add ${owner}/${repo}`;

            // Try to fetch from github API
            try {
                const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                    headers: { "User-Agent": "PromptHive" }
                });
                if (repoRes.ok) {
                    const repoData = await repoRes.json();
                    title = repoData.name || title;
                    description = repoData.description || "";
                }
            } catch (e) {
                // ignore fetch errors, just use defaults
            }

            const skillNameMatch = repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
            const skillName = skillNameMatch ? skillNameMatch[1].replace(/\.git$/, '').replace(/\/$/, '') : title;

            const data: PromptsService.CreatePromptInput = {
                title: title,
                description: description || "Imported Agent Skill",
                content: `Do the following task by making use of the ${skillName} skill:\n\n`,
                shortContent: "",
                usageExample: "",
                variableDefinitions: "[]",
                collectionId: collection.id,
                tagIds: [],
                resultText: "",
                resource: repoUrl,
                isPrivate: false,
                itemType: "AGENT_SKILL",
                repoUrl: repoUrl,
                url: repoUrl,
                installCommand: installCommand,
            };

            await PromptsService.createPromptService(userId, data, [], []);
            successCount++;
        } catch (e: any) {
            errors.push(`Failed to import ${repoUrl}: ${e.message}`);
        }
    }

    revalidatePath(Routes.HOME);
    revalidatePath("/collections");

    return { success: true, count: successCount, errors, collectionId: collection.id };
}
