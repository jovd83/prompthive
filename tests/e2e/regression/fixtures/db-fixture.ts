import { test as base } from '@playwright/test';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

type DbFixtures = {
    seedUser: { id: string; username: string; email: string; passwordHash: string; plainTextPassword?: string };
    seedAdmin: { id: string; username: string; email: string; passwordHash: string; plainTextPassword?: string };
};

export const test = base.extend<DbFixtures>({
    seedUser: async ({ }, use, testInfo) => {
        const username = `testuser_${testInfo.testId}_${Date.now()}`;
        const passwordPlain = 'SecureTest123!';
        const passwordHash = await bcrypt.hash(passwordPlain, 10);

        const user = await prisma.user.create({
            data: {
                id: uuidv4(),
                username: username,
                email: `${username}@example.com`,
                passwordHash: passwordHash,
                role: 'USER',
            }
        });
        console.log(`[FIXTURE] Seeded user: ${user.username} (id: ${user.id})`);

        // Verify it's actually in the DB
        const verified = await prisma.user.findUnique({ where: { id: user.id } });
        console.log(`[FIXTURE] Verification for ${user.username}: ${verified ? 'EXISTS' : 'MISSING'}`);

        // Pre-create settings to avoid SSR race condition between layout and page
        await prisma.settings.create({
            data: { userId: user.id }
        });

        // Pass the created user to the test, including the plaintext password for login flows
        await use({ ...user, plainTextPassword: passwordPlain });

        // Clean up the user (cascade deletes settings)
        await prisma.user.delete({
            where: { id: user.id }
        }).catch(() => { });
    },

    seedAdmin: async ({ }, use, testInfo) => {
        const username = `testadmin_${testInfo.testId}_${Date.now()}`;
        const passwordPlain = 'AdminSecure321!';
        const passwordHash = await bcrypt.hash(passwordPlain, 10);

        const admin = await prisma.user.create({
            data: {
                id: uuidv4(),
                username: username,
                email: `${username}@admin.com`,
                passwordHash: passwordHash,
                role: 'ADMIN',
            }
        });

        // Pre-create settings
        await prisma.settings.create({
            data: { userId: admin.id }
        });

        // Removed global config upsert to prevent SQLite deadlocks with Next.js server.

        // Pass the created admin to the test
        await use({ ...admin, plainTextPassword: passwordPlain });

        // Clean up the admin after the test finishes
        await prisma.user.delete({
            where: { id: admin.id }
        }).catch(() => { });
    }
});

export { expect } from '@playwright/test';
