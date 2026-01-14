"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import Link from "next/link";
import { Tag } from "@prisma/client";

interface TagListProps {
    tags: Tag[];
    tagColorsEnabled: boolean;
    t: (key: string) => string;
}

export default function TagList({ tags, tagColorsEnabled = true, t }: TagListProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleCount, setVisibleCount] = useState(tags.length);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset visibility when tags change
    useLayoutEffect(() => {
        setVisibleCount(tags.length);
    }, [tags]);

    // Measure and slice
    useLayoutEffect(() => {
        if (isExpanded) {
            return;
        }

        const container = containerRef.current;
        if (!container || !container.children.length) return;

        // If we are currently showing a subset, we don't measure because we can't see the overflow
        // Measurement only happens when we anticipate a full render (visibleCount === tags.length)
        if (visibleCount !== tags.length) return;

        // Check overflow
        const children = Array.from(container.children) as HTMLElement[];
        // Note: children includes tags + potentially buttons if rendered.
        // At this stage (visibleCount === tags.length), the "View All" button is NOT rendered.
        // We only have tags.

        const baseTop = children[0].offsetTop;
        const containerWidth = container.offsetWidth;
        let limit = tags.length;

        // Find first item that wraps
        for (let i = 0; i < tags.length; i++) {
            if (children[i].offsetTop > baseTop) {
                limit = i;
                break;
            }
        }

        // If we found a wrapping point
        if (limit < tags.length) {
            // We need to fit the "View All" button on the first line.
            // Estimate button width + gap. 
            // "View all" is short, but let's be safe. 80px should cover most languages "Voir tout", "Alle anzeigen".
            // The gap is 8px (gap-2).
            // "View all" is short, but "Alle weergeven" (NL) is longer. ~14 chars.
            // Safe bet: 150px.
            const buttonWidth = 150;
            const gap = 8;

            // Note: Since TagList is 'relative', child.offsetLeft is relative to the TagList container (start = 0).
            // rowRight is effectively the X-coordinate of the specific tag's right edge.

            // Iteratively reduce limit until button fits
            while (limit > 0) {
                const lastVisible = children[limit - 1];
                const rowRight = lastVisible.offsetLeft + lastVisible.offsetWidth;
                const available = containerWidth - rowRight;

                if (available >= (buttonWidth + gap)) {
                    break;
                }
                limit--;
            }

            setVisibleCount(limit);
        }

    }, [tags, isExpanded, visibleCount]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (!isExpanded) {
                // Force reset to trigger measurement
                setVisibleCount(tags.length);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded, tags]);

    return (
        <div ref={containerRef} className={`relative flex gap-2 flex-wrap items-center w-full transition-all duration-200 ${!isExpanded ? 'max-h-[36px] overflow-hidden' : ''}`}>
            {tags.map((tag, i) => {
                const style = tagColorsEnabled && (tag as any).color ? {
                    backgroundColor: `${(tag as any).color}20`,
                    color: (tag as any).color,
                    borderColor: `${(tag as any).color}40`,
                } : undefined;

                // Hide items beyond visibleCount if not expanded
                // We use display:none to remove them from flow/visibility
                if (!isExpanded && i >= visibleCount) return null;

                return (
                    <Link
                        key={tag.id}
                        href={`/?tags=${tag.id}`}
                        className={`px-2 py-0.5 rounded-full text-xs border transition-colors whitespace-nowrap ${!style ? "bg-secondary hover:bg-primary hover:text-primary-foreground border-transparent" : "hover:brightness-110"}`}
                        style={style}
                    >
                        #{tag.name}
                    </Link>
                );
            })}

            {!isExpanded && visibleCount < tags.length && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap font-medium self-center"
                >
                    {t('tags.viewAll') || "View all"}
                </button>
            )}

            {isExpanded && tags.length > visibleCount && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap font-medium self-center"
                >
                    {t('tags.showLess') || "Show less"}
                </button>
            )}
        </div>
    );
}
