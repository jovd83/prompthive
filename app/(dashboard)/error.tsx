'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 mb-6">
                <AlertCircle size={48} />
            </div>

            <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                We encountered an error while loading the dashboard. This might be a temporary connection issue.
            </p>

            {error.message && (
                <div className="mb-8 p-3 bg-muted rounded border border-border text-xs font-mono max-w-lg overflow-auto">
                    {error.message}
                </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
                <button
                    onClick={() => reset()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <RefreshCcw size={18} />
                    Try Again
                </button>

                <Link href="/" className="btn btn-ghost border border-border flex items-center gap-2">
                    <Home size={18} />
                    Go Home
                </Link>
            </div>
        </div>
    );
}
