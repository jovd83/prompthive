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
        include: { hiddenUsers: { select: { id: true } } }
    });

    if (!settings) {
        settings = await prisma.settings.create({
            data: {
                userId: session.user.id,
                autoBackupEnabled: false,
                backupFrequency: "DAILY",
            },
            include: { hiddenUsers: { select: { id: true } } }
        });
    }

    const allUsers = await prisma.user.findMany({
        select: { id: true, username: true, email: true, avatarUrl: true },
        orderBy: { username: 'asc' }
    });

    const hiddenUserIds = settings.hiddenUsers ? settings.hiddenUsers.map((u: any) => u.id) : [];
    const isAdmin = session.user.role === 'ADMIN';

    let globalSettings = null;
    let adminUsers: any[] = [];
    if (isAdmin) {
        // Fetch directly from prisma to avoid "Unauthorized" error if generic action called by non-admin logic (though here we know isAdmin)
        // Or reuse the action logic safely.
        globalSettings = await prisma.globalConfiguration.findUnique({ where: { id: "GLOBAL" } });
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
                initialSettings={settings}
                allUsers={allUsers}
                initialHiddenIds={hiddenUserIds}
                currentUserId={session.user.id}
                isAdmin={isAdmin}
                initialGlobalSettings={globalSettings ? { registrationEnabled: globalSettings.registrationEnabled } : undefined}
                initialUsers={adminUsers}
            />
        </div>
    );
}
