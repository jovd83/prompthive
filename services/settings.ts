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
                    backupFrequency: "DAILY",
                    showPrompterTips: true,
                    tagColorsEnabled: true,
                    workflowVisible: false, // Default hidden
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
                    tagColorsEnabled: true,
                    workflowVisible: false,
                    hiddenUsers: []
                };
            }
            throw error;
        }
    }

    return settings;
}

export async function updateGeneralSettingsService(userId: string, data: { showPrompterTips: boolean; tagColorsEnabled: boolean; workflowVisible: boolean }) {
    return await prisma.settings.update({
        where: { userId },
        data: {
            showPrompterTips: data.showPrompterTips,
            tagColorsEnabled: data.tagColorsEnabled,
            workflowVisible: data.workflowVisible
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

export async function updateCollectionVisibilitySettingsService(userId: string, hiddenCollectionIds: string[]) {
    return await prisma.settings.update({
        where: { userId },
        data: {
            hiddenCollections: {
                set: hiddenCollectionIds.map(id => ({ id }))
            }
        }
    });
}

export async function getHiddenCollectionIdsService(userId: string): Promise<string[]> {
    const settings = await prisma.settings.findUnique({
        where: { userId },
        select: { hiddenCollections: { select: { id: true } } }
    });
    return settings?.hiddenCollections.map(c => c.id) || [];
}

export async function updateGlobalSettingsService(data: { registrationEnabled: boolean; privatePromptsEnabled?: boolean }) {
    return prisma.globalConfiguration.upsert({
        where: { id: "GLOBAL" },
        update: {
            registrationEnabled: data.registrationEnabled,
            privatePromptsEnabled: data.privatePromptsEnabled
        },
        create: {
            id: "GLOBAL",
            registrationEnabled: data.registrationEnabled,
            privatePromptsEnabled: data.privatePromptsEnabled ?? false
        }
    });
}
