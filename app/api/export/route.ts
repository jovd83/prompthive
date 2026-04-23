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

    const stream = iteratorToStream(generateExportStream(session.user.id));

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="MyPromptHive-backup-${new Date().toISOString().split('T')[0]}.json"`,
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

    const stream = iteratorToStream(generateExportStream(session.user.id, collectionIds));

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="MyPromptHive-backup-${new Date().toISOString().split('T')[0]}.json"`,
        },
    });
}

async function* generateExportStream(userId: string, collectionIds?: string[]) {
    const encoder = new TextEncoder();
    yield encoder.encode("[\n");

    const batchSize = 100;
    let cursor: string | undefined = undefined;
    let isFirst = true;

    const where: any = { createdById: userId };
    if (collectionIds && Array.isArray(collectionIds) && collectionIds.length > 0) {
        where.collections = { some: { id: { in: collectionIds } } };
    }

    // 1. Resolve all prompt IDs recursively
    const initialPrompts = await prisma.prompt.findMany({
        where,
        select: { id: true }
    });
    
    const allPromptIds = new Set(initialPrompts.map(p => p.id));
    
    let changed = true;
    while (changed) {
        changed = false;
        const currentPromptIds = Array.from(allPromptIds);
        const versions = await prisma.promptVersion.findMany({
            where: { promptId: { in: currentPromptIds } },
            select: { agentSkillIds: true }
        });
        
        for (const v of versions) {
            if (v.agentSkillIds) {
                try {
                    const skillIds = JSON.parse(v.agentSkillIds);
                    if (Array.isArray(skillIds)) {
                        for (const sid of skillIds) {
                            if (!allPromptIds.has(sid)) {
                                allPromptIds.add(sid);
                                changed = true;
                            }
                        }
                    }
                } catch (e) {}
            }
        }
    }

    // 2. Stream using the resolved IDs
    const resolvedIds = Array.from(allPromptIds);
    let processed = 0;

    while (processed < resolvedIds.length) {
        const batchIds = resolvedIds.slice(processed, processed + batchSize);
        const prompts: any[] = await prisma.prompt.findMany({
            where: { id: { in: batchIds } },
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
            orderBy: { id: 'asc' }
        });

        if (prompts.length === 0) break;
        processed += batchIds.length;

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
                    agentUsage: v.agentUsage ?? "",
                    agentSkillIds: v.agentSkillIds ?? "[]",
                    createdAt: v.createdAt
                });
            }

            const exportItem = {
                id: prompt.id,
                title: prompt.title,
                description: prompt.description,
                tags: prompt.tags.map((t: any) => t.name),
                collections: prompt.collections.map((c: any) => c.title),
                itemType: prompt.itemType,
                repoUrl: prompt.repoUrl,
                installCommand: prompt.installCommand,
                viewCount: prompt.viewCount,
                copyCount: prompt.copyCount,
                createdAt: prompt.createdAt,
                updatedAt: prompt.updatedAt,
                versions
            };

            const chunk = (isFirst ? "" : ",\n") + JSON.stringify(exportItem);
            yield encoder.encode(chunk);
            isFirst = false;
        }

        cursor = prompts[prompts.length - 1].id;
    }

    yield encoder.encode("\n]\n");
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
