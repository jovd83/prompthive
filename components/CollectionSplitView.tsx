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

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6 relative">
            {/* List Column */}
            <div
                className="border-r border-border flex flex-col bg-surface relative shrink-0"
                style={{ width: isCollapsed ? "0px" : `${width}px`, transition: isResizing ? "none" : "width 0.3s ease", overflow: "hidden" }}
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

                {/* Drag Handle */}
                <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50"
                    onMouseDown={startResizing}
                />
            </div>

            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-4 left-0 z-10 bg-surface border border-border p-1 rounded-r-md shadow-sm hover:bg-background text-muted-foreground"
                style={{ left: isCollapsed ? "0" : `${width}px`, transition: isResizing ? "none" : "left 0.3s ease" }}
                title={isCollapsed ? "Expand List" : "Collapse List"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronRight className="rotate-180" size={14} />}
            </button>

            {/* Detail Column */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background p-6">
                {selectedPrompt ? (
                    <PromptDetail prompt={selectedPrompt} isFavorited={isFavorited} collectionPaths={collectionPath ? [collectionPath] : undefined} tagColorsEnabled={tagColorsEnabled} />
                ) : (
                    <CollectionGrid collection={collection} />
                )}
            </div>
        </div >
    );
}
