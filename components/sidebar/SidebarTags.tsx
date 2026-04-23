"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type SortOption = 'alpha-asc' | 'alpha-desc' | 'date-new' | 'date-old' | 'count-desc';

const TagOptionsMenu = ({
    onSort,
    onClose,
    currentSort
}: {
    onSort: (opt: SortOption) => void;
    onClose: () => void;
    currentSort: SortOption;
}) => {
    const { t } = useLanguage();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const options: { label: string; value: SortOption }[] = [
        { label: t('list.sort.az'), value: 'alpha-asc' },
        { label: t('list.sort.za'), value: 'alpha-desc' },
        { label: t('list.sort.newest'), value: 'date-new' },
        { label: t('list.sort.oldest'), value: 'date-old' },
        { label: t('list.sort.mostItems'), value: 'count-desc' },
    ];

    return (
        <div ref={ref} className="absolute right-2 top-8 z-50 w-48 bg-surface border border-border rounded-md shadow-lg p-1 text-sm">
            <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('common.sort')}
            </div>
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onSort(opt.value)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between ${currentSort === opt.value ? "text-primary font-medium bg-primary/5" : ""}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

export const SidebarTags = ({ tags = [] }: { tags?: any[] }) => {
    const { t } = useLanguage();
    const [isTagsOpen, setIsTagsOpen] = useState(true);
    const [tagSort, setTagSort] = useState<SortOption>('alpha-asc');
    const [showTagMenu, setShowTagMenu] = useState(false);

    const sortedTags = [...tags].sort((a, b) => {
        if (tagSort === 'alpha-asc') return a.name.localeCompare(b.name);
        if (tagSort === 'alpha-desc') return b.name.localeCompare(a.name);
        if (tagSort === 'date-new') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (tagSort === 'date-old') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        if (tagSort === 'count-desc') return (b._count?.prompts || 0) - (a._count?.prompts || 0);
        return 0;
    });

    return (
        <div className="pt-6 mt-4 border-t border-border">
            <div className="flex items-center justify-between px-4 mb-3 relative group/header">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsTagsOpen(!isTagsOpen)}
                        className="text-muted-foreground hover:text-primary transition-all p-1 rounded-md hover:bg-background shadow-sm border border-transparent hover:border-border"
                        title={isTagsOpen ? "Collapse Tags" : "Expand Tags"}
                    >
                        {isTagsOpen ? <ChevronDown size={14} className="opacity-70" /> : <ChevronRight size={14} className="opacity-70" />}
                    </button>
                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('common.tags')}</h2>
                </div>
                <button
                    onClick={() => setShowTagMenu(!showTagMenu)}
                    className="text-muted-foreground hover:text-primary transition-all p-1 rounded-md hover:bg-background border border-transparent hover:border-border opacity-0 group-hover/header:opacity-100"
                    title="Sort Tags"
                >
                    <MoreHorizontal size={14} />
                </button>
                {showTagMenu && (
                    <TagOptionsMenu
                        currentSort={tagSort}
                        onSort={(s) => { setTagSort(s); setShowTagMenu(false); }}
                        onClose={() => setShowTagMenu(false)}
                    />
                )}
            </div>
            {isTagsOpen && (
                <div className="flex flex-wrap gap-1.5 px-3 animate-fade-in">
                    {sortedTags.map((tag) => (
                        <Link
                            key={tag.id}
                            href={`/?tags=${tag.id}`}
                            className="inline-block px-2.5 py-1 text-[11px] font-medium bg-secondary/50 text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-md transition-all duration-200 border border-border/50 hover:border-primary hover:scale-105 hover:shadow-sm truncate max-w-full"
                            title={`${tag.name} (${tag._count?.prompts || 0})`}
                        >
                            <span className="opacity-70 font-bold mr-0.5">#</span>{tag.name}
                        </Link>
                    ))}
                    {sortedTags.length === 0 && (
                        <p className="text-[11px] text-muted-foreground italic px-1">{t('common.noTags')}</p>
                    )}
                </div>
            )}
        </div>
    );
};
