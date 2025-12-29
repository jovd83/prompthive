import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CollectionsList from "@/components/CollectionsList";
import { getHiddenCollectionIdsService } from "@/services/settings";
import { filterHiddenCollections } from "@/lib/collection-utils";

export default async function CollectionsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const hiddenCollectionIds = await getHiddenCollectionIdsService(session.user.id);

    const collections = await prisma.collection.findMany({
        where: {
            ownerId: session.user.id,
            id: { notIn: hiddenCollectionIds }
        },
        include: { _count: { select: { prompts: true } } },
        orderBy: { createdAt: "desc" },
    });

    const filteredCollections = filterHiddenCollections(collections as any[], hiddenCollectionIds);

    return <CollectionsList collections={filteredCollections} />;
}
