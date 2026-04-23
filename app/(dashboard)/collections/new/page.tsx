import NewCollectionContent from "@/components/NewCollectionContent";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function NewCollectionPage({ searchParams }: { searchParams: Promise<{ parentId?: string }> }) {
    const session = await getServerSession(authOptions);
    // searchParams is unused here because Client Component reads it, BUT we need "collections".

    // We can just pass parentId if we wanted, but the client component reads it from URL.
    // However, for consistency with previous code, let's keep fetching collections.

    const collections = session ? await prisma.collection.findMany({
        where: { ownerId: session.user.id },
        orderBy: { title: "asc" },
    }) : [];

    return (
        <NewCollectionContent collections={collections} />
    );
}
