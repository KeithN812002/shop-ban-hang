import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Version of the installed MediaPipe package: the wasm runtime fetched from the CDN
// must match the JS bundle exactly.
const readMediapipeVersion = () => {
    try {
        const pkg = JSON.parse(
            readFileSync(resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/package.json'), 'utf-8'),
        )
        return String(pkg.version)
    } catch {
        return 'latest'
    }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Empty prefix: load every key of the .env file for use in this config.
    const env = loadEnv(mode, __dirname, '')
    const port = env.FIS_SERVER_PORT ? parseInt(env.FIS_SERVER_PORT, 10) : 3000
    const apiTarget = env.FIS_API_BASE_URL || 'http://localhost:8200'

    return {
        envPrefix: ['FIS_'],
        define: {
            __MEDIAPIPE_VERSION__: JSON.stringify(readMediapipeVersion()),
        },
        plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        server: {
            port,
            host: true,
            strictPort: true,
            proxy: {
                // /api/<path> -> <FIS_API_BASE_URL>/<path>  (same origin for the browser, so no CORS)
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                    rewrite: path => path.replace(/^\/api/, ''),
                },
            },
        },
        preview: { port, host: true },
        build: {
            outDir: 'dist',
            sourcemap: false,
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom'],
                        'router-vendor': ['@tanstack/react-router'],
                        'query-vendor': ['@tanstack/react-query'],
                    },
                },
            },
        },
        test: {
            environment: 'node',
            include: ['src/**/*.test.ts'],
        },
    }
})
