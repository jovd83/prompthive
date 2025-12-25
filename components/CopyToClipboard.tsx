"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyToClipboard({ text, className = "", variant = "default" }: { text: string; className?: string; variant?: "default" | "icon" }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (variant === "icon") {
        return (
            <button
                onClick={handleCopy}
                className={`btn btn-sm btn-ghost btn-square ${className}`}
                title="Copy to clipboard"
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        );
    }

    return (
        <button
            onClick={handleCopy}
            className={`btn btn-sm btn-ghost gap-2 ${className}`}
            title="Copy to clipboard"
        >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
}
