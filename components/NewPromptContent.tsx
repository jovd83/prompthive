"use client";

import CreatePromptForm from "@/components/CreatePromptForm";
import { useLanguage } from "./LanguageProvider";
import { Collection, Tag } from "@prisma/client";

export default function NewPromptContent({
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
            <h1 className="text-3xl font-bold mb-8">{t('prompts.createTitle')}</h1>
            <CreatePromptForm
                collections={collections}
                tags={tags}
                initialCollectionId={initialCollectionId}
                tagColorsEnabled={tagColorsEnabled}
                privatePromptsEnabled={privatePromptsEnabled}
            />
        </div>
    );
}
