"use client";

import Link from "next/link";
import { Plus, Folder, MoreHorizontal } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import CollectionTree from "./CollectionTree";
import { useState, useMemo } from "react";
import SortMenu, { SortOption } from "./SortMenu";
import { computeRecursiveCounts, CollectionWithCount } from "@/lib/collection-utils";

export default function CollectionsList({ collections }: { collections: CollectionWithCount[] }) {
    const { t } = useLanguage();

    const [sortOrder, setSortOrder] = useState<SortOption>('date-new');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

    // Compute recursive counts to enable sorting by count
    // Note: CollectionTree also does this, but we need it here for sorting.
    // The cost is negligible for reasonable collection sizes (<1000).
    const countMap = useMemo(() => computeRecursiveCounts(collections), [collections]);

    const sortedCollections = useMemo(() => {
        // We need to sort the flat list so that when CollectionTree builds the tree,
        // it processes nodes in the desired order.
        // HOWEVER, CollectionTree builds the tree based on parentId.
        // It iterates the input array to populate children arrays.
        // If we want CHILDREN to be sorted, we need to sort the input array.
        // But simply sorting the input array might not guarantee children order if `buildTree` logic pushes to children array in order of appearance.
        // (Verified: buildTree iterates items and pushes to lookup[parentId].children. So input order matters.)

        return [...collections].sort((a, b) => {
            const countA = countMap.get(a.id)?.totalPrompts || 0;
            const countB = countMap.get(b.id)?.totalPrompts || 0;
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            switch (sortOrder) {
                case 'alpha-asc': return a.title.localeCompare(b.title);
                case 'alpha-desc': return b.title.localeCompare(a.title);
                case 'date-new': return dateB - dateA;
                case 'date-old': return dateA - dateB;
                case 'count-desc': return countB - countA;
                default: return 0;
            }
        });
    }, [collections, sortOrder, countMap]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('collections.title')}</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                            className="btn btn-outline flex items-center gap-2"
                            title={t('list.sort.button') || "Sort"}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {isSortMenuOpen && (
                            <SortMenu
                                currentSort={sortOrder}
                                onSort={(s) => { setSortOrder(s); setIsSortMenuOpen(false); }}
                                onClose={() => setIsSortMenuOpen(false)}
                            />
                        )}
                    </div>
                    <Link href="/collections/new" className="btn btn-primary">
                        <Plus size={18} /> {t('collections.newCollection')}
                    </Link>
                </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-4">
                <CollectionTree collections={sortedCollections} mode="navigation" />
            </div>
        </div>
    );
}
