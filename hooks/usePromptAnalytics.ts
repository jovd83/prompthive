"use client";

import { useEffect, useRef } from "react";

export function usePromptAnalytics(promptId: string) {
    const viewTracked = useRef(false);

    useEffect(() => {
        if (viewTracked.current) return;
        viewTracked.current = true;
        fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promptId, type: "view" }),
        }).catch(err => console.error("Analytics error:", err));
    }, [promptId]);
}
