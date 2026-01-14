
import { prisma } from "@/lib/prisma";

/**
 * Generates a unique Technical ID based on the collection name.
 * Format: PREFIX-NUMBER (e.g., VIBE-123)
 * 
 * @param collectionName The name of the collection to derive the prefix from.
 * @returns The generated Technical ID string.
 */
export async function generateTechnicalId(collectionName: string): Promise<string> {
    // 1. Derive Prefix
    // Take first 4 letters, uppercase, remove non-alphanumeric.
    // Fallback to "GEN" (General) if empty or invalid.
    let prefix = collectionName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 4);

    if (prefix.length < 3) {
        // Pad or fallback if too short
        if (prefix.length === 0) prefix = "GEN";
        else prefix = prefix.padEnd(3, "X");
    }

    // 2. Get Next Sequence Value atomically
    // We use an upsert to ensure the sequence exists
    const sequence = await prisma.technicalIdSequence.upsert({
        where: { prefix },
        update: { lastValue: { increment: 1 } },
        create: { prefix, lastValue: 1 },
    });

    // 3. Format ID
    return `${prefix}-${sequence.lastValue}`;
}
