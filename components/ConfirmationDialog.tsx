"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";

type ConfirmationDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
};

export default function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'info'
}: ConfirmationDialogProps) {
    const [mounted, setMounted] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                role="dialog"
                data-testid="confirmation-dialog"
                aria-modal="true"
                className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            >
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <AlertCircle className={variant === 'danger' ? 'text-red-500' : 'text-primary'} size={20} />
                        {title}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-muted-foreground">{description}</p>
                </div>

                <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="btn bg-background border border-border hover:bg-muted"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`btn ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
