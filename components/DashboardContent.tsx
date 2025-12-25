"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PromptCard from "@/components/PromptCard";
import SortControls from "@/components/SortControls";
import AdvancedSearch from "@/components/AdvancedSearch";
import { useLanguage } from "./LanguageProvider";

import TipOfTheDay from "@/components/TipOfTheDay";

type Prompt = any;

interface DashboardContentProps {
    searchParams: { [key: string]: string | string[] | undefined };
    hasFilters: boolean;
    searchResults: Prompt[];
    favoritePrompts: Prompt[];
    recentPrompts: Prompt[];
    newPrompts: Prompt[];
    popularPrompts: Prompt[];
    favoriteIds: string[];
    user?: { name?: string | null; id?: string };
    showPrompterTips?: boolean;
}

export default function DashboardContent({
    searchParams,
    hasFilters,
    searchResults,
    favoritePrompts,
    recentPrompts,
    newPrompts,
    popularPrompts,
    favoriteIds,
    user,
    showPrompterTips = true
}: DashboardContentProps) {
    const { t } = useLanguage();
    const favSet = new Set(favoriteIds);

    const q = (searchParams.q as string) || "";
    let pageTitle = t('prompts.searchResults');
    if (q) pageTitle = t('prompts.searchTitle').replace('{{query}}', q);

    if (hasFilters) {
        return (
            <div>
                {showPrompterTips && <TipOfTheDay className="mb-6" />}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold truncate" title={pageTitle}>{pageTitle}</h1>
                    <Link href="/prompts/new" className="btn btn-primary">
                        <Plus size={18} /> {t('prompts.newPrompt')}
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6 items-start justify-between relative">
                    <div className="flex-1 w-full md:max-w-md">
                        <AdvancedSearch />
                    </div>
                    <SortControls />
                </div>

                {searchResults.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-surface rounded-lg border border-border">
                        <p className="mb-4">{t('prompts.noResults')}</p>
                        <Link href="/prompts/new" className="text-primary hover:underline">
                            {t('prompts.createFirst')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((prompt) => (
                            <PromptCard key={prompt.id} prompt={prompt} isFavorited={favSet.has(prompt.id)} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            {showPrompterTips && <TipOfTheDay className="mb-6" />}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('prompts.dashboard')}</h1>
                <Link href="/prompts/new" className="btn btn-primary">
                    <Plus size={18} /> {t('prompts.newPrompt')}
                </Link>
            </div>

            {searchParams.deletedCollection && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {t('prompts.deletedCollection').replace('{{name}}', decodeURIComponent(searchParams.deletedCollection as string))}
                </div>
            )}

            {searchParams.importedCount && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {t('prompts.importedCount').replace('{{count}}', searchParams.importedCount as string)}
                    {searchParams.skippedCount && ` (${searchParams.skippedCount} skipped)`}
                </div>
            )}

            {searchParams.deletedPrompt && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {t('prompts.deletedPrompt').replace('{{name}}', decodeURIComponent(searchParams.deletedPrompt as string))}
                </div>
            )}

            <div className="mb-8">
                <AdvancedSearch />
            </div>

            {/* Favorites Section */}
            {user && favoritePrompts.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                            {t('prompts.favorites')}
                        </h2>
                        <Link href="/favorites" className="text-sm text-primary hover:underline">{t('prompts.viewAll')}</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {favoritePrompts.map((prompt) => (
                            <PromptCard key={prompt.id} prompt={prompt} isFavorited={true} />
                        ))}
                    </div>
                </section>
            )}

            <div className="space-y-10">
                {/* Recently Used By Me */}
                {user && recentPrompts.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                {t('prompts.recentlyUsed')}
                            </h2>
                            <Link href={`/?creator=${user.name}`} className="text-sm text-primary hover:underline">{t('prompts.viewAll')}</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recentPrompts.map((prompt) => (
                                <PromptCard key={prompt.id} prompt={prompt} isFavorited={favSet.has(prompt.id)} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Newly Created */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                            {t('prompts.newlyCreated')}
                        </h2>
                        <Link href="/?sort=date&order=desc" className="text-sm text-primary hover:underline">{t('prompts.viewAll')}</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {newPrompts.map((prompt) => (
                            <PromptCard key={prompt.id} prompt={prompt} isFavorited={favSet.has(prompt.id)} />
                        ))}
                    </div>
                </section>

                {/* Most Viewed */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                            {t('prompts.mostViewed')}
                        </h2>
                        <Link href="/?sort=usage&order=desc" className="text-sm text-primary hover:underline">{t('prompts.viewAll')}</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {popularPrompts.map((prompt) => (
                            <PromptCard key={prompt.id} prompt={prompt} isFavorited={favSet.has(prompt.id)} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
