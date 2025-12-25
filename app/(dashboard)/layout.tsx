import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import { checkAndRunAutoBackup } from "@/actions/backup";
import { LanguageProvider } from "@/components/LanguageProvider";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        redirect("/login");
    }

    // Trigger lazy auto-backup check
    // We don't await this to avoid blocking the UI
    checkAndRunAutoBackup(session.user.id).catch(console.error);


    // Fetch all tags
    const uniqueTags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { prompts: true }
            }
        }
    });

    // Fetch collections
    // Fetch all collections (globally viewable)
    const collections = await prisma.collection.findMany({
        orderBy: { title: "asc" },
        include: {
            _count: {
                select: { prompts: true }
            }
        }
    });

    // Fetch global unassigned prompts count
    const unassignedCount = await prisma.prompt.count({
        where: {
            collections: {
                none: {}
            }
        }
    });

    // Fetch current user for sidebar profile
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, username: true, email: true, avatarUrl: true, language: true, role: true }
    });

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
                />
                <main className="flex-1 p-8 overflow-y-auto h-screen">{children}</main>
            </div>
        </LanguageProvider>
    );
}
