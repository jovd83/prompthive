"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { GitMerge, MoreVertical, Edit, Trash2, Play } from "lucide-react";
import { deleteWorkflowAction } from "@/actions/workflows";
import { useLanguage } from "./LanguageProvider";

type WorkflowCardProps = {
    wf: {
        id: string;
        title: string;
        description: string | null;
        _count: {
            steps: number;
        };
    };
};

export default function WorkflowCard({ wf }: WorkflowCardProps) {
    const { t } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="card p-5 flex flex-col hover:border-primary/50 transition-colors group bg-surface border border-border h-full relative">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <GitMerge size={24} />
                </div>

                {/* Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className={`btn btn-ghost btn-sm btn-square ${isMenuOpen ? 'bg-muted' : ''}`}
                    >
                        <MoreVertical size={16} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                            <Link
                                href={`/workflows/${wf.id}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                <Edit size={14} /> {t('workflows.card.edit')}
                            </Link>

                            <form action={deleteWorkflowAction.bind(null, wf.id)}>
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors text-left"
                                >
                                    <Trash2 size={14} /> {t('workflows.card.delete')}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                <Link href={`/workflows/${wf.id}/edit`}>{wf.title}</Link>
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                {wf.description || t('workflows.card.noDesc')}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                <span>{wf._count.steps} {t('workflows.card.steps')}</span>
                <Link href={`/workflows/${wf.id}/run`} className="btn btn-sm btn-outline gap-2">
                    <Play size={14} /> {t('workflows.card.run')}
                </Link>
            </div>
        </div>
    );
}
