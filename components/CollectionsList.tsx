"use client";

import Link from "next/link";
import { Plus, Folder } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type CollectionWithCount = {
    id: string;
    title: string;
    _count: { prompts: number };
};

export default function CollectionsList({ collections }: { collections: CollectionWithCount[] }) {
    const { t } = useLanguage();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('collections.title')}</h1>
                <Link href="/collections/new" className="btn btn-primary">
                    <Plus size={18} /> {t('collections.newCollection')}
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                    <Link
                        key={collection.id}
                        href={`/collections/${collection.id}`}
                        className="card hover:border-primary transition-colors group flex items-center gap-4"
                    >
                        <div className="bg-primary/10 p-3 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Folder size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{collection.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('collections.promptsCount').replace('{{count}}', collection._count.prompts.toString())}
                            </p>
                        </div>
                    </Link>
                ))}

                {collections.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-surface rounded-lg border border-border">
                        <p className="mb-4">{t('collections.noCollections')}</p>
                        <Link href="/collections/new" className="text-primary hover:underline">
                            {t('collections.createFirst')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
