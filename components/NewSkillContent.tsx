"use client";

import CreateSkillForm from "@/components/CreateSkillForm";
import { useLanguage } from "./LanguageProvider";
import { Collection, Tag } from "@prisma/client";

export default function NewSkillContent({
    collections,
    tags,
    initialCollectionId,
    tagColorsEnabled,
    privatePromptsEnabled
}: {
    collections: (Collection & { _count?: { prompts: number } })[],
    tags: Tag[],
    initialCollectionId?: string,
    tagColorsEnabled?: boolean;
    privatePromptsEnabled?: boolean;
}) {
    const { t } = useLanguage();
    return (
        <div className="max-w-3xl mx-auto pb-12">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <span className="shrink-0 text-xl leading-none" title="Agent Skill">
                    🤖
                </span>
                {t('skills.createTitle') || "Create New Agent Skill"}
            </h1>
            <CreateSkillForm
                collections={collections as any}
                tags={tags}
                initialCollectionId={initialCollectionId}
                tagColorsEnabled={tagColorsEnabled}
            />
        </div>
    );
}
