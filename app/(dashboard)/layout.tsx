import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import { checkAndRunAutoBackup } from "@/actions/backup";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getHiddenCollectionIdsService, getSettingsService } from "@/services/settings";
import { filterHiddenCollections } from "@/lib/collection-utils";

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

    const uniqueTags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { prompts: true }
            }
        }
    });

    const hiddenCollectionIds = await getHiddenCollectionIdsService(session.user.id);

    const rawCollections = await prisma.collection.findMany({
        where: {
            id: { notIn: hiddenCollectionIds }
        },
        orderBy: { title: "asc" },
        include: {
            _count: {
                select: { prompts: true }
            }
        }
    });

    const collections = filterHiddenCollections(rawCollections as any[], hiddenCollectionIds);

    const unassignedCount = await prisma.prompt.count({
        where: {
            collections: {
                none: {}
            }
        }
    });

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, username: true, email: true, avatarUrl: true, language: true, role: true }
    });

    const settings = await getSettingsService(session.user.id);
    const workflowVisible = settings.workflowVisible;
    console.log(`[DEBUG] DashboardLayout: User ${currentUser?.email} - workflowVisible:`, workflowVisible);

    return (
        <LanguageProvider initialLanguage={currentUser?.language || 'en'} user={currentUser}>
            <div className="flex min-h-screen bg-background text-foreground">
                <Sidebar
                    tags={uniqueTags}
                    collections={collections}
                    unassignedCount={unassignedCount}
                    user={{
                        id: currentUser?.id,
                        name: currentUser?.username,
                        email: currentUser?.email,
                        image: currentUser?.avatarUrl,
                        role: currentUser?.role,
                    }}
                    showWorkflows={settings?.workflowVisible ?? false}
                />
                <main className="flex-1 p-8 overflow-y-auto h-screen">{children}</main>
            </div>
        </LanguageProvider>
    );
}
