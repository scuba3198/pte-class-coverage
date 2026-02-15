/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    base: '/pte-class-coverage/',
    plugins: [react()],
    test: {
        environment: 'jsdom',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)
