import { describe, it, expect, vi } from 'vitest';
import * as ScraperActions from './scraper';
import { ScraperError } from "@/types/scraper";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Scraper Actions', () => {
    it('scrapeUrlForPrompts should fail if url missing', async () => {
        await expect(ScraperActions.scrapeUrlForPrompts('')).rejects.toThrow('URL is required');
    });

    it('should throw if fetch fails', async () => {
        mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });
        await expect(ScraperActions.scrapeUrlForPrompts('http://test.com')).rejects.toThrow('Failed to fetch URL: Not Found');
    });

    it('should parse html and find prompts', async () => {
        const html = `
            <html>
                <body>
                    <h1>Test Prompt</h1>
                    <p>Description</p>
                    <pre>Prompt Content</pre>
                </body>
            </html>
        `;
        mockFetch.mockResolvedValue({
            ok: true,
            text: async () => html
        });

        const prompts = await ScraperActions.scrapeUrlForPrompts('http://test.com');
        expect(prompts).toHaveLength(1);
        expect(prompts[0].title).toBe('Test Prompt');
        expect(prompts[0].content).toContain('Prompt Content');
        expect(prompts[0].description).toBe('Description');
    });

    it('should fallback to whole page if no headers found', async () => {
        const html = `
            <html>
                <title>Fallback Title</title>
                <body>
                    <article>Some content here that is long enough.</article>
                </body>
            </html>
        `;
        mockFetch.mockResolvedValue({
            ok: true,
            text: async () => html
        });

        const prompts = await ScraperActions.scrapeUrlForPrompts('http://test.com');
        expect(prompts).toHaveLength(1);
        expect(prompts[0].title).toBe('Fallback Title');
        expect(prompts[0].content).toContain('Some content here');
    });
});
