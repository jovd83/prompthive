"use client";

import Link from "next/link";
import { Copy, Eye, Clock, Heart, Check, Terminal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, nl, fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleFavorite } from "@/actions/favorites";
import { useSession, signIn } from "next-auth/react";
import { useLanguage } from "./LanguageProvider";
import { copyToClipboard } from "@/lib/clipboard";

interface PromptCardProps {
    prompt: {
        id: string;
        title: string;
        description: string | null;
        tags: { id: string; name: string }[];
        viewCount: number;
        copyCount: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: { email: string; username?: string | null };
        versions?: {
            content: string;
            resultImage: string | null;
            attachments?: { filePath: string; role: string }[];
        }[];
    };
    isFavorited?: boolean;
}

const localeMap: Record<string, any> = { en: enUS, nl: nl, fr: fr };

export default function PromptCard({ prompt, isFavorited: initialIsFavorited = false }: PromptCardProps) {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const latestVersion = prompt.versions?.[0];
    const promptContent = latestVersion?.content || t('prompts.noContent');

    // Determine result image: explicit resultImage field OR first attachment with role 'RESULT' that looks like an image
    let resultImage = latestVersion?.resultImage;
    if (!resultImage && latestVersion?.attachments) {
        const imgAtt = latestVersion.attachments.find(a =>
            a.role === 'RESULT' && /\.(jpg|jpeg|png|gif|webp)$/i.test(a.filePath)
        );
        if (imgAtt) resultImage = imgAtt.filePath;
    }

    const getThumbnailUrl = (url: string) => {
        if (url.startsWith('/uploads/')) {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            return `/uploads/thumb_${filename}`;
        }
        return url;
    };


    const { data: session } = useSession();

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!session?.user) {
            signIn();
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        const newState = !isFavorited;
        setIsFavorited(newState);

        try {
            await toggleFavorite(prompt.id);
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            setIsFavorited(!newState);
        } finally {
            setIsLoading(false);
        }
    };

    const [copyCount, setCopyCount] = useState(prompt.copyCount);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const success = await copyToClipboard(promptContent);

        if (success) {
            setIsCopied(true);
            setCopyCount(prev => prev + 1);
            setTimeout(() => setIsCopied(false), 2000);

            // Track copy event
            fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ promptId: prompt.id, type: "copy" }),
            }).then(res => {
                if (!res.ok) throw new Error("Analytics update failed");
            }).catch(err => {
                console.error(err);
                setCopyCount(prev => prev - 1); // Revert on error
            });
        }
    };

    const timeAgo = formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: false, locale: localeMap[language] || enUS });

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("promptId", prompt.id);
                // Optional: set ghost image or effect
            }}
            onClick={() => router.push(`/prompts/${prompt.id}`)}
            className="card group h-full flex flex-col cursor-pointer relative hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden border-border/60"
        >
            {/* 1. Header: Title, Fav, Stats */}
            <div className="flex justify-between items-start mb-3 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate" title={prompt.title}>
                        {prompt.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded" title={t('list.views')}>
                            <Eye size={12} /> {prompt.viewCount}
                        </span>
                        <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded" title={t('list.copies')}>
                            <Copy size={12} /> {copyCount}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleToggleFavorite}
                    className={`shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors ${isFavorited ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                    disabled={isLoading}
                    title={isFavorited ? t('prompts.removeFromFavorites') : t('prompts.addToFavorites')}
                >
                    <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
                </button>
            </div>

            {/* 2. Result Image Thumbnail */}
            {resultImage && (
                <div className="mb-3 rounded-md overflow-hidden bg-muted aspect-video relative border border-border/50">
                    <img
                        src={getThumbnailUrl(resultImage)}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('thumb_')) {
                                target.src = resultImage!;
                            }
                        }}
                        alt={t('prompts.resultImage')}
                        className="object-cover w-full h-full absolute inset-0"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
            )}

            {/* 3. Description (Abbreviated) */}
            {prompt.description && (
                <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
                    {prompt.description}
                </p>
            )}

            {/* 4. Prompt Preview & Copy */}
            <div className="bg-muted/50 rounded-md border border-border/50 p-2 mb-3 relative group/code">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 select-none">
                    <Terminal size={12} /> {t('list.promptPreview')}
                </div>
                <pre className="font-mono text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap break-words min-h-[3rem]">
                    {promptContent}
                </pre>
                {/* Copy Button Overlay */}
                <div className="absolute top-2 right-2">
                    <button
                        onClick={handleCopy}
                        className={`
                            flex items-center gap-1.5 text-[10px] font-medium py-1 px-2 rounded-md shadow-sm border transition-all
                            ${isCopied
                                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                            }
                        `}
                        title={t('prompts.copyContent')}
                    >
                        {isCopied ? <Check size={12} className={isCopied ? "text-green-600 dark:text-green-400" : ""} /> : <Copy size={12} />}
                        {isCopied ? t('list.copied') : t('list.copy')}
                    </button>
                </div>
            </div>

            {/* 5. Footer: Tags & Timestamp */}
            <div className="mt-auto pt-3 border-t border-border/50 flex flex-col gap-2">
                <div className="flex gap-1 flex-wrap w-full">
                    {prompt.tags && prompt.tags.slice(0, 3).map((tag) => (
                        <Link
                            key={tag.id}
                            href={`/?tags=${tag.id}`}
                            className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-secondary/50 text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            #{tag.name}
                        </Link>
                    ))}
                    {(!prompt.tags || prompt.tags.length === 0) && <span className="text-[10px] text-muted-foreground italic">{t('list.noTags')}</span>}
                </div>

                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        {t('list.by')} <span className="font-medium text-foreground">{prompt.createdBy?.username || prompt.createdBy?.email?.split('@')[0]}</span>
                    </span>
                    <span className="flex items-center gap-1" title={prompt.updatedAt.toString()}>
                        <Clock size={10} /> {t('list.updatedAgo').replace('{{time}}', timeAgo)}
                    </span>
                </div>
            </div>
        </div>
    );
}

