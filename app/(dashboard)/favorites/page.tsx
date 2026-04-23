import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFavorites } from "@/actions/favorites";
import { redirect } from "next/navigation";
import FavoritesView from "@/components/FavoritesView";

export default async function FavoritesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/api/auth/signin");

    const params = await searchParams;
    const sort = (params.sort as string) || "date-desc";
    const search = (params.q as string) || "";

    // Map dashboard sort keys to favorites service keys if needed
    // Dashboard defaults: sort=date/alpha, order=asc/desc
    // Favorites service expects: date-asc, date-desc, alpha-asc, etc.
    let serviceSort = sort;
    if (params.sort && params.order) {
        if (params.sort === 'date') serviceSort = params.order === 'asc' ? 'date-asc' : 'date-desc';
        if (params.sort === 'alpha') serviceSort = params.order === 'asc' ? 'alpha-asc' : 'alpha-desc';
        if (params.sort === 'usage') serviceSort = 'count-desc'; // approximation
    }

    const favorites = await getFavorites(search, serviceSort);

    // Reuse SortControls component if possible, or build custom one. 
    // Since SortControls likely uses URL params "sort" and "order", we should try to match that pattern or implement specific logic.
    // Let's implement specific logic for favorites to keep it simpler or consistent with what I wrote in service.

    return (
        <FavoritesView
            favorites={favorites}
            search={search}
            serviceSort={serviceSort}
        />
    );
}
