import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcryptjs";

// Helper to generate unique strings
const unique = (prefix: string) => `${prefix}_${uuidv4().slice(0, 8)}`;

export const UserFactory = {
    create: async (overrides: Prisma.UserCreateInput = {}) => {
        const username = overrides.username || unique("user");
        const email = overrides.email || `${username}@example.com`;
        const passwordHash = await hash("password123", 10);

        return prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                role: "USER",
                ...overrides,
            },
        });
    },
};

export const TagFactory = {
    create: async (overrides: Prisma.TagCreateInput = {}) => {
        return prisma.tag.create({
            data: {
                name: overrides.name || unique("tag"),
                color: overrides.color || "#FF0000",
                ...overrides,
            },
        });
    },
};

export const CollectionFactory = {
    create: async (overrides: Partial<Prisma.CollectionCreateInput> & { ownerId: string }) => {
        // Ensure owner exists if not strictly provided in overrides (implied by ownerId prop)
        // But typically we pass ownerId manually.

        return prisma.collection.create({
            data: {
                title: overrides.title || unique("collection"),
                owner: { connect: { id: overrides.ownerId } },
                ...overrides,
                ownerId: undefined, // removed from data spread, used in connect
            } as any,
        });
    },
};

export const PromptFactory = {
    create: async (overrides: Partial<Prisma.PromptCreateInput> & { createdById: string }) => {
        const title = overrides.title || unique("prompt");

        return prisma.prompt.create({
            data: {
                title,
                createdById: overrides.createdById,
                versions: {
                    create: {
                        versionNumber: 1,
                        content: `Content for ${title}`,
                        createdById: overrides.createdById,
                    }
                },
                ...overrides,
                createdById: undefined, // handle via relation if needed, or just let simple ID pass if prisma allows
            } as any, // casting to avoid complex nested relation types issues in factory
        });
    },
};

export const PromptVersionFactory = {
    create: async (data: { promptId: string; createdById: string; versionNumber?: number; content?: string }) => {
        return prisma.promptVersion.create({
            data: {
                promptId: data.promptId,
                createdById: data.createdById,
                versionNumber: data.versionNumber || 1,
                content: data.content || "Default content",
            },
        });
    },
};
