import { prisma } from "@/lib/prisma";
import { generateColorFromName } from "@/lib/color-utils";

export class TagService {
    static async createTagService(name: string) {
        // Determine color deterministically based on name for consistency
        const color = generateColorFromName(name);
        return prisma.tag.create({
            data: {
                name,
                color
            },
        });
    }

    static async deleteUnusedTagsService() {
        const unusedTags = await prisma.tag.findMany({
            where: { prompts: { none: {} } },
            select: { id: true }
        });

        if (unusedTags.length > 0) {
            await prisma.tag.deleteMany({
                where: { id: { in: unusedTags.map(t => t.id) } }
            });
        }

        return { count: unusedTags.length };
    }

    static async cleanupTagsForPromptDelete(promptId: string) {
        const promptWithTags = await prisma.prompt.findUnique({
            where: { id: promptId },
            select: { tags: { select: { id: true } } }
        });

        if (promptWithTags && promptWithTags.tags.length > 0) {
            const descendantTagIds = promptWithTags.tags.map(t => t.id);

            // Find which of these tags are still in use by ANY prompt
            const tagsInUse = await prisma.tag.findMany({
                where: {
                    id: { in: descendantTagIds },
                    prompts: { some: {} } // Has at least one prompt
                },
                select: { id: true }
            });

            const inUseSet = new Set(tagsInUse.map(t => t.id));
            const tagsToDelete = descendantTagIds.filter(id => !inUseSet.has(id));

            if (tagsToDelete.length > 0) {
                await prisma.tag.deleteMany({
                    where: { id: { in: tagsToDelete } }
                });
            }
        }
    }
}
