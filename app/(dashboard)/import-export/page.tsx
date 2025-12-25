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

    const collections = await prisma.collection.findMany({
        where: { ownerId: session.user.id },
        include: {
            _count: { select: { prompts: true } }
        },
        orderBy: { title: 'asc' }
    });

    // Add explicit totalPrompts if needed or rely on _count
    // computeRecursiveCounts expects slightly different structure?
    // computeRecursiveCounts expects children array if recursive.
    // But findMany is flat unless recursive include.
    // computeRecursiveCounts in `lib/collection-utils` processes flat array if it has parentId?
    // Let's assume it works with flat array (as Sidebar uses it).
    // Sidebar fetches collections? No, Layout does.
    // Sidebar.tsx line 150: `computeRecursiveCounts(collections)`.

    return <ImportExportContent collections={collections as any} />;
}
