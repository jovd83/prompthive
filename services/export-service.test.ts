import { generateZeroExport } from "./export-service";
import { prisma } from "@/lib/prisma";
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock("@/lib/prisma", () => ({
    prisma: {
        collection: {
            findMany: vi.fn(),
        },
        prompt: {
            findMany: vi.fn(),
        },
    },
}));

describe("generateZeroExport", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should generate correct export structure for selected collections", async () => {
        const userId = "user1";
        const collectionIds = ["col1"];

        // Mock DB responses
        (prisma.collection.findMany as any).mockResolvedValue([
            { id: "col1", title: "My Collection", parentId: null }
        ]);

        (prisma.prompt.findMany as any).mockResolvedValue([
            {
                id: "p1",
                title: "Prompt 1",
                description: "Desc",
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-01"),
                tags: [{ name: "tag1" }],
                versions: [{
                    content: "Body content",
                    shortContent: "Short",
                    usageExample: "Example",
                    resultText: "Result",
                    versionNumber: 1
                }],
                collections: [{ id: "col1" }]
            }
        ]);

        const result = await generateZeroExport(userId, collectionIds);

        expect(result.version).toBe(1);
        expect(result.collections).toHaveLength(1);
        expect(result.collections[0]).toEqual({
            id: "col1",
            name: "My Collection",
            parentId: null
        });
        expect(result.prompts).toHaveLength(1);
        expect(result.prompts[0].title).toBe("Prompt 1");
        expect(result.prompts[0].body).toBe("Body content");
        expect(result.prompts[0].tags).toEqual(["tag1"]);
        expect(result.prompts[0].collectionId).toBe("col1");
    });

    it("should handle empty results", async () => {
        (prisma.collection.findMany as any).mockResolvedValue([]);
        (prisma.prompt.findMany as any).mockResolvedValue([]);

        const result = await generateZeroExport("user1", ["col1"]);

        expect(result.collections).toHaveLength(0);
        expect(result.prompts).toHaveLength(0);
    });
});
