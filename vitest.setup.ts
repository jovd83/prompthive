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
