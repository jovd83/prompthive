"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toggleFavorite } from "@/actions/favorites";
import { deletePrompt } from "@/actions/prompts";
import { useLanguage } from "@/components/LanguageProvider";

interface UsePromptActionsProps {
    promptId: string;
    promptTitle: string;
    initialIsFavorited?: boolean;
}

export function usePromptActions({ promptId, promptTitle, initialIsFavorited = false }: UsePromptActionsProps) {
    const { t } = useLanguage();
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    // Favorite State
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isFavLoading, setIsFavLoading] = useState(false);

    // Delete State
    const [isDeleting, setIsDeleting] = useState(false);

    // General Error State
    const [error, setError] = useState("");

    const handleToggleFavorite = async () => {
        if (!session?.user) {
            signIn();
            return;
        }

        if (isFavLoading) return;
        setIsFavLoading(true);
        const newState = !isFavorited;
        setIsFavorited(newState);
        try {
            await toggleFavorite(promptId);
        } catch (e) {
            console.error("Failed to toggle favorite:", e);
            setIsFavorited(!newState);
            setError(t('detail.errors.favoriteFailed') || "Failed to toggle favorite");
        } finally {
            setIsFavLoading(false);
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deletePrompt(promptId);
            const encodedTitle = encodeURIComponent(promptTitle);

            // Context-aware redirect
            if (pathname?.startsWith('/collections/')) {
                router.push(`${pathname}?deletedPrompt=${encodedTitle}`);
                router.refresh();
            } else {
                window.location.href = `/?deletedPrompt=${encodedTitle}`;
            }
        } catch (e) {
            setError(t('detail.errors.deleteFailed'));
            console.error(e);
            setIsDeleting(false);
        }
    };

    return {
        isFavorited,
        isFavLoading,
        handleToggleFavorite,
        isDeleting,
        setIsDeleting,
        confirmDelete,
        error,
        setError
    };
}
