"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MoreHorizontal, ArrowUp, ArrowDown, Check } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function SortControls() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentSort = searchParams.get("sort") || "date";
    const currentOrder = searchParams.get("order") || "desc";

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const applySort = (sort: string, order: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", sort);
        params.set("order", order);
        router.push(`${pathname}?${params.toString()}`);
        setIsOpen(false);
    };

    const SortOption = ({ sort, order, label }: { sort: string, order: string, label: string }) => {
        const isActive = currentSort === sort && currentOrder === order;
        return (
            <button
                onClick={() => applySort(sort, order)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                role="menuitem"
            >
                <div className={`w-4 flex items-center justify-center ${isActive ? "opacity-100" : "opacity-0"}`}>
                    <Check size={14} />
                </div>
                {label}
            </button>
        );
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors"
                title={t('list.views')}
                aria-label="Sort options"
                aria-expanded={isOpen}
            >
                <MoreHorizontal size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="py-1" role="menu">
                        <SortOption sort="alpha" order="asc" label={t('list.sort.az')} />
                        <SortOption sort="alpha" order="desc" label={t('list.sort.za')} />
                        <SortOption sort="date" order="desc" label={t('list.sort.newest')} />
                        <SortOption sort="date" order="asc" label={t('list.sort.oldest')} />
                    </div>
                </div>
            )}
        </div>
    );
}
