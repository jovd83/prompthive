import path from "path";
import fs from "fs/promises";
import { validateFileExtension } from "./utils";

import sharp from "sharp";

export async function uploadFile(file: File, prefix: string = ""): Promise<{ filePath: string; fileType: string; originalName: string }> {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    validateFileExtension(file.name);
    const fileName = `${prefix}${Date.now()}-${file.name}`;
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
        } catch (error) {
            console.error("Error generating thumbnail:", error);
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
        const fullPath = path.join(process.cwd(), "public", filePath);
        await fs.unlink(fullPath);
    } catch (e) {
        // Ignore if file doesn't exist
    }
}
