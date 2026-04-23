"use client";

import { useLanguage } from "./LanguageProvider";
import { Heart } from "lucide-react";
import AdvancedSearch from "./AdvancedSearch";
import PromptCard from "./PromptCard";
import Link from "next/link";

interface FavoritesViewProps {
    favorites: any[];
    search: string;
    serviceSort: string;
}

export default function FavoritesView({ favorites, search, serviceSort }: FavoritesViewProps) {
    const { t } = useLanguage();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Heart className="text-red-500 fill-red-500" />
                    {t('favorites.title')}
                </h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6 items-start justify-between relative">
                <div className="flex-1 w-full md:max-w-md">
                    <AdvancedSearch basePath="/favorites" testId="favorites-search" />
                </div>
                <form className="flex gap-2 items-center">
                    <input type="hidden" name="q" value={search} />
                    <select
                        name="sort"
                        defaultValue={serviceSort}
                        className="input h-10 py-1 min-w-[140px]"
                        data-testid="favorites-sort"
                    >
                        <option value="date-desc">{t('favorites.sort.newest')}</option>
                        <option value="date-asc">{t('favorites.sort.oldest')}</option>
                        <option value="alpha-asc">{t('favorites.sort.az')}</option>
                        <option value="alpha-desc">{t('favorites.sort.za')}</option>
                    </select>
                    <button type="submit" className="btn btn-secondary h-10" data-testid="favorites-filter">{t('favorites.sort.button')}</button>
                    {(search || serviceSort !== 'date-desc') && (
                        <a href="/favorites" className="btn btn-ghost h-10 flex items-center" data-testid="favorites-clear">{t('favorites.sort.clear')}</a>
                    )}
                </form>
            </div>

            {
                favorites.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-surface rounded-lg border border-border">
                        <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="mb-4">{search ? t('favorites.empty.search') : t('favorites.empty.desc')}</p>
                        <p>{t('favorites.empty.action')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {favorites.map((prompt: any) => (
                            <PromptCard key={prompt.id} prompt={prompt} isFavorited={true} />
                        ))}
                    </div>
                )
            }
        </div >
    );
}
