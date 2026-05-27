import { defineConfig } from 'vite'

/** Canonical dev URL (npm run dev). */
const CANONICAL_ORIGIN = 'http://localhost:5173'
const BASE = '/food-delivery-platform'

/**
 * Dev-only server on :5174 that 302-redirects to the app on :5173 with basename.
 * Run alongside `npm run dev` — see package.json script `dev:redirect`.
 */
function redirectToCanonicalDev() {
    return {
        name: 'redirect-to-canonical-dev',
        configureServer(server) {
            server.middlewares.use((req, res) => {
                const raw = req.url ?? '/'
                const qIndex = raw.indexOf('?')
                const pathname = qIndex === -1 ? raw : raw.slice(0, qIndex)
                const search = qIndex === -1 ? '' : raw.slice(qIndex)

                let destPath = pathname
                if (!destPath.startsWith(BASE)) {
                    destPath = BASE + (destPath === '/' ? '/' : destPath)
                }

                const location = `${CANONICAL_ORIGIN}${destPath}${search}`
                res.statusCode = 302
                res.setHeader('Location', location)
                res.end()
            })
        },
    }
}

export default defineConfig({
    plugins: [redirectToCanonicalDev()],
    server: {
        port: 5174,
        strictPort: true,
    },
})
