import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function DashboardNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-6">
                <Search size={48} />
            </div>

            <h1 className="text-3xl font-bold mb-2">Resource not found</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                The prompt, collection, or workflow you are looking for does not exist or has been moved.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/" className="btn btn-primary flex items-center gap-2">
                    <Home size={18} />
                    Back to Dashboard
                </Link>

                <button
                    className="btn btn-ghost border border-border flex items-center gap-2"
                // Using a small script to go back in browser history if possible
                >
                    <ArrowLeft size={18} />
                    Go Back
                </button>
            </div>
        </div>
    );
}
