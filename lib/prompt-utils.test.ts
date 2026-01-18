
import { describe, it, expect } from 'vitest';
import { getDisplayName } from './prompt-utils';

describe('getDisplayName', () => {
    it('returns originalName if present', () => {
        const att = {
            filePath: '/123-some-file.txt',
            originalName: 'my-file.txt'
        };
        expect(getDisplayName(att)).toBe('my-file.txt');
    });

    it('returns cleaned filename from filePath if originalName is missing', () => {
        const att = {
            filePath: '/123456-file.txt'
        };
        expect(getDisplayName(att)).toBe('file.txt');
    });

    it('handles legacy file paths with confusing names', () => {
        const att = {
            filePath: '/123-123-file.txt'
        };
        expect(getDisplayName(att)).toBe('123-file.txt');
    });

    it('handles files without prefix (implausible but robust)', () => {
        const att = {
            filePath: '/simple.txt'
        };
        expect(getDisplayName(att)).toBe('simple.txt');
    });

    it('handles deep paths', () => {
        const att = {
            filePath: '/uploads/2023/123-doc.pdf'
        };
        expect(getDisplayName(att)).toBe('doc.pdf');
    });
});
