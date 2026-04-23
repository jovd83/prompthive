"use client";

import { useState, useTransition } from "react";
import UnifiedSkillForm from "@/components/UnifiedSkillForm";
import { updateSkill } from "@/actions/skills";
import { CollectionWithPrompts, TagWithCount } from "@/types/prisma";
import { useLanguage } from "./LanguageProvider";

export default function EditSkillForm({
    skill,
    collections = [],
    tags = [],
    agentSkills = [],
    tagColorsEnabled = true,
}: {
    skill: any,
    collections?: CollectionWithPrompts[],
    tags?: TagWithCount[],
    agentSkills?: any[],
    tagColorsEnabled?: boolean,
}) {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            try {
                await updateSkill(formData);
            } catch (error: unknown) {
                if (error instanceof Error && error.message === "NEXT_REDIRECT") {
                    throw error;
                }
                const message = error instanceof Error ? error.message : "Failed to update skill.";
                console.error("Submission failed:", message);
                setError(message);
            }
        });
    };

    return (
        <UnifiedSkillForm
            mode="EDIT"
            initialValues={skill}
            collections={collections}
            tags={tags}
            agentSkills={agentSkills}
            tagColorsEnabled={tagColorsEnabled}
            onSubmit={handleSubmit}
            isPending={isPending}
            serverError={error === "Failed to update skill." ? t('form.errors.createVersionFailed') || error : error}
            cancelHref={`/skills/${skill.id}`}
        />
    );
}
