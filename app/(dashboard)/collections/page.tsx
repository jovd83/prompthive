import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CollectionsList from "@/components/CollectionsList";

export default async function CollectionsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const collections = await prisma.collection.findMany({
        where: { ownerId: session.user.id, parentId: null },
        include: { _count: { select: { prompts: true } } },
        orderBy: { createdAt: "desc" },
    });

    return <CollectionsList collections={collections} />;
}
