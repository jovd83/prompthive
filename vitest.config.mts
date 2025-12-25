import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
        include: ['**/*.test.{ts,tsx}'],
        alias: {
            '@': resolve(__dirname, './')
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '.next/',
                'vitest.config.mts',
                'vitest.setup.ts',
                'postcss.config.js',
                'tailwind.config.ts',
                'next.config.ts',
                'playwright.config.ts',
                'frontend-tests/**',
                '**/*.d.ts',
            ]
        }
    },
})
