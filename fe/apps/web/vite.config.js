import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

// Commit id lúc build: ưu tiên biến môi trường CI (FIS_GIT_COMMIT), nếu không có
// thì đọc từ git; ở nơi không có .git (Docker) thì fallback 'dev'.
const resolveGitCommit = () => {
    if (process.env.FIS_GIT_COMMIT) return process.env.FIS_GIT_COMMIT
    try {
        return execSync('git rev-parse --short HEAD').toString().trim()
    } catch {
        return 'dev'
    }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file from THIS directory (apps/web)
    // Empty string prefix loads ALL env vars (not just VITE_ prefix)
    const env = loadEnv(mode, __dirname, '')

    console.log('🔍 Loaded FIS_SERVER_PORT:', env.FIS_SERVER_PORT)
    console.log('🔍 Loading .env from:', __dirname)

    const gitCommit = resolveGitCommit()
    const buildTime = new Date().toISOString()

    return {
        // Allow Vite to expose FIS_* env variables to client
        envPrefix: ['FIS_'],

        // Bơm thông tin build vào import.meta.env (giữ đúng convention FIS_*)
        define: {
            'import.meta.env.FIS_GIT_COMMIT': JSON.stringify(gitCommit),
            'import.meta.env.FIS_BUILD_TIME': JSON.stringify(buildTime),
            'import.meta.env.FIS_BUILD_MODE': JSON.stringify(mode),
        },

        plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        server: {
            port: env.FIS_SERVER_PORT ? parseInt(env.FIS_SERVER_PORT) : 8088,
            host: true,
            strictPort: false,
        },
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
                        'ui-vendor': ['lucide-react'],
                    },
                },
            },
        },
        base: env.FIS_PUBLIC_URL || '/',
        preview: {
            port: env.FIS_SERVER_PORT ? parseInt(env.FIS_SERVER_PORT) : 8088,
            host: true,
        },
    }
})
