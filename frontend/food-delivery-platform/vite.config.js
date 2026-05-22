import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "/food-delivery-platform",
    server: {
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
                rewrite: (path) => path,
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
            "/api": {
                target: "http://localhost:5001",
                changeOrigin: true,
            },
        },
    },
})

