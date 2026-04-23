
import { test, expect } from '@playwright/test';
import { prisma } from "../lib/prisma";
import { generateZeroExport } from "../services/export-service";
import { importUnifiedService } from "../services/imports";
import { generateTechnicalId } from "../services/id-service";

test.describe('Linked Prompts Export/Import Integration', () => {
    // Mock user
    const userId = "test-user-link-export-" + Date.now();

    test.beforeAll(async () => {
        await prisma.user.create({
            data: {
                id: userId,
                email: `test-${userId}@example.com`,
                username: userId,
                passwordHash: "dummy"
            }
        });
    });

    test('should export and import linked prompts', async () => {
        // 1. Create Data
        const col = await prisma.collection.create({
            data: { title: "LinkExportCol_" + Date.now(), ownerId: userId }
        });

        const techIdA = await generateTechnicalId(col.title);
        const promptA = await prisma.prompt.create({
            data: {
                title: "Prompt A",
                description: "A",
                createdById: userId,
                technicalId: techIdA,
                collections: { connect: { id: col.id } },
                versions: { create: { versionNumber: 1, content: "A", createdById: userId } }
            } as any
        });
        await prisma.prompt.update({ where: { id: promptA.id }, data: { currentVersionId: (await prisma.promptVersion.findFirst({ where: { promptId: promptA.id } }))?.id } });

        const techIdB = await generateTechnicalId(col.title);
        const promptB = await prisma.prompt.create({
            data: {
                title: "Prompt B",
                description: "B",
                createdById: userId,
                technicalId: techIdB,
                collections: { connect: { id: col.id } },
                versions: { create: { versionNumber: 1, content: "B", createdById: userId } }
            } as any
        });
        await prisma.prompt.update({ where: { id: promptB.id }, data: { currentVersionId: (await prisma.promptVersion.findFirst({ where: { promptId: promptB.id } }))?.id } });

        // Link them: A -> B
        await prisma.prompt.update({
            where: { id: promptA.id },
            data: { relatedPrompts: { connect: { id: promptB.id } } } as any
        });

        // 2. Export
        const exportData = await generateZeroExport(userId, [col.id]);

        // NO CLEANUP: We keep original prompts.
        // Import should generate NEW prompts with NEW Technical IDs, avoiding collision.

        // Verify Export has link
        const exportedA = exportData.prompts.find(p => p.title === "Prompt A");
        expect(exportedA).toBeDefined();
        // Since technical IDs might be generated sequentially, we expect techIdB to be in the list
        expect(exportedA?.relatedPrompts).toContain(techIdB);

        // 3. Import (Simulate new user or clean state)
        const userId2 = "test-user-link-import-" + Date.now();
        await prisma.user.create({
            data: {
                id: userId2,
                email: `test-${userId2}@example.com`,
                username: userId2,
                passwordHash: "dummy"
            }
        });

        const result = await importUnifiedService(userId2, exportData.prompts);
        expect(result.count).toBe(2);

        // 4. Verify Import Links
        const importedA = await prisma.prompt.findFirst({
            where: { title: "Prompt A", createdById: userId2 },
            include: { relatedPrompts: true } as any
        });
        const importedB = await prisma.prompt.findFirst({
            where: { title: "Prompt B", createdById: userId2 }
        });

        expect(importedA).toBeDefined();
        expect(importedB).toBeDefined();
        // Verify IDs are regenerated (NOT equal to exported IDs)
        expect((importedA as any).technicalId).not.toBe(techIdA);
        expect((importedB as any).technicalId).not.toBe(techIdB);

        // Verify Link is preserved
        expect((importedA as any).relatedPrompts.length).toBe(1);
        expect((importedA as any).relatedPrompts[0].id).toBe(importedB!.id);
    });
});
