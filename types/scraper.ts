
export type ScrapedPrompt = {
    title: string;
    content: string;
    description: string;
    tags: string[];
    resource?: string;
};

export class ScraperError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ScraperError";
    }
}
