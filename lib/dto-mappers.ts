import { Collection, Prompt, Tag, PromptVersion } from "@prisma/client";
import { CollectionWithCount } from "./collection-utils";
import { PromptWithRelations, TagWithCount } from "@/types/prisma";

export type PromptDTO = {
    id: string;
    title: string;
    description: string | null;
    technicalId: string | null;
    isLocked: boolean;
    isPrivate: boolean;
    resource: string | null;
    currentVersionId: string | null;
    viewCount: number;
    copyCount: number;
    itemType: string;
    repoUrl: string | null;
    installCommand: string | null;
    createdAt: Date;
    updatedAt: Date;
    tags: TagDTO[];
    collections?: { id: string; title: string }[];
    versions?: PromptVersionDTO[];
    isFavorited?: boolean;
    createdById: string;
    createdBy: { email: string; username: string };
    relatedPrompts?: PromptDTO[];
};

export type TagDTO = {
    id: string;
    name: string;
    color: string | null;
};

export type PromptVersionDTO = {
    id: string;
    versionNumber: number;
    content: string;
    shortContent: string | null;
    changelog: string | null;
    createdAt: Date;
    usageExample: string | null;
    variableDefinitions: string | null;
    resultText: string | null;
    resultImage: string | null;
    attachments: { id: string; filePath: string; role: string; fileType?: string }[];
    agentUsage: string | null;
    agentSkillIds: string | null;
    createdBy: { id: string; username: string | null; email: string | null } | null;
};

export type CollectionDTO = {
    id: string;
    title: string;
    parentId: string | null;
    createdAt: Date;
    totalPrompts: number;
};

/**
 * Maps a Prisma Prompt (with relations) to a clean DTO for the client.
 * This prevents leaking sensitive or internal fields and trims over-fetched data.
 */
export function mapPromptToDTO(prompt: PromptWithRelations): PromptDTO {
    return {
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        technicalId: prompt.technicalId || null,
        isLocked: prompt.isLocked || false,
        isPrivate: prompt.isPrivate || false,
        resource: (prompt as any).resource || null,
        currentVersionId: prompt.currentVersionId || null,
        viewCount: prompt.viewCount || 0,
        copyCount: prompt.copyCount || 0,
        itemType: (prompt as any).itemType || "PROMPT",
        repoUrl: (prompt as any).repoUrl || null,
        installCommand: (prompt as any).installCommand || null,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
        isFavorited: prompt.isFavorited,
        tags: prompt.tags.map(t => ({
            id: t.id,
            name: t.name,
            color: t.color
        })),
        versions: prompt.versions?.map(v => ({
            id: v.id,
            versionNumber: v.versionNumber,
            content: v.content,
            shortContent: v.shortContent,
            changelog: v.changelog,
            createdAt: v.createdAt,
            usageExample: v.usageExample,
            variableDefinitions: v.variableDefinitions,
            resultText: v.resultText,
            resultImage: v.resultImage,
            attachments: v.attachments?.map(a => ({
                id: a.id,
                filePath: a.filePath,
                role: a.role,
                fileType: a.fileType
            })) || [],
            agentUsage: (v as any).agentUsage || null,
            agentSkillIds: (v as any).agentSkillIds || null,
            createdBy: (v as any).createdBy ? {
                id: (v as any).createdBy.id,
                username: (v as any).createdBy.username,
                email: (v as any).createdBy.email
            } : null
        })),
        createdById: prompt.createdById,
        createdBy: {
            email: prompt.createdBy.email,
            username: prompt.createdBy.username
        },
        relatedPrompts: prompt.relatedPrompts?.map(rp => ({
            id: rp.id,
            title: rp.title,
            technicalId: rp.technicalId || null,
            // Minimal DTO for related
        } as any))
    };
}

/**
 * Maps a Collection (with count) to a clean DTO.
 */
export function mapCollectionToDTO(collection: CollectionWithCount): CollectionDTO {
    return {
        id: collection.id,
        title: collection.title,
        parentId: collection.parentId,
        createdAt: new Date(collection.createdAt),
        totalPrompts: collection.totalPrompts || 0
    };
}
