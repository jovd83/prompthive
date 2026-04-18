import DOMPurify from 'dompurify';

/**
 * Standard configuration for DOMPurify to balance functionality and security.
 */
export const DEFAULT_SANitize_CONFIG = {
    ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'p', 'br', 'hr', 
        'strong', 'em', 'b', 'i', 'u', 'strike',
        'code', 'pre', 'blockquote',
        'ul', 'ol', 'li',
        'a', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img'
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel', 
        'src', 'alt', 'title', 'width', 'height',
        'class', 'id', 'style'
    ],
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
};

/**
 * Sanitizes HTML using DOMPurify.
 * Note: This only works on the client side by default.
 */
export function sanitizeHtml(html: string, options = DEFAULT_SANitize_CONFIG): string {
    // If we are on the server and don't have JSDOM configured, return the raw text (unsafe) or empty string.
    // In production, you should use JSDOM if you need server-side sanitization.
    if (typeof window === 'undefined') {
        return ''; 
    }
    
    return DOMPurify.sanitize(html, options);
}

/**
 * Hook-ready or component-ready version that ensures safety.
 */
export function getSafeHtmlProps(html: string) {
    return {
        dangerouslySetInnerHTML: {
            __html: sanitizeHtml(html)
        }
    };
}
