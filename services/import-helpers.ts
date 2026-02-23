import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { generateColorFromName } from "@/lib/color-utils";

export async function restoreImage(fileData: string, originalPath: string | undefined): Promise<string | null> {
    try {
        const buffer = Buffer.from(fileData, 'base64');
        const ext = originalPath ? path.extname(originalPath) : '.png';
        const fileName = `restored-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, fileName), buffer);
        return `/uploads/${fileName}`;
    } catch (e: unknown) {
        console.error("[ImportMapper] Failed to restore image:", e instanceof Error ? e.message : String(e));
        return null;
    }
}

export async function ensureTags(tagNames: Set<string>): Promise<Map<string, string>> {
    if (tagNames.size === 0) return new Map();

    const names = Array.from(tagNames);
    const existingTags = await prisma.tag.findMany({
        where: { name: { in: names } }
    });

    const existingMap = new Map(existingTags.map(t => [t.name.toLowerCase(), t.id]));
    const missingNames = names.filter(n => !existingMap.has(n.toLowerCase()));

    for (const name of missingNames) {
        if (existingMap.has(name.toLowerCase())) continue;

        const color = generateColorFromName(name);
        try {
            const newTag = await prisma.tag.create({
                data: { name, color }
            });
            existingMap.set(name.toLowerCase(), newTag.id);
        } catch (e: unknown) {
            console.warn(`[ImportTransaction] Race condition on tag creation for ${name}:`, e instanceof Error ? e.message : String(e));
            const existing = await prisma.tag.findUnique({ where: { name } });
            if (existing) existingMap.set(name.toLowerCase(), existing.id);
        }
    }

    return existingMap;
}

export async function ensureCollections(collectionNames: Set<string>, userId: string): Promise<Map<string, string>> {
    if (collectionNames.size === 0) return new Map();

    const names = Array.from(collectionNames);
    const existingCols = await prisma.collection.findMany({
        where: {
            ownerId: userId,
            title: { in: names }
        }
    });

    const existingMap = new Map(existingCols.map(c => [c.title, c.id]));
    const missingNames = names.filter(n => !existingMap.has(n));

    for (const title of missingNames) {
        try {
            const newCol = await prisma.collection.create({
                data: { title, ownerId: userId }
            });
            existingMap.set(title, newCol.id);
        } catch (e: unknown) {
            console.warn(`[ImportTransaction] Race condition on collection creation for ${title}:`, e instanceof Error ? e.message : String(e));
            const existing = await prisma.collection.findFirst({ where: { title, ownerId: userId } });
            if (existing) existingMap.set(title, existing.id);
        }
    }

    return existingMap;
}
