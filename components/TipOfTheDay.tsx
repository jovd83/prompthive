"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lightbulb, ExternalLink } from "lucide-react";
import tipsData from "@/prompting_tips/prompt_tips.json";
import { useLanguage } from "./LanguageProvider";

// Define the Tip interface based on the JSON structure
interface Tip {
    title: string;
    short: string;
    long: string;
    resource_text: string;
    resource_url: string;
}

interface TipOfTheDayProps {
    className?: string;
}

export default function TipOfTheDay({ className = "" }: TipOfTheDayProps) {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const [tip, setTip] = useState<Tip | null>(null);

    useEffect(() => {
        // Select a random tip on mount
        // We could also use the date to make it deterministic per day:
        // const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        // const index = dayOfYear % tipsData.length;

        // For now, random on refresh as per plan decisions for variety
        const randomIndex = Math.floor(Math.random() * tipsData.length);
        setTip(tipsData[randomIndex]);
    }, []);

    if (!tip) return null;

    return (
        <div className={`bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-all duration-300 ${className}`}>
            <div
                className="flex items-start justify-between cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400 mt-0.5">
                        <Lightbulb size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            {tip.title}
                            <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                                {t('common.tipOfTheDay') || "Tip of the Day"}
                            </span>
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 mt-1 text-sm">
                            {tip.short}
                        </p>
                    </div>
                </div>
                <button
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    aria-label={isExpanded ? (t('common.collapseTip') || "Collapse tip") : (t('common.expandTip') || "Expand tip")}
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-4 pl-12 pr-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                        {tip.long}
                    </p>
                    {tip.resource_url && (
                        <a
                            href={tip.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink size={12} />
                            {tip.resource_text || t('common.learnMore') || "Learn more"}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
