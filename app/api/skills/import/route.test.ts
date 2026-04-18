import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('POST /api/skills/import', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 if user is not authenticated', async () => {
        (getServerSession as any).mockResolvedValue(null);
        
        const req = new NextRequest('http://localhost:3100/api/skills/import', {
            method: 'POST',
            body: JSON.stringify({ repoUrl: 'https://github.com/test/repo' })
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('returns 403 if user is a GUEST', async () => {
        (getServerSession as any).mockResolvedValue({ user: { role: 'GUEST' } });
        
        const req = new NextRequest('http://localhost:3100/api/skills/import', {
            method: 'POST',
            body: JSON.stringify({ repoUrl: 'https://github.com/test/repo' })
        });

        const res = await POST(req);
        expect(res.status).toBe(403);
    });

    it('returns 400 if repoUrl is missing', async () => {
        (getServerSession as any).mockResolvedValue({ user: { role: 'USER' } });
        
        const req = new NextRequest('http://localhost:3100/api/skills/import', {
            method: 'POST',
            body: JSON.stringify({})
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('successfully extracts github repository details and creates a default command', async () => {
        (getServerSession as any).mockResolvedValue({ user: { role: 'USER' } });
        
        // Mock GitHub API response
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                name: 'cool-agent-skill',
                description: 'A very cool skill for testing.'
            })
        });

        const req = new NextRequest('http://localhost:3100/api/skills/import', {
            method: 'POST',
            body: JSON.stringify({ repoUrl: 'https://github.com/cool-user/cool-agent-skill' })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.title).toBe('cool-agent-skill');
        expect(data.description).toBe('A very cool skill for testing.');
        expect(data.installCommand).toBe('npx skills add cool-user/cool-agent-skill');
    });

    it('handles unexpected formats gracefully', async () => {
        (getServerSession as any).mockResolvedValue({ user: { role: 'USER' } });
        
        const req = new NextRequest('http://localhost:3100/api/skills/import', {
            method: 'POST',
            body: JSON.stringify({ repoUrl: 'https://not-github.com/test/repo' })
        });

        const res = await POST(req);
        const data = await res.json();
        
        expect(res.status).toBe(400);
        expect(data.error).toBe('Invalid GitHub repository URL');
    });
});
