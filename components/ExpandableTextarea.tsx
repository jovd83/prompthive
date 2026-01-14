"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, Edit } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface ExpandableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    onValueChange?: (value: string) => void; // Optional if using standard onChange
    modalTitle?: string;
    modalDescription?: string;
}

export default function ExpandableTextarea({
    label,
    value,
    defaultValue,
    onChange,
    onValueChange,
    className = "input h-20 resize-y",
    placeholder,
    modalTitle,
    modalDescription,
    ...props
}: ExpandableTextareaProps) {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    // Initialize with value if present, otherwise defaultValue, otherwise empty string
    // casting defaultValue to string as it can be string | number | readonly string[]
    const [internalValue, setInternalValue] = useState(value !== undefined ? value : (defaultValue as string || ""));
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInternalValue(e.target.value);
        if (onChange) onChange(e);
        if (onValueChange) onValueChange(e.target.value);
    };

    const handleModalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInternalValue(e.target.value);
    };

    const handleSave = () => {
        // Trigger generic change event for parent forms if needed
        // But since we updated internal state, we might need to manually trigger the parent's onChange if they rely on it exclusively
        // However, most parents using this will likely pass a controlled value.
        // If controlled:
        if (onChange) {
            const event = {
                target: { value: internalValue, name: props.name },
                currentTarget: { value: internalValue, name: props.name }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
        }
        if (onValueChange) {
            onValueChange(String(internalValue));
        }
        setIsExpanded(false);
    };

    return (
        <div className="relative">
            <textarea
                value={value !== undefined ? value : internalValue}
                onChange={handleChange}
                className={className}
                placeholder={placeholder}
                {...props}
            />
            <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted"
                title={t('detail.actions.maximize') || "Maximize"}
            >
                <Maximize2 size={14} />
            </button>

            {isExpanded && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl h-[80vh] bg-background border border-border shadow-2xl rounded-lg flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-border">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Edit size={18} /> {modalTitle || label || "Editing"}
                                </h3>
                                {modalDescription && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {modalDescription}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 bg-muted/20">
                            <textarea
                                value={value !== undefined ? value : internalValue}
                                onChange={(e) => {
                                    handleChange(e);
                                }}
                                className="w-full h-full p-4 rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-mono text-sm leading-relaxed"
                                placeholder={placeholder || t('detail.placeholders.enterLargeText') || "Enter text here..."}
                                autoFocus
                            />
                        </div>
                        <div className="p-4 border-t border-border flex justify-end gap-2 bg-background rounded-b-lg">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="btn btn-primary px-6"
                            >
                                {t('detail.actions.done') || "Done"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
