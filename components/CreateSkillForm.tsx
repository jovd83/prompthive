"use client";

import { useTransition, useState } from "react";
import UnifiedSkillForm from "@/components/UnifiedSkillForm";
import { createSkill } from "@/actions/skills";
import { CollectionWithPrompts, TagWithCount } from "@/types/prisma";

export default function CreateSkillForm({
    collections,
    tags,
    initialCollectionId,
    tagColorsEnabled = true,
}: {
    collections: CollectionWithPrompts[],
    tags: TagWithCount[],
    initialCollectionId?: string,
    tagColorsEnabled?: boolean,
}) {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setServerError(null);
        startTransition(async () => {
            try {
                await createSkill(formData);
            } catch (err: any) {
                // If the error message is simply NEXT_REDIRECT, don't show it as an error
                if (err.message === 'NEXT_REDIRECT' || err?.digest?.includes('NEXT_REDIRECT')) {
                    throw err; // Let Next.js handle the redirect
                }
                setServerError(err.message || "Failed to create skill");
            }
        });
    };

    return (
        <UnifiedSkillForm
            mode="CREATE"
            collections={collections}
            tags={tags}
            tagColorsEnabled={tagColorsEnabled}
            onSubmit={handleSubmit}
            isPending={isPending}
            serverError={serverError}
            initialValues={{ collectionId: initialCollectionId }}
        />
    );
}
