
import { describe, it, expect } from 'vitest';
import { validateFileExtension } from './utils';

describe('validateFileExtension', () => {
    it('should pass for allowed extensions', () => {
        expect(() => validateFileExtension('test.txt')).not.toThrow();
        expect(() => validateFileExtension('image.png')).not.toThrow();
        expect(() => validateFileExtension('document.pdf')).not.toThrow();
    });

    it('should throw error for invalid extensions', () => {
        expect(() => validateFileExtension('virus.exe')).toThrow(/File extension .exe not allowed/);
        expect(() => validateFileExtension('script.sh')).toThrow();
    });

    it('should be case insensitive', () => {
        expect(() => validateFileExtension('TEST.TXT')).not.toThrow();
        expect(() => validateFileExtension('image.PNG')).not.toThrow();
    });
});
