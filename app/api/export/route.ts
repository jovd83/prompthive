import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// Helper to read file and convert to base64
import fs from "fs";
import path from "path";

function getFileAsBase64(urlPath: string | null): { data: string; type: string } | null {
    if (!urlPath) return null;
    try {
        // urlPath is like "/uploads/filename.png"
        // Remove leading slash for join, or join with public
        const relativePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        const fullPath = path.join(process.cwd(), "public", relativePath);

        if (fs.existsSync(fullPath)) {
            const fileBuffer = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath).toLowerCase().substring(1);
            let mimeType = "application/octet-stream";
            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) mimeType = `image/${ext}`;
            if (ext === 'pdf') mimeType = 'application/pdf';
            if (ext === 'txt') mimeType = 'text/plain';

            return {
                data: fileBuffer.toString('base64'),
                type: mimeType
            };
        }
    } catch (e) {
        console.error(`Failed to read file for backup: ${urlPath}`, e);
    }
    return null;
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompts = await prisma.prompt.findMany({
        where: { createdById: session.user.id },
        include: {
            tags: true,
            versions: {
                include: {
                    attachments: true
                },
                orderBy: { versionNumber: "desc" }
            },
            collections: true,
        },
    });

    const exportData = prompts.map((prompt) => {
        return {
            id: prompt.id, // Include ID for potential upsert logic later
            title: prompt.title,
            description: prompt.description,
            tags: prompt.tags.map(t => t.name),
            collections: prompt.collections.map(c => c.title), // Simple export of collection names
            viewCount: prompt.viewCount,
            copyCount: prompt.copyCount,
            createdAt: prompt.createdAt,
            updatedAt: prompt.updatedAt,
            versions: prompt.versions.map(v => ({
                versionNumber: v.versionNumber,
                content: v.content,
                shortContent: v.shortContent,
                usageExample: v.usageExample,
                variableDefinitions: v.variableDefinitions,
                model: v.model,
                changelog: v.changelog,
                resultText: v.resultText,
                // Embed files
                resultImage: v.resultImage ? {
                    path: v.resultImage, // Keep original path reference
                    file: getFileAsBase64(v.resultImage)
                } : null,
                attachments: v.attachments.map(a => ({
                    filePath: a.filePath,
                    fileType: a.fileType,
                    file: getFileAsBase64(a.filePath)
                })),
                createdAt: v.createdAt
            }))
        };
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="prompthive-backup-${new Date().toISOString().split('T')[0]}.json"`,
        },
    });
}
