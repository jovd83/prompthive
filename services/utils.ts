
import path from 'path';
import { ALLOWED_EXTENSIONS } from '@/lib/constants';

export function validateFileExtension(filename: string) {
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`File extension ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }
}
