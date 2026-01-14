import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ImportExportContent from "@/components/ImportExportContent";
import { redirect } from "next/navigation";

export default async function ImportExportPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/auth/signin");
    }

    let settings = await prisma.settings.findUnique({
        where: { userId: session.user.id },
    });

    if (!settings) {
        // Handle stale session: if user doesn't exist, redirect to login
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!userExists) {
            redirect("/auth/signin");
        }

        settings = await prisma.settings.create({
            data: {
                userId: session.user.id,
                autoBackupEnabled: false,
                backupFrequency: "DAILY",
            },
        });
    }

    // Fetch fresh user to ensure role is up to date (session might be stale after promotion)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });
    const isAdmin = user?.role === 'ADMIN';

    const collections = await prisma.collection.findMany({
        where: { ownerId: session.user.id },
        include: {
            _count: { select: { prompts: true } }
        },
        orderBy: { title: 'asc' }
    });

    // Ensure settings matches the expected type locally if DB schema lags behind types
    const safeSettings = {
        ...settings,
        tagColorsEnabled: (settings as any).tagColorsEnabled ?? false
    };

    return (
        <ImportExportContent
            collections={collections as any}
            initialSettings={safeSettings}
            isAdmin={isAdmin}
        />
    );
}
