import { FileText } from "lucide-react";
import PromptCard from "@/components/PromptCard";
import { CollectionWithPrompts } from "@/types/prisma";

interface CollectionGridProps {
    collection: CollectionWithPrompts;
    tagColorsEnabled?: boolean;
}

export default function CollectionGrid({ collection, tagColorsEnabled = true }: CollectionGridProps) {
    if (collection.prompts.length > 0) {
        return (
            <div className="h-full overflow-y-auto">
                <div className="mb-6">
                    <div className="flex flex-col gap-2 mb-6">
                        <h2 className="text-2xl font-bold">{collection.title}</h2>
                        {collection.description && <p className="text-muted-foreground">{collection.description}</p>}
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4">
                        {collection.prompts.map((prompt: any) => (
                            <PromptCard key={prompt.id} prompt={prompt} isFavorited={prompt.isFavorited} tagColorsEnabled={tagColorsEnabled} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText size={32} className="opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">Select a prompt</h2>
            <p className="max-w-md text-center">
                Choose a prompt from the list on the left to view its details, or create a new one to get started.
            </p>
            {collection.description && (
                <div className="mt-8 p-4 bg-muted/30 rounded-lg max-w-lg text-center">
                    <h3 className="font-bold text-sm mb-1">About this collection</h3>
                    <p className="text-sm">{collection.description}</p>
                </div>
            )}
        </div>
    );
}
