"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyToClipboard({ text, className = "", variant = "default" }: { text: string; className?: string; variant?: "default" | "icon" }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                throw new Error("Clipboard API unavailable");
            }
        } catch (err) {
            // Fallback for non-secure contexts (http)
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; // Avoid scrolling to bottom
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (e) {
                console.error("Copy failed", e);
            }
            document.body.removeChild(textArea);
        }
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
