import path from "path";
import fs from "fs/promises";
import { validateFileExtension } from "./utils";

import sharp from "sharp";

export async function uploadFile(file: File, prefix: string = ""): Promise<{ filePath: string; fileType: string; originalName: string }> {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // 1. Security: Enforce size limit (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) throw new Error("File size exceeds 10MB limit.");

    validateFileExtension(file.name);

    // 2. Security: Sanitize filename and prefix to prevent path traversal and special char issues
    const safePrefix = prefix.replace(/[^a-z0-9._-]/gi, '_');
    const safeName = file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    const fileName = `${safePrefix}${Date.now()}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Generate thumbnail if image
    if (file.type.startsWith("image/")) {
        try {
            const thumbName = `thumb_${fileName}`;
            const thumbPath = path.join(uploadDir, thumbName);
            await sharp(buffer)
                .resize({ width: 400, withoutEnlargement: true })
                .toFile(thumbPath);
        } catch (error: unknown) {
            console.error("[FileService] Error generating thumbnail:", error instanceof Error ? error.message : String(error));
        }
    }

    return {
        filePath: `/uploads/${fileName}`,
        fileType: file.type,
        originalName: file.name
    };
}

export async function deleteFile(filePath: string): Promise<void> {
    try {
        const publicDir = path.join(process.cwd(), "public");
        const fullPath = path.resolve(publicDir, filePath.startsWith("/") ? filePath.slice(1) : filePath);

        // Security: Ensure the path is within the public directory
        if (!fullPath.startsWith(publicDir)) {
            console.warn(`[FileService] Prevented path traversal attempt: ${filePath}`);
            return;
        }

        await fs.unlink(fullPath);
    } catch (e: unknown) {
        console.warn(`[FileService] Could not delete file ${filePath}:`, e instanceof Error ? e.message : String(e));
    }
}
