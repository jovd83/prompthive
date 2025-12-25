
"use server";

import * as cheerio from 'cheerio';

import { ScrapedPrompt, ScraperError } from "@/types/scraper";

export async function scrapeUrlForPrompts(url: string): Promise<ScrapedPrompt[]> {
    if (!url) throw new ScraperError("URL is required");

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'PromptHive-Scraper/1.0',
            }
        });

        if (!response.ok) {
            throw new ScraperError(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const prompts: ScrapedPrompt[] = [];

        $('h1, h2, h3').each((_, element) => {
            const $heading = $(element);
            const title = $heading.text().trim();

            if (title.length < 5 || title.length > 200) return;

            let content = "";
            let description = "";
            let tags: string[] = [];

            let $next = $heading.next();
            while ($next.length && !$next.is($heading.prop('tagName') || '')) {
                const nextTag = $next.prop('tagName') || '';
                const currentTag = $heading.prop('tagName') || '';
                if ($next.is('h1, h2, h3') && nextTag <= currentTag) break;

                if ($next.is('pre') || $next.is('code')) {
                    content += $next.text().trim() + "\n\n";
                } else if ($next.is('blockquote')) {
                    content += $next.text().trim() + "\n\n";
                } else if ($next.is('p')) {
                    const text = $next.text().trim();
                    if (!description && !content) {
                        description = text;
                    }
                }
                $next = $next.next();
            }

            if (content.trim()) {
                prompts.push({
                    title,
                    content: content.trim(),
                    description: description.substring(0, 200),
                    tags,
                    resource: url
                });
            } else if (description.trim()) {
                prompts.push({
                    title,
                    content: description.trim(),
                    description: "",
                    tags,
                    resource: url
                });
            }
        });

        if (prompts.length === 0) {
            const title = $('title').text() || 'Scraped Prompt';
            const codeBlock = $('pre, code, blockquote').first().text();
            const mainText = $('main, article, body').text().substring(0, 2000);

            prompts.push({
                title,
                content: codeBlock || mainText,
                description: "Table scraped from single page",
                tags: [],
                resource: url
            });
        }

        return prompts.slice(0, 50);
    } catch (error: unknown) {
        console.error("Scraping error:", error);
        if (error instanceof Error) {
            throw new ScraperError(error.message);
        }
        throw new ScraperError("Failed to scrape URL");
    }
}
