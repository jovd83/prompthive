"use client";

import { useLanguage } from "./LanguageProvider";
import Link from "next/link";
import { Plus, GitMerge } from "lucide-react";
import WorkflowCard from "./WorkflowCard";

interface WorkflowsViewProps {
    workflows: any[];
}

export default function WorkflowsView({ workflows }: WorkflowsViewProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {t('workflows.title')} <span className="text-sm font-normal text-muted-foreground ml-2">{t('workflows.beta')}</span>
                    </h1>
                    <p className="text-muted-foreground">{t('workflows.subtitle')}</p>
                </div>
                <Link href="/workflows/new" className="btn btn-primary">
                    <Plus size={18} className="mr-2" />
                    {t('workflows.new')}
                </Link>
            </div>

            {workflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-lg bg-muted/20">
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <GitMerge size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t('workflows.empty.title')}</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-6">
                        {t('workflows.empty.desc')}
                    </p>
                    <Link href="/workflows/new" className="btn btn-primary">
                        {t('workflows.create')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workflows.map((wf: any) => (
                        <WorkflowCard key={wf.id} wf={wf} />
                    ))}
                </div>
            )}
        </div>
    );
}
