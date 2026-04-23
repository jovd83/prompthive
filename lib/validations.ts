import { z } from "zod";

export const CreateTagSchema = z.object({
    name: z.string().min(1, "Tag name is required").max(50),
});

export const CreatePromptSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    shortContent: z.string().optional(),
    usageExample: z.string().optional(),
    variableDefinitions: z.string().optional().refine((val) => {
        if (!val) return true;
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, "Invalid JSON for variable definitions"),
    collectionId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    resultText: z.string().optional(),
    resource: z.string().optional(),
    isPrivate: z.boolean().optional(),
    agentUsage: z.string().optional(),
    agentSkillIds: z.string().optional(),
});

export const CreateVersionSchema = z.object({
    promptId: z.string().min(1),
    title: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    shortContent: z.string().optional(),
    usageExample: z.string().optional(),
    variableDefinitions: z.string().optional(),
    changelog: z.string().optional(),
    resultText: z.string().optional(),
    collectionId: z.string().optional(),
    description: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    keepAttachmentIds: z.array(z.string()).optional(),
    keepResultImageIds: z.array(z.string()).optional(),
    existingResultImagePath: z.string().optional(),
    resource: z.string().optional(),
    isPrivate: z.boolean().optional(),
    agentUsage: z.string().optional(),
    agentSkillIds: z.string().optional(),
});

export const CollectionSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
});

// Import Schema (Unified)
const ImportVersionSchema = z.object({
    content: z.string().optional().nullable(),
    shortContent: z.string().optional().nullable(),
    longContent: z.string().optional().nullable(), // Legacy support
    usageExample: z.string().optional().nullable(),
    variableDefinitions: z.union([z.string(), z.array(z.any())]).optional().nullable(),
    versionNumber: z.number().optional().nullable(),
    resultText: z.string().optional().nullable(),
    resultImage: z.union([
        z.string(),
        z.object({
            path: z.string(),
            file: z.object({ data: z.string().optional().nullable(), type: z.string().optional().nullable() }).optional().nullable()
        })
    ]).optional().nullable(),
    changelog: z.string().optional().nullable(),
    attachments: z.array(z.any()).optional().nullable(), // Hard to strict type binary file inputs here
    agentUsage: z.string().optional().nullable(),
    agentSkillIds: z.union([z.string(), z.array(z.any())]).optional().nullable(),
});

export const ImportItemSchema = z.object({
    id: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    content: z.string().optional().nullable(), // Flat format
    description: z.string().optional().nullable(),
    // Backward comp: allow non-array if normalized later, or mixed types
    tags: z.union([z.string(), z.array(z.any())]).optional().nullable(),
    collections: z.union([z.string(), z.array(z.any())]).optional().nullable(),
    collection: z.string().optional().nullable(), // Legacy
    collectionIds: z.array(z.string()).optional().nullable(), // V2
    technicalId: z.string().optional().nullable(),
    versions: z.array(z.any()).optional().nullable(), // Relaxed version schema entirely for import to avoid deep failures
    relatedPrompts: z.array(z.string()).optional().nullable(),
    // PromptCat specific
    categories: z.union([z.string(), z.array(z.string())]).optional().nullable(),
    category: z.string().optional().nullable(),
    folderId: z.string().optional().nullable(),
    itemType: z.string().optional().nullable(),
    repoUrl: z.string().optional().nullable(),
    installCommand: z.string().optional().nullable(),
    agentUsage: z.string().optional().nullable(),
    agentSkillIds: z.union([z.string(), z.array(z.any())]).optional().nullable(),
    // Allow pass-through of other legacy fields
}).passthrough();

export const ImportSchema = z.union([
    z.array(ImportItemSchema), // Array of prompts
    z.object({ // Unified object or PromptCat object
        prompts: z.array(ImportItemSchema).optional(),
        folders: z.array(z.object({ id: z.string(), name: z.string() })).optional()
    }).passthrough()
]);
