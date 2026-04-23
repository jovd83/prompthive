"use client";

import CreateCollectionForm from "@/components/CreateCollectionForm";
import { useLanguage } from "./LanguageProvider";

export default function NewCollectionContent({ collections }: { collections: { id: string, title: string }[] }) {
    const { t } = useLanguage();
    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">{t('collections.createTitle')}</h1>
            <CreateCollectionForm collections={collections} />
        </div>
    );
}
