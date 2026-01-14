import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/SettingsForm";
import { redirect } from "next/navigation";

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
            } as any,
            include: {
                hiddenUsers: { select: { id: true } },
                hiddenCollections: { select: { id: true } }
            }
        });
    }

    // settings is guaranteed to be populated here or we redirected/created it.
    // However, if create failed, it could throw (which is fine). 
    // TypeScript might think it's null because of the conditional logic structure.
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

    const hiddenUserIds = settings.hiddenUsers ? settings.hiddenUsers.map((u: any) => u.id) : [];
    const hiddenCollectionIds = settings.hiddenCollections ? settings.hiddenCollections.map((c: any) => c.id) : [];

    const isAdmin = session.user.role === 'ADMIN';

    let globalSettings = null;
    let adminUsers: any[] = [];
    if (isAdmin) {
        // Fetch directly from prisma to avoid "Unauthorized" error if generic action called by non-admin logic (though here we know isAdmin)
        // Or reuse the action logic safely.
        // Fetch directly using raw query to bypass potentially stale Prisma Client schema in dev environment
        // standard findUnique would return partial data if the Schema wasn't re-generated/loaded
        const rawGlobalSettings = await prisma.$queryRaw<any[]>`SELECT * FROM "GlobalConfiguration" WHERE "id" = 'GLOBAL'`;
        globalSettings = rawGlobalSettings[0] || null;
        // If not exists, create default (same logic as action but inline for server component safety/performance)
        if (!globalSettings) {
            globalSettings = await prisma.globalConfiguration.create({
                data: { id: "GLOBAL", registrationEnabled: true }
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
                initialSettings={settings as any}
                allUsers={allUsers}
                initialHiddenIds={hiddenUserIds}
                initialHiddenCollectionIds={hiddenCollectionIds}
                allCollections={allCollections}
                currentUserId={session.user.id}
                isAdmin={isAdmin}
                initialGlobalSettings={globalSettings ? { registrationEnabled: globalSettings.registrationEnabled, privatePromptsEnabled: (globalSettings as any).privatePromptsEnabled } as any : undefined}
                initialUsers={adminUsers}
            />
        </div>
    );
}
