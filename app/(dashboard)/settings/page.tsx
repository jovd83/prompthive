import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES, CONFIG_ID } from "@/lib/constants";
import SettingsForm from "@/components/SettingsForm";
import { redirect } from "next/navigation";
import { Settings } from "@/types/settings";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        redirect("/login");
    }

    let settings = await prisma.settings.findUnique({
        where: { userId: session.user.id },
        include: {
            hiddenUsers: { select: { id: true } },
            hiddenCollections: { select: { id: true } }
        }
    });

    if (!settings) {
        // Handle stale session: if user doesn't exist, redirect to login
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!userExists) {
            redirect("/login");
        }

        settings = await prisma.settings.create({
            data: {
                userId: session.user.id,
                autoBackupEnabled: false,
                backupFrequency: "DAILY",
                tagColorsEnabled: true,
                workflowVisible: false,
            },
            include: {
                hiddenUsers: { select: { id: true } },
                hiddenCollections: { select: { id: true } }
            }
        });
    }

    // settings is guaranteed to be populated here or we redirected/created it.
    if (!settings) throw new Error("Settings could not be loaded");

    const allUsers = await prisma.user.findMany({
        select: { id: true, username: true, email: true, avatarUrl: true },
        orderBy: { username: 'asc' }
    });

    // Fetch all collections for visibility settings
    const allCollections = await prisma.collection.findMany({
        where: { ownerId: session.user.id },
        orderBy: { title: 'asc' },
        select: { id: true, title: true, parentId: true, _count: { select: { prompts: true } } }
    });

    const hiddenUserIds = settings.hiddenUsers ? settings.hiddenUsers.map((u: { id: string }) => u.id) : [];
    const hiddenCollectionIds = settings.hiddenCollections ? settings.hiddenCollections.map((c: { id: string }) => c.id) : [];

    const isAdmin = session.user.role === ROLES.ADMIN;

    let globalSettings = null;
    let adminUsers: { id: string; username: string; email: string; role: string; avatarUrl: string | null; createdAt: Date }[] = [];

    if (isAdmin) {
        // Fetch strictly from Prisma to avoid leaky abstraction and bypass raw SQL vulnerabilities
        globalSettings = await prisma.globalConfiguration.findUnique({
            where: { id: CONFIG_ID.GLOBAL }
        });

        // If not exists, create default strictly
        if (!globalSettings) {
            globalSettings = await prisma.globalConfiguration.create({
                data: { id: CONFIG_ID.GLOBAL, registrationEnabled: true, privatePromptsEnabled: false }
            });
        }

        adminUsers = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true
            }
        });
    }

    return (
        <div className="container mx-auto py-8">
            <SettingsForm
                initialSettings={settings as unknown as Settings}
                allUsers={allUsers}
                initialHiddenIds={hiddenUserIds}
                initialHiddenCollectionIds={hiddenCollectionIds}
                allCollections={allCollections}
                currentUserId={session.user.id}
                isAdmin={isAdmin}
                initialGlobalSettings={globalSettings
                    ? {
                        registrationEnabled: globalSettings.registrationEnabled,
                        privatePromptsEnabled: globalSettings.privatePromptsEnabled
                    }
                    : undefined}
                initialUsers={adminUsers}
            />
        </div>
    );
}
