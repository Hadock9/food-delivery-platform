import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const userApiTarget = process.env.VITE_PROXY_USER_API_TARGET || "http://localhost:5001"
const menuApiTarget = process.env.VITE_PROXY_MENU_API_TARGET || "http://localhost:5004"
const orderApiTarget = process.env.VITE_PROXY_ORDER_API_TARGET || "http://localhost:5005"
const trackingApiTarget = process.env.VITE_PROXY_TRACKING_API_TARGET || "http://localhost:5006"
const promoApiTarget = process.env.VITE_PROXY_PROMO_API_TARGET || "http://localhost:5007"
const adminApiTarget = process.env.VITE_PROXY_ADMIN_API_TARGET || "http://localhost:5011"
const foodSplitApiTarget = process.env.VITE_PROXY_FOOD_SPLIT_API_TARGET || "http://localhost:5010"
const osrmApiTarget = process.env.VITE_PROXY_OSRM_TARGET || "https://router.project-osrm.org"
const nominatimApiTarget = process.env.VITE_PROXY_NOMINATIM_TARGET || "https://nominatim.openstreetmap.org"

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
                target: menuApiTarget,
                changeOrigin: true,
            },
            "/api/menu": {
                target: menuApiTarget,
                changeOrigin: true,
            },
            "/api/order": {
                target: orderApiTarget,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/order/i, "/api/Order"),
            },
            "/api/orders": {
                target: orderApiTarget,
                changeOrigin: true,
            },
            "/api/tracking": {
                target: trackingApiTarget,
                changeOrigin: true,
            },
            "/api/promos": {
                target: promoApiTarget,
                changeOrigin: true,
            },
            "/api/admin": {
                target: adminApiTarget,
                changeOrigin: true,
            },
            "/api/food-split": {
                target: foodSplitApiTarget,
                changeOrigin: true,
            },
            "/socket.io": {
                target: foodSplitApiTarget,
                changeOrigin: true,
                ws: true,
            },
            "/webhooks": {
                target: foodSplitApiTarget,
                changeOrigin: true,
            },
            "/api": {
                target: userApiTarget,
                changeOrigin: true,
            },
            "/osrm": {
                target: osrmApiTarget,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/osrm/, ""),
            },
            "/nominatim": {
                target: nominatimApiTarget,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/nominatim/, ""),
            },
        },
    },
})

