import { prisma } from "@/lib/prisma";
import EditPromptContent from "@/components/EditPromptContent";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettingsService } from "@/services/settings";

export const dynamic = 'force-dynamic';

export default async function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const prompt = await prisma.prompt.findUnique({
        where: { id },
        include: {
            versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
                include: { attachments: true },
            },
            collections: true,
            tags: true,
        },
    });

    if (!prompt) notFound();

    // Fetch available collections
    const collections = await prisma.collection.findMany({
        orderBy: { title: "asc" },
        include: { _count: { select: { prompts: true } } }
    });

    // Fetch tags
    const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
    });

    const session = await getServerSession(authOptions);
    const settings = session?.user?.id ? await getSettingsService(session.user.id) : null;
    const globalConfig = await prisma.globalConfiguration.findUnique({ where: { id: "GLOBAL" } });

    return (
        <EditPromptContent
            prompt={prompt}
            latestVersion={prompt.versions[0]}
            collections={collections}
            tags={tags}
            tagColorsEnabled={settings?.tagColorsEnabled ?? true}
            privatePromptsEnabled={globalConfig?.privatePromptsEnabled ?? false}
        />
    );
}
