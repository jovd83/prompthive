import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CONFIG_ID } from "@/lib/constants";
import NewSkillContent from "@/components/NewSkillContent";
import { getSettingsService } from "@/services/settings";

export const dynamic = 'force-dynamic';

export default async function NewSkillPage({ searchParams }: { searchParams: Promise<{ collectionId?: string }> }) {
    const session = await getServerSession(authOptions);
    const { collectionId } = await searchParams;

    const collections = session ? await prisma.collection.findMany({
        orderBy: { title: "asc" },
        include: { _count: { select: { prompts: true } } }
    }) : [];

    const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
    });

    const settings = session?.user?.id ? await getSettingsService(session.user.id) : null;
    const globalConfig = await prisma.globalConfiguration.findUnique({ where: { id: CONFIG_ID.GLOBAL } });

    return (
        <NewSkillContent
            collections={collections}
            tags={tags}
            initialCollectionId={collectionId}
            tagColorsEnabled={settings?.tagColorsEnabled ?? true}
            privatePromptsEnabled={globalConfig?.privatePromptsEnabled ?? false}
        />
    );
}
