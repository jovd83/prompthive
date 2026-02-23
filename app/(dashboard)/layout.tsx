import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";
import { prisma } from "@/lib/prisma";
import { checkAndRunAutoBackup } from "@/actions/backup";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getHiddenCollectionIdsService, getSettingsService } from "@/services/settings";
import { CollectionWithCount, filterHiddenCollections } from "@/lib/collection-utils";
import CommandPalette from "@/components/CommandPalette";
import { getCachedTags, getCachedCollections, getCachedUnassignedCount } from "@/lib/cache";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ... code ...
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        redirect("/login");
    }

    checkAndRunAutoBackup(session.user.id).catch(console.error);

    const uniqueTags = await getCachedTags();
    const hiddenCollectionIds = await getHiddenCollectionIdsService(session.user.id);
    const rawCollections = await getCachedCollections();
    const collections = filterHiddenCollections(rawCollections as unknown as CollectionWithCount[], hiddenCollectionIds);

    const unassignedCount = await getCachedUnassignedCount();

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, username: true, email: true, avatarUrl: true, language: true, role: true }
    });

    const settings = await getSettingsService(session.user.id);
    const workflowVisible = settings.workflowVisible;
    console.log(`[DEBUG] DashboardLayout: User ${currentUser?.email} - workflowVisible:`, workflowVisible);

    return (
        <LanguageProvider initialLanguage={currentUser?.language || 'en'} user={currentUser}>
            <CommandPalette>
                <DashboardLayoutClient
                    sidebarProps={{
                        tags: uniqueTags,
                        collections: collections,
                        unassignedCount: unassignedCount,
                        user: {
                            id: currentUser?.id,
                            name: currentUser?.username,
                            email: currentUser?.email,
                            image: currentUser?.avatarUrl,
                            role: currentUser?.role,
                        },
                        showWorkflows: settings?.workflowVisible ?? false
                    }}
                >
                    {children}
                </DashboardLayoutClient>
            </CommandPalette>
        </LanguageProvider>
    );
}
