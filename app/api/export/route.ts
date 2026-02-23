import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// Helper to read file and convert to base64
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

async function getFileAsBase64(urlPath: string | null): Promise<{ data: string; type: string } | null> {
    if (!urlPath) return null;
    try {
        // urlPath is like "/uploads/filename.png"
        // Remove leading slash for join, or join with public
        const relativePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        const fullPath = path.join(process.cwd(), "public", relativePath);

        if (existsSync(fullPath)) {
            const fileBuffer = await fs.readFile(fullPath);
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

    const stream = iteratorToStream(generateExportStream(prompts));

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="TMT-backup-${new Date().toISOString().split('T')[0]}.json"`,
        },
    });
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { collectionIds } = body;

    const where: any = { createdById: session.user.id };
    if (collectionIds && Array.isArray(collectionIds) && collectionIds.length > 0) {
        where.collections = { some: { id: { in: collectionIds } } };
    }

    const prompts = await prisma.prompt.findMany({
        where,
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

    const stream = iteratorToStream(generateExportStream(prompts));

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="TMT-backup-${new Date().toISOString().split('T')[0]}.json"`,
        },
    });
}

async function* generateExportStream(prompts: any[]) {
    const encoder = new TextEncoder();
    yield encoder.encode("[\n");
    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const versions = [];
        for (const v of prompt.versions) {
            const attachments = [];
            for (const a of v.attachments) {
                attachments.push({
                    filePath: a.filePath,
                    fileType: a.fileType,
                    file: await getFileAsBase64(a.filePath)
                });
            }

            versions.push({
                versionNumber: v.versionNumber,
                content: v.content,
                shortContent: v.shortContent,
                usageExample: v.usageExample,
                variableDefinitions: v.variableDefinitions,
                model: v.model,
                changelog: v.changelog,
                resultText: v.resultText,
                resultImage: v.resultImage ? {
                    path: v.resultImage,
                    file: await getFileAsBase64(v.resultImage)
                } : null,
                attachments,
                createdAt: v.createdAt
            });
        }

        const exportItem = {
            id: prompt.id,
            title: prompt.title,
            description: prompt.description,
            tags: prompt.tags.map((t: any) => t.name),
            collections: prompt.collections.map((c: any) => c.title),
            viewCount: prompt.viewCount,
            copyCount: prompt.copyCount,
            createdAt: prompt.createdAt,
            updatedAt: prompt.updatedAt,
            versions
        };

        const chunk = JSON.stringify(exportItem) + (i < prompts.length - 1 ? ",\n" : "\n");
        yield encoder.encode(chunk);
    }
    yield encoder.encode("]\n");
}

function iteratorToStream(iterator: AsyncGenerator<Uint8Array, void, unknown>) {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) controller.close();
            else controller.enqueue(value);
        }
    });
}
