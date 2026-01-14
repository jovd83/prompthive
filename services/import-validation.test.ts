import { describe, it, expect } from 'vitest';
import { ImportSchema } from '@/lib/validations';

describe('Import Schema Backward Compatibility', () => {
    it('should partially validate legacy JSON where tags are strings instead of array', () => {
        const legacyData = [{
            title: "Legacy Prompt",
            tags: "tag1, tag2", // String instead of array
            content: "content"
        }];
        const result = ImportSchema.safeParse(legacyData);
        expect(result.success).toBe(true);
    });

    it('should partially validate legacy JSON with missing optional fields', () => {
        const legacyData = [{
            title: "Old One",
            content: "Just content"
            // Missing versions, collections, etc.
        }];
        const result = ImportSchema.safeParse(legacyData);
        expect(result.success).toBe(true);
    });

    it('should allow extra fields (passthrough)', () => {
        const legacyData = [{
            title: "Old One",
            content: "Just content",
            randomField: "should be ignored but allowed"
        }];
        const result = ImportSchema.safeParse(legacyData);
        expect(result.success).toBe(true);
    });

    it('should allow versions to be loosely defined', () => {
        const legacyData = [{
            title: "Deep Version",
            versions: [{
                weirdField: 123,
                content: "ok"
            }]
        }];
        const result = ImportSchema.safeParse(legacyData);
        expect(result.success).toBe(true);
    });
});
