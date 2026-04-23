"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function CollapsibleSection({ title, children, defaultOpen = false, action }: { title: string, children: React.ReactNode, defaultOpen?: boolean, action?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-border rounded-lg overflow-hidden mb-4">
            <div className="w-full flex items-center justify-between bg-surface hover:bg-background transition-colors px-4 py-3 border-b border-transparent has-[button:hover]:bg-surface">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    className="flex items-center gap-2 font-medium flex-1 text-left"
                >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {title}
                </button>
                {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
            </div>
            <div className={`p-4 border-t border-border bg-background animate-fade-in ${isOpen ? '' : 'hidden'}`}>
                {children}
            </div>
        </div>
    );
}
