"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "./LanguageProvider";

export type SortOption = 'alpha-asc' | 'alpha-desc' | 'date-new' | 'date-old' | 'count-desc';

type SortMenuProps = {
    currentSort: SortOption;
    onSort: (opt: SortOption) => void;
    onClose: () => void;
};

export default function SortMenu({ onSort, onClose, currentSort }: SortMenuProps) {
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
        { label: t('list.sort.az') || "A-Z", value: 'alpha-asc' },
        { label: t('list.sort.za') || "Z-A", value: 'alpha-desc' },
        { label: t('list.sort.newest') || "Newest", value: 'date-new' },
        { label: t('list.sort.oldest') || "Oldest", value: 'date-old' },
        { label: t('list.sort.mostItems') || "Most Items", value: 'count-desc' },
    ];

    return (
        <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-40 bg-surface border border-border rounded-md shadow-lg p-1 text-sm">
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
}
