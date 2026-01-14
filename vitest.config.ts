import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                url: 'http://localhost:3000',
            },
        },
        alias: {
            '@': path.resolve(__dirname, './')
        },
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.test.ts', '**/*.test.tsx'],
        exclude: ['**/node_modules/**', '**/frontend-tests/**', '**/playwright-tests/**', '**/imports-linking.test.ts', '**/imports-technical-id.test.ts', '**/app/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'json'],
            include: ['lib/**/*.ts', 'services/**/*.ts', 'actions/**/*.ts', 'components/**/*.tsx'],
            exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', 'vitest.config.ts', '.next/**', 'coverage/**', 'app/**']
        },
    },
})
