
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Fix for BigInt serialization in JSON
// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

const prisma = new PrismaClient();
const SOURCE_ROOT = 'C:\\Documents\\LLMs-2025\\A) software testing';
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
const TARGET_ROOT_COLLECTION = 'Software testing - scraped';

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`Creating uploads directory at ${UPLOADS_DIR}`);
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function main() {
    console.log('Starting refined migration...');

    // 1. Get User
    let user = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!user) {
        user = await prisma.user.findFirst();
    }

    if (!user) {
        console.error('No user found! Please register/seed a user first.');
        process.exit(1);
    }

    console.log(`Using user: ${user.username} (${user.id})`);

    // 2. Clean Slate - Delete existing root collection if exists
    let existingRoot = await prisma.collection.findFirst({
        where: {
            title: TARGET_ROOT_COLLECTION,
            ownerId: user.id
        }
    });

    if (existingRoot) {
        console.log(`Deleting existing collection: ${TARGET_ROOT_COLLECTION} to start fresh.`);
        // Note: Prisma cascade delete might not be configured for recursive collection deletion in code,
        // but schema usually handles it or we rely on DB. 
        // Safer to delete recursively manually or rely on DB cascade.
        // For now, let's try deleting the root. 
        // If it fails due to foreign keys, we might need a cascading delete helper.
        try {
            // Fetch all sub-collections to delete them first?
            // Or assuming onDelete: Cascade is set on parentId? 
            // Checking schema: parent      Collection?  @relation("CollectionHierarchy", fields: [parentId], references: [id])
            // It does NOT have onDelete: Cascade explicitly for children.
            // But prompts attached to it...
            // Let's rely on a recursive delete helper to be safe.
            await recursiveDeleteCollection(existingRoot.id);
        } catch (e) {
            console.error("Failed to delete existing collection:", e);
            // Try to proceed anyway?
        }
    }

    // 3. Create Root Collection
    const rootCollection = await prisma.collection.create({
        data: {
            title: TARGET_ROOT_COLLECTION,
            ownerId: user.id
        }
    });
    console.log(`Created root collection: ${TARGET_ROOT_COLLECTION}`);

    // 4. Start Migration
    if (fs.existsSync(SOURCE_ROOT)) {
        await processDirectory(SOURCE_ROOT, rootCollection.id, user.id, []);
    } else {
        console.error(`Source directory not found: ${SOURCE_ROOT}`);
        process.exit(1);
    }

    console.log('Migration completed successfully!');
}

async function recursiveDeleteCollection(collectionId: string) {
    // Find children
    const children = await prisma.collection.findMany({ where: { parentId: collectionId } });
    for (const child of children) {
        await recursiveDeleteCollection(child.id);
    }

    // Delete prompts in this collection (or detach them? User said start fresh, so maybe delete prompts created by this migration?)
    // But prompts can be in multiple collections. 
    // Optimization: Delete Prompts that are *only* in this collection hierarchy?
    // For simplicity, we'll just delete the Collection. The Prompts will be orphaned or remain.
    // However, to truly "start fresh", we should probably verify if we duplicate prompts.
    // The previous run created Prompts. If we don't delete them, we'll find them and skip them (duplicate check).
    // The requirement is "Start fresh". 
    // Let's NOT delete prompts globally to be safe, but since we check for duplicates by Title,
    // and we are CHANGING the Title format (Humanized), the old prompts (snake_case) won't match!
    // So we will end up with duplicates (one snake_case, one Title Case) if we don't clean up.
    // Since we know the previous run created snake_case titles, maybe we can ignore them?
    // Or we should delete them.
    // Let's implement a clean-up of prompts attached to this collection hierarchy.

    const prompts = await prisma.prompt.findMany({
        where: { collections: { some: { id: collectionId } } }
    });

    for (const p of prompts) {
        // Hard delete prompt + versions + attachments (Cascades)
        await prisma.prompt.delete({ where: { id: p.id } }).catch(() => { });
    }

    await prisma.collection.delete({ where: { id: collectionId } });
}


async function processDirectory(dirPath: string, parentCollectionId: string | null, userId: string, parentTags: string[]) {
    const rawName = path.basename(dirPath);
    // Remove numbering for processing
    const cleanName = rawName.replace(/^[\dA-Z]+\)\s*/, '').trim();

    // Humanized Name for Collection Title and Tags
    const humanName = humanizeTitle(cleanName);

    console.log(`Processing directory: ${rawName} -> ${humanName}`);

    // Tag generation logic:
    // 1. Inherit parent tags
    // 2. Add current folder name (humanized)
    // 3. Split by underscore/hyphen to add component tags
    const currentTags = new Set([...parentTags]);

    if (dirPath !== SOURCE_ROOT) {
        currentTags.add(humanName);

        const splitParts = cleanName.split(/[_\-]/);
        if (splitParts.length > 1) {
            splitParts.forEach(part => {
                if (part.length > 2) { // Skip short words like 'is', 'to' implicit filter
                    currentTags.add(humanizeTitle(part));
                }
            });
        }
    }

    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    // Filter out hidden files
    const meaningfulItems = items.filter(item => !item.name.startsWith('.'));

    const hasSubdirs = meaningfulItems.some(item => item.isDirectory());

    if (!hasSubdirs) {
        // It's a prompt leaf
        await createPrompt(dirPath, cleanName, parentCollectionId, userId, Array.from(currentTags));
    } else {
        // It's a collection
        let collection = await prisma.collection.findFirst({
            where: {
                title: humanName,
                parentId: parentCollectionId,
                ownerId: userId
            }
        });

        if (!collection) {
            collection = await prisma.collection.create({
                data: {
                    title: humanName,
                    ownerId: userId,
                    parentId: parentCollectionId
                }
            });
        }

        for (const item of meaningfulItems) {
            if (item.isDirectory()) {
                await processDirectory(path.join(dirPath, item.name), collection.id, userId, Array.from(currentTags));
            }
        }
    }
}

async function createPrompt(dirPath: string, rawDirName: string, parentCollectionId: string | null, userId: string, tags: string[]) {
    const files = fs.readdirSync(dirPath);

    let mainFile = findMainFile(files, rawDirName);

    if (!mainFile) {
        // console.warn(`  No suitable main text file found in ${dirPath}, skipping.`);
        return;
    }

    const content = fs.readFileSync(path.join(dirPath, mainFile), 'utf-8');

    // Metadata Extraction
    const title = humanizeTitle(rawDirName);
    const description = extractDescription(content);

    // Tags
    // Add words from the title itself too? 
    // e.g. deep_research_tooling_landscape -> "Deep Research", "Tooling Landscape"? 
    // Already handled by parent logic if this was a folder. 
    // But since this is a leaf, we need to add its own split tags.
    const leafTags = new Set([...tags]);
    const splitParts = rawDirName.split(/[_\-]/);
    if (splitParts.length > 1) {
        splitParts.forEach(part => {
            if (part.length > 2) leafTags.add(humanizeTitle(part));
        });
    }


    const connectedTags = [];
    for (const tagName of leafTags) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } });
        if (!tag) {
            tag = await prisma.tag.create({ data: { name: tagName } });
        }
        connectedTags.push({ id: tag.id });
    }

    let prompt = await prisma.prompt.create({
        data: {
            title: title,
            description: description,
            createdById: userId,
            versions: {
                create: {
                    content: content,
                    versionNumber: 1,
                    createdById: userId
                }
            },
            collections: parentCollectionId ? {
                connect: { id: parentCollectionId }
            } : undefined,
            tags: {
                connect: connectedTags
            }
        },
        include: {
            versions: true
        }
    });

    console.log(`  Created Prompt: ${title}`);
    const versionId = prompt.versions[0].id;

    // Handle attachments
    for (const file of files) {
        if (file === mainFile) continue;
        if (file.startsWith('.')) continue;

        const ext = path.extname(file).toLowerCase();

        if (['.png', '.jpg', '.jpeg', '.mp4', '.mov', '.gif', '.zip', '.rar'].includes(ext)) {
            continue;
        }
        if (file.toLowerCase().includes('result')) continue;

        const sourcePath = path.join(dirPath, file);
        const uniqueName = `${prompt.id}-${Date.now()}-${file.replace(/\s+/g, '_')}`;
        const destPath = path.join(UPLOADS_DIR, uniqueName);

        try {
            fs.copyFileSync(sourcePath, destPath);
            let fileType = ext.replace('.', '') || 'txt';
            await prisma.attachment.create({
                data: {
                    versionId: versionId,
                    filePath: `/uploads/${uniqueName}`,
                    fileType: fileType,
                    originalName: file,
                    role: 'ATTACHMENT'
                }
            });
        } catch (e) {
            console.error(`    Failed to copy/attach ${file}:`, e);
        }
    }
}

// Helper: Humanize Text (snake_case -> Title Case)
function humanizeTitle(text: string): string {
    return text
        .split(/[_\-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Helper: Description Extraction
function extractDescription(content: string): string | null {
    const lines = content.split('\n');
    let bestCandidate = "";

    // Strategy 1: Look for "Goal", "Purpose", "Context" headers
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        if (line.startsWith('##') && (
            lowerLine.includes('goal') ||
            lowerLine.includes('purpose') ||
            lowerLine.includes('context') ||
            lowerLine.includes('summary') ||
            lowerLine.includes('action')
        )) {
            // Found a good header. Grab the next non-empty paragraph.
            // But verify it's not "You are..." if it's Context
            let pBuffer = [];
            for (let j = i + 1; j < lines.length; j++) {
                const subLine = lines[j].trim();
                // Stop at next header
                if (subLine.startsWith('#')) break;

                if (subLine) {
                    // Check exclusion criteria
                    if (subLine.toLowerCase().startsWith('you are')) {
                        // Skip this paragraph, try next
                        continue;
                    }
                    if (subLine.startsWith('>')) { // Quote block might be good?
                        pBuffer.push(subLine.replace(/^>\s*/, ''));
                    } else {
                        pBuffer.push(subLine);
                    }

                    // If we have some text, and next line is empty, stop (end of paragraph)
                    if (lines[j + 1] && lines[j + 1].trim() === '') break;
                }
            }
            const candidate = pBuffer.join(' ').trim();
            if (candidate.length > 10) return truncate(candidate);
        }
    }

    // Strategy 2: Pre-amble (Text before first header)
    let preambleBuffer = [];
    for (const line of lines) {
        if (line.trim().startsWith('#')) break;
        if (line.trim()) preambleBuffer.push(line.trim());
    }
    if (preambleBuffer.length > 0) {
        return truncate(preambleBuffer.join(' '));
    }

    // Fallback: First non-empty paragraph anywhere
    for (const line of lines) {
        if (line.trim() && !line.trim().startsWith('#')) {
            return truncate(line.trim());
        }
    }

    return null;
}

function truncate(str: string): string {
    return str.length > 500 ? str.substring(0, 497) + '...' : str;
}


function findMainFile(files: string[], dirName: string): string | undefined {
    const candidates = files.filter(f => {
        const lower = f.toLowerCase();
        return !lower.endsWith('.j2') &&
            !lower.endsWith('.jinja') &&
            !lower.endsWith('.tmpl') &&
            (lower.endsWith('.md') || lower.endsWith('.txt'));
    });

    let match = candidates.find(f => f.toLowerCase() === dirName.toLowerCase() + '.md');
    if (match) return match;
    match = candidates.find(f => f.toLowerCase() === 'prompt.md');
    if (match) return match;
    match = candidates.find(f => f.toLowerCase().endsWith('.md'));
    if (match) return match;
    return candidates.find(f => f.toLowerCase().endsWith('.txt'));
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
