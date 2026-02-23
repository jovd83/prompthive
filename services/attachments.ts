import { prisma } from "@/lib/prisma";
import { deleteFile, uploadFile } from "./files";
import path from "path";

export class PromptAttachmentService {
    static async cleanupPromptAssetsService(promptId: string) {
        const prompt = await prisma.prompt.findUnique({
            where: { id: promptId },
            include: { versions: { include: { attachments: true } } }
        });

        if (!prompt) return;

        const deletionPromises: Promise<void>[] = [];

        for (const version of prompt.versions) {
            for (const att of version.attachments) {
                if (att.filePath) {
                    deletionPromises.push(deleteFile(att.filePath));
                }
            }

            if (version.resultImage) {
                const isAttached = version.attachments.some(a => a.filePath === version.resultImage);
                if (!isAttached) {
                    deletionPromises.push(deleteFile(version.resultImage));
                }
            }
        }

        // Execute deletions in parallel with catch handlers to avoid silent failures cascading
        await Promise.allSettled(deletionPromises);
    }

    // Extracted attachment processing logic from PromptCreate/VersionCreate
    static async processAttachments(
        attachments: File[],
        resultImages: File[],
        keepAttachmentIds: string[] = [],
        keepResultImageIds: string[] = [],
        existingResultImagePath?: string,
        promptId?: string
    ) {
        const savedAttachments: { filePath: string; fileType: string; originalName?: string; role?: string }[] = [];

        // 1. Kept Attachments (if versions)
        if (promptId && keepAttachmentIds.length > 0) {
            const existingAttachments = await prisma.attachment.findMany({
                where: {
                    id: { in: keepAttachmentIds },
                    version: { promptId: promptId },
                },
            });
            for (const att of existingAttachments) {
                savedAttachments.push({
                    filePath: att.filePath,
                    fileType: att.fileType,
                    originalName: att.originalName || undefined,
                });
            }
        }

        // 2. New Attachments
        if (attachments.length > 0) {
            for (const file of attachments) {
                if (file.size > 0) {
                    const uploaded = await uploadFile(file);
                    savedAttachments.push(uploaded);
                }
            }
        }

        // 3. Kept Result Images
        if (promptId && keepResultImageIds.length > 0) {
            const existingResults = await prisma.attachment.findMany({
                where: {
                    id: { in: keepResultImageIds },
                    version: { promptId: promptId },
                    role: "RESULT",
                },
            });

            for (const att of existingResults) {
                savedAttachments.push({
                    filePath: att.filePath,
                    fileType: att.fileType,
                    originalName: att.originalName || undefined,
                    role: "RESULT",
                });
            }
        }

        let primaryResultImagePath = null;
        if (existingResultImagePath) {
            const ext = path.extname(existingResultImagePath).toLowerCase().replace('.', '');
            const fileType = ext ? `image/${ext}` : "image/legacy";

            savedAttachments.push({
                filePath: existingResultImagePath,
                fileType: fileType,
                role: "RESULT",
            });
            primaryResultImagePath = existingResultImagePath;
        }

        // 4. New result images
        if (resultImages.length > 0) {
            for (const file of resultImages) {
                if (file.size > 0) {
                    const uploaded = await uploadFile(file, "result-");
                    savedAttachments.push({
                        ...uploaded,
                        role: "RESULT",
                    });

                    if (!primaryResultImagePath) primaryResultImagePath = uploaded.filePath;
                }
            }
        }

        if (!primaryResultImagePath && keepResultImageIds.length > 0) {
            const firstKept = savedAttachments.find(att => att.role === "RESULT");
            if (firstKept) primaryResultImagePath = firstKept.filePath;
        }

        return { savedAttachments, primaryResultImagePath };
    }
}
