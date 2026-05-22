import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev URLs:
//   npm run dev          → http://localhost:5173/food-delivery-platform/  (port 5173, strict)
//   npm run dev:redirect → http://localhost:5174/ → 302 to the URL above (run both in dev)
// Port 5174 is not configured here; Vite uses it only when 5173 is already taken, or via dev:redirect.
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "/food-delivery-platform",
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            "/food-delivery-platform/images": {
                target: "https://images.unsplash.com",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/food-delivery-platform\/images/, ""),
            },
            "/images": {
                target: "https://images.unsplash.com",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/images/, ""),
            },
            "/api/dish": {
                target: "http://localhost:5004",
                changeOrigin: true,
            },
            "/api/menu": {
                target: "http://localhost:5004",
                changeOrigin: true,
            },
            "/api/order": {
                target: "http://localhost:5005",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/order/i, "/api/Order"),
            },
            "/api/orders": {
                target: "http://localhost:5005",
                changeOrigin: true,
            },
            "/api/tracking": {
                target: "http://localhost:5006",
                changeOrigin: true,
            },
            "/api/promos": {
                target: "http://localhost:5007",
                changeOrigin: true,
            },
            "/api/food-split": {
                target: "http://localhost:5010",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:5010",
                changeOrigin: true,
                ws: true,
            },
            "/webhooks": {
                target: "http://localhost:5010",
                changeOrigin: true,
            },
            "/api": {
                target: "http://localhost:5001",
                changeOrigin: true,
            },
        },
    },
})

