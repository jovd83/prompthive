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
    existingResultImagePath: z.string().optional(),
    resource: z.string().optional(),
    isPrivate: z.boolean().optional(),
});

export const CollectionSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
});

// Import Schema (Unified)
const ImportVersionSchema = z.object({
    content: z.string().optional(),
    shortContent: z.string().optional(),
    longContent: z.string().optional(), // Legacy support
    usageExample: z.string().optional(),
    variableDefinitions: z.union([z.string(), z.array(z.any())]).optional(),
    versionNumber: z.number().optional(),
    resultText: z.string().optional(),
    resultImage: z.union([
        z.string(),
        z.object({
            path: z.string(),
            file: z.object({ data: z.string().optional() }).optional()
        })
    ]).optional(),
    changelog: z.string().optional(),
    attachments: z.array(z.any()).optional(), // Hard to strict type binary file inputs here
});

export const ImportItemSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(), // Flat format
    description: z.string().optional(),
    // Backward comp: allow non-array if normalized later, or mixed types
    tags: z.union([z.string(), z.array(z.any())]).optional(),
    collections: z.union([z.string(), z.array(z.any())]).optional(),
    collection: z.string().optional(), // Legacy
    collectionIds: z.array(z.string()).optional(), // V2
    technicalId: z.string().optional(),
    versions: z.array(z.any()).optional(), // Relaxed version schema entirely for import to avoid deep failures
    relatedPrompts: z.array(z.string()).optional(),
    // PromptCat specific
    categories: z.union([z.string(), z.array(z.string())]).optional(),
    category: z.string().optional(),
    folderId: z.string().optional(),
    // Allow pass-through of other legacy fields
}).passthrough();

export const ImportSchema = z.union([
    z.array(ImportItemSchema), // Array of prompts
    z.object({ // Unified object or PromptCat object
        prompts: z.array(ImportItemSchema).optional(),
        folders: z.array(z.object({ id: z.string(), name: z.string() })).optional()
    }).passthrough()
]);
