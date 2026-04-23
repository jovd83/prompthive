import { describe, it, expect, vi } from 'vitest';
import { detectFormat } from './import-utils';
import { computeRecursiveCounts, filterHiddenCollections } from './collection-utils';

describe('Import Utils', () => {
    describe('detectFormat', () => {
        it('should detect PromptCat object', () => {
            expect(detectFormat({ prompts: [] })).toBe('PROMPTCAT');
            expect(detectFormat({ folders: [] })).toBe('PROMPTCAT');
        });

        it('should detect PromptCat array item', () => {
            const item = { body: 'content', versions: undefined };
            expect(detectFormat([item])).toBe('PROMPTCAT');
        });

        it('should detect Standard', () => {
            expect(detectFormat({ other: [] })).toBe('STANDARD');
            expect(detectFormat([{ title: 'T', versions: [] }])).toBe('STANDARD');
            expect(detectFormat([])).toBe('STANDARD');
            expect(detectFormat(null)).toBe('STANDARD');
        });
    });
});

describe('Collection Utils', () => {
    describe('computeRecursiveCounts', () => {
        it('should compute totals recursively', () => {
            const collections = [
                { id: '1', title: 'Root', parentId: null, _count: { prompts: 1 }, createdAt: new Date() },
                { id: '2', title: 'Child', parentId: '1', _count: { prompts: 2 }, createdAt: new Date() },
                { id: '3', title: 'Grandchild', parentId: '2', _count: { prompts: 3 }, createdAt: new Date() },
            ];

            const map = computeRecursiveCounts(collections);

            expect(map.get('3')?.totalPrompts).toBe(3);
            expect(map.get('2')?.totalPrompts).toBe(5); // 2 + 3
            expect(map.get('1')?.totalPrompts).toBe(6); // 1 + 5
        });
    });

    describe('filterHiddenCollections', () => {
        it('should filter hidden nodes and their descendants', () => {
            const collections = [
                { id: '1', title: 'Root', parentId: null, createdAt: '', totalPrompts: 0 },
                { id: '2', title: 'HiddenRoot', parentId: null, createdAt: '', totalPrompts: 0 },
                { id: '3', title: 'ChildOfHidden', parentId: '2', createdAt: '', totalPrompts: 0 },
                { id: '4', title: 'ChildOfVisible', parentId: '1', createdAt: '', totalPrompts: 0 },
            ];

            const hidden = ['2'];
            const res = filterHiddenCollections(collections, hidden);

            const ids = res.map(c => c.id);
            expect(ids).toContain('1');
            expect(ids).toContain('4');
            expect(ids).not.toContain('2');
            expect(ids).not.toContain('3');
        });

        it('should return all if no hidden', () => {
            const collections = [{ id: '1', title: 'R', parentId: null, createdAt: '', totalPrompts: 0 }];
            expect(filterHiddenCollections(collections, [])).toHaveLength(1);
        });
    });
});
