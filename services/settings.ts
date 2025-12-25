import { prisma } from "@/lib/prisma";

export async function getSettingsService(userId: string) {
    let settings = await prisma.settings.findUnique({
        where: { userId },
        include: { hiddenUsers: true }
    });

    if (!settings) {
        try {
            settings = await prisma.settings.create({
                data: {
                    userId,
                    // defaults
                    autoBackupEnabled: false,
                    backupFrequency: "DAILY",
                    showPrompterTips: true,
                },
                include: { hiddenUsers: true }
            });
        } catch (error: any) {
            // Handle race conditions or Foreign Key (User missing) errors
            if (error.code === 'P2003') {
                console.warn(`[getSettingsService] User ${userId} not found in DB. Returning default settings.`);
                // Return a mock settings object so the UI doesn't crash.
                // The user will likely be redirected to login eventually if auth check fails elsewhere,
                // or they are in a broken state that requires re-login.
                return {
                    id: "transient",
                    userId,
                    autoBackupEnabled: false,
                    backupPath: null,
                    backupFrequency: "DAILY",
                    lastBackupAt: null,
                    showPrompterTips: true,
                    hiddenUsers: []
                };
            }
            throw error;
        }
    }

    return settings;
}

export async function updateGeneralSettingsService(userId: string, data: { showPrompterTips: boolean }) {
    return await prisma.settings.update({
        where: { userId },
        data: {
            showPrompterTips: data.showPrompterTips
        }
    });
}

export async function updateVisibilitySettingsService(userId: string, hiddenUserIds: string[]) {
    // We use 'set' to overwrite the list with the new provided list
    return await prisma.settings.update({
        where: { userId },
        data: {
            hiddenUsers: {
                set: hiddenUserIds.map(id => ({ id }))
            }
        }
    });
}

export async function getHiddenUserIdsService(userId: string): Promise<string[]> {
    const settings = await prisma.settings.findUnique({
        where: { userId },
        select: { hiddenUsers: { select: { id: true } } }
    });
    return settings?.hiddenUsers.map(u => u.id) || [];
}
