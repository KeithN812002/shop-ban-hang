import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { getThemeById, applyTheme } from './lib/themes'
import '@workspace/ui/globals.css'
import './i18n/config' // Import i18n configuration
import './config/registerModules' // Project extension point (module dashboards, menu badges)

// Initialize theme on app start
const savedThemeId = localStorage.getItem('app-theme-id')
const initialTheme = savedThemeId ? getThemeById(savedThemeId) : getThemeById('default')
applyTheme(initialTheme)

// Get base path from Vite config
const rawBasepath = import.meta.env.FIS_PUBLIC_URL || '/'
let routerBasepath = '/'

try {
    // If it's a full URL, extract only the pathname
    if (rawBasepath.startsWith('http')) {
        routerBasepath = new URL(rawBasepath).pathname
    } else {
        routerBasepath = rawBasepath
    }
} catch {
    routerBasepath = rawBasepath
}

// Ensure it starts with / and remove trailing slash for TanStack Router
if (!routerBasepath.startsWith('/')) routerBasepath = '/' + routerBasepath
if (routerBasepath.length > 1 && routerBasepath.endsWith('/')) {
    routerBasepath = routerBasepath.slice(0, -1)
}

// Set up a Router instance
const router = createRouter({
    routeTree,
    basepath: routerBasepath,
    defaultPreload: 'intent',
    scrollRestoration: true,
})

// Register things for typesafety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(<RouterProvider router={router} />)
}
