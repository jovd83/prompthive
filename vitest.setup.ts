import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Force test environment
(process.env as any).NODE_ENV = 'test';
console.log('JSDOM Location:', window.location.href);

// Polyfill WebSocket
(global as any).WebSocket = class WebSocket {
    constructor() { }
    close() { }
    send() { }
    addEventListener() { }
    removeEventListener() { }
};

afterEach(() => {
    cleanup()
})

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Polyfill scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () { };

// Polyfill relative URLs for fetch (needed for undici v7+)
const originalFetch = global.fetch;
(global as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/')) {
        const url = new URL(input, window.location.origin).href;
        return originalFetch(url, init);
    }
    return originalFetch(input, init);
};
