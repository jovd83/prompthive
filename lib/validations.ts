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
});

export const CollectionSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
});

export const ImportSchema = z.any();
