import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NewPromptContent from "@/components/NewPromptContent";

export const dynamic = 'force-dynamic';

export default async function NewPromptPage({ searchParams }: { searchParams: Promise<{ collectionId?: string }> }) {
    const session = await getServerSession(authOptions);
    const { collectionId } = await searchParams;

    const collections = session ? await prisma.collection.findMany({
        orderBy: { title: "asc" },
        include: { _count: { select: { prompts: true } } }
    }) : [];

    const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <NewPromptContent
            collections={collections}
            tags={tags}
            initialCollectionId={collectionId}
        />
    );
}
