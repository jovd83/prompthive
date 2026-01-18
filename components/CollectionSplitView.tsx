"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChevronRight } from "lucide-react";
import PromptDetail from "@/components/PromptDetail";
import CollectionSidebar from "./collection-view/CollectionSidebar";
import CollectionGrid from "./collection-view/CollectionGrid";
import { CollectionWithPrompts, PromptWithRelations, TagWithCount } from "@/types/prisma";
import { ROLES, hasPermission } from "@/lib/permissions";

interface CollectionSplitViewProps {
    collection: CollectionWithPrompts;
    selectedPrompt?: PromptWithRelations | null;
    promptId?: string;
    currentUserId: string;
    collectionPath?: { id: string; title: string }[];
    isFavorited?: boolean;
    tags?: TagWithCount[];
    tagColorsEnabled?: boolean;
}

export default function CollectionSplitView({ collection, selectedPrompt, promptId, currentUserId, collectionPath, isFavorited, tags = [], tagColorsEnabled = true }: CollectionSplitViewProps) {
    const { data: session } = useSession();
    const isGuest = session?.user?.role === ROLES.GUEST;
    const canCreatePrompt = hasPermission(session?.user, 'create:prompt');
    const [width, setWidth] = useState(350);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Resizing logic
    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resizeWithMovement = (e: MouseEvent) => {
        if (isResizing) {
            setWidth(prev => {
                const newW = prev + e.movementX;
                if (newW < 200) return 200;
                if (newW > 800) return 800;
                return newW;
            });
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resizeWithMovement);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resizeWithMovement);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resizeWithMovement);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing]);

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Width style logic
    const sidebarStyle = isMobile
        ? { width: '100%' }
        : { width: isCollapsed ? "0px" : `${width}px`, transition: isResizing ? "none" : "width 0.3s ease", overflow: "hidden" };

    // Visibility logic
    const showSidebar = !isMobile || (isMobile && !selectedPrompt);
    const showDetail = !isMobile || (isMobile && selectedPrompt);

    return (
        <div className={`flex flex-col md:flex-row h-[calc(100vh-4rem)] -m-4 md:-m-6 relative ${isMobile ? 'overflow-x-hidden' : ''}`}>
            {/* List Column */}
            <div
                className={`border-r border-border flex flex-col bg-surface relative shrink-0 ${showSidebar ? 'flex' : 'hidden'}`}
                style={sidebarStyle}
                data-testid="collection-list-column"
            >
                {/* Render the Sidebar Content */}
                <CollectionSidebar
                    collection={collection}
                    promptId={promptId}
                    currentUserId={currentUserId}
                    isGuest={isGuest}
                    tagColorsEnabled={tagColorsEnabled}
                    tags={tags}
                />

                {/* Drag Handle - Desktop Only */}
                {!isMobile && (
                    <div
                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50"
                        onMouseDown={startResizing}
                    />
                )}
            </div>

            {/* Collapse/Expand Button - Desktop Only */}
            {!isMobile && (
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-4 left-0 z-10 bg-surface border border-border p-1 rounded-r-md shadow-sm hover:bg-background text-muted-foreground"
                    style={{ left: isCollapsed ? "0" : `${width}px`, transition: isResizing ? "none" : "left 0.3s ease" }}
                    title={isCollapsed ? "Expand List" : "Collapse List"}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronRight className="rotate-180" size={14} />}
                </button>
            )}

            {/* Detail Column */}
            <div
                className={`flex-1 overflow-y-auto custom-scrollbar bg-background p-4 md:p-6 ${showDetail ? 'block' : 'hidden'}`}
                data-testid="collection-detail-column"
            >
                {selectedPrompt ? (
                    <PromptDetail prompt={selectedPrompt} isFavorited={isFavorited} collectionPaths={collectionPath ? [collectionPath] : undefined} tagColorsEnabled={tagColorsEnabled} />
                ) : (
                    // On mobile, if no prompt selected, we show sidebar. So this branch is mostly for Desktop when no prompt selected.
                    // But if isMobile && !selectedPrompt, showDetail is false, so this hidden.
                    // If !isMobile && !selectedPrompt, showDetail is true, CollectionGrid shown. Correct.
                    <CollectionGrid collection={collection} />
                )}
            </div>
        </div >
    );
}
