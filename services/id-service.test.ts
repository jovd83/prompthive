
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTechnicalId } from './id-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        technicalIdSequence: {
            upsert: vi.fn(),
        },
    },
}));

describe('generateTechnicalId', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate ID with correct prefix for simple names', async () => {
        // Mock upsert response
        (prisma.technicalIdSequence.upsert as any).mockResolvedValue({
            prefix: 'VIBE',
            lastValue: 1,
        });

        const id = await generateTechnicalId('Vibe Coding');

        expect(id).toBe('VIBE-1');
        expect(prisma.technicalIdSequence.upsert).toHaveBeenCalledWith({
            where: { prefix: 'VIBE' },
            update: { lastValue: { increment: 1 } },
            create: { prefix: 'VIBE', lastValue: 1 },
        });
    });

    it('should generate ID with correct prefix for single word names', async () => {
        (prisma.technicalIdSequence.upsert as any).mockResolvedValue({
            prefix: 'SALE',
            lastValue: 5,
        });

        const id = await generateTechnicalId('Sales');
        expect(id).toBe('SALE-5');
    });

    it('should handle short names by padding', async () => {
        (prisma.technicalIdSequence.upsert as any).mockResolvedValue({
            prefix: 'AIX',
            lastValue: 2,
        });

        const id = await generateTechnicalId('AI');
        expect(id).toBe('AIX-2'); // "AI" -> "AIX" (padded to 3 chars)
    });

    it('should handle special characters', async () => {
        (prisma.technicalIdSequence.upsert as any).mockResolvedValue({
            prefix: 'COOL',
            lastValue: 10,
        });

        const id = await generateTechnicalId('Cool & Stuff');
        // "Cool & Stuff" -> "COOLSTUFF" -> "COOL" (first 4)
        expect(prisma.technicalIdSequence.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { prefix: 'COOL' }
        }));
        expect(id).toBe('COOL-10');
    });

    it('should use default GEN prefix for empty/invalid names', async () => {
        (prisma.technicalIdSequence.upsert as any).mockResolvedValue({
            prefix: 'GEN',
            lastValue: 99,
        });

        const id = await generateTechnicalId('   ');
        expect(id).toBe('GEN-99');
    });
});
