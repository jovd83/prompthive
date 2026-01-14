/**
 * Post-Deploy Migration Script
 * 
 * Usage: npx tsx scripts/post-deploy-migration.ts
 * 
 * This script handles data backfills for new features in v2.3.3:
 * 1. Technical IDs: Generates IDs for prompts that don't have one.
 * 2. Tag Colors: Assigns deterministic colors to tags that don't have one.
 */

import { PrismaClient } from "@prisma/client";
import { generateTechnicalId } from "../services/id-service";

const prisma = new PrismaClient();

// ----- Helpers -----

import { generateColorFromName } from "@/lib/color-utils";

// ----- Helpers -----

// generateColorFromName is imported


// ----- MIGRATION TASKS -----

async function backfillTechnicalIds() {
    console.log("--- Starting Technical ID Backfill ---");
    const promptsToUpdate = await prisma.prompt.findMany({
        where: { technicalId: null },
        include: { collections: { take: 1 } }
    });

    console.log(`Found ${promptsToUpdate.length} prompts to update.`);

    let success = 0;
    let errors = 0;

    for (const prompt of promptsToUpdate) {
        try {
            const collectionName = prompt.collections[0]?.title || "Unassigned";
            const newTechnicalId = await generateTechnicalId(collectionName);

            await prisma.prompt.update({
                where: { id: prompt.id },
                data: { technicalId: newTechnicalId }
            });
            // console.log(`  [OK] ${prompt.id} -> ${newTechnicalId}`);
            success++;
        } catch (error) {
            console.error(`  [ERR] Failed prompt ${prompt.id}:`, error);
            errors++;
        }
    }
    console.log(`Technical IDs: ${success} updated, ${errors} failed.`);
}

async function backfillTagColors() {
    console.log("\n--- Starting Tag Color Backfill ---");
    const tagsToUpdate = await prisma.tag.findMany({
        where: { color: null }
    });

    console.log(`Found ${tagsToUpdate.length} tags to update.`);

    let success = 0;
    let errors = 0;

    for (const tag of tagsToUpdate) {
        try {
            const color = generateColorFromName(tag.name);
            await prisma.tag.update({
                where: { id: tag.id },
                data: { color }
            });
            success++;
        } catch (error) {
            console.error(`  [ERR] Failed tag ${tag.name}:`, error);
            errors++;
        }
    }
    console.log(`Tag Colors: ${success} updated, ${errors} failed.`);
}

// ----- MAIN -----

async function main() {
    console.log("Starting Post-Deploy Migration for v2.3.3...");

    await backfillTechnicalIds();
    await backfillTagColors();

    console.log("\nMigration Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
