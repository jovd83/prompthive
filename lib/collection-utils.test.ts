import { describe, it, expect } from 'vitest';
import { computeRecursiveCounts, CollectionWithCount } from './collection-utils';

describe('computeRecursiveCounts', () => {
    it('should correctly count prompts in a single collection', () => {
        const collections: CollectionWithCount[] = [
            { id: '1', title: 'Root', parentId: null, _count: { prompts: 5 }, children: [] }
        ];

        const result = computeRecursiveCounts(collections);
        expect(result.get('1')?.totalPrompts).toBe(5);
    });

    it('should sum prompts from children to parent', () => {
        const collections: CollectionWithCount[] = [
            { id: '1', title: 'Root', parentId: null, _count: { prompts: 2 }, children: [] },
            { id: '2', title: 'Child', parentId: '1', _count: { prompts: 3 }, children: [] }
        ];

        const result = computeRecursiveCounts(collections);
        expect(result.get('1')?.totalPrompts).toBe(5); // 2 + 3
        expect(result.get('2')?.totalPrompts).toBe(3);
    });

    it('should handle deep nesting', () => {
        const collections: CollectionWithCount[] = [
            { id: '1', title: 'Root', parentId: null, _count: { prompts: 1 }, children: [] },
            { id: '2', title: 'L1', parentId: '1', _count: { prompts: 1 }, children: [] },
            { id: '3', title: 'L2', parentId: '2', _count: { prompts: 1 }, children: [] }
        ];

        const result = computeRecursiveCounts(collections);
        expect(result.get('1')?.totalPrompts).toBe(3);
        expect(result.get('2')?.totalPrompts).toBe(2);
        expect(result.get('3')?.totalPrompts).toBe(1);
    });

    it('should handle multiple branches', () => {
        const collections: CollectionWithCount[] = [
            { id: '1', title: 'Root', parentId: null, _count: { prompts: 10 }, children: [] },
            { id: '2', title: 'A', parentId: '1', _count: { prompts: 5 }, children: [] },
            { id: '3', title: 'B', parentId: '1', _count: { prompts: 5 }, children: [] }
        ];

        const result = computeRecursiveCounts(collections);
        expect(result.get('1')?.totalPrompts).toBe(20);
    });

    it('should safely ignore missing parents', () => {
        const collections: CollectionWithCount[] = [
            { id: '2', title: 'Orphan', parentId: '99', _count: { prompts: 1 }, children: [] }
        ];

        const result = computeRecursiveCounts(collections);
        expect(result.get('2')?.totalPrompts).toBe(1);
    });
});
