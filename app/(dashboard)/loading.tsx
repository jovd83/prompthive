import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-pulse"></div>
                <Loader2 className="h-12 w-12 text-primary animate-spin absolute top-0 left-0" />
            </div>
            <p className="text-muted-foreground animate-pulse font-medium">Loading your Hive...</p>
        </div>
    );
}
