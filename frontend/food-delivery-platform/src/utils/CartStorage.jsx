import { resolveDishImage } from "./images.js";

const CART_KEY = "cart";

export const getCart = () => {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        localStorage.removeItem(CART_KEY);
        return [];
    }
};

export const saveCart = (cart) =>
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

export const addToCart = (dish, quantity) => {
    const cart = getCart();
    const dishId = dish?.id != null ? String(dish.id) : null;
    if (!dishId) return;

    const existing = cart.find(i => String(i.id) === dishId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: dishId,
            businessId: dish.businessId,
            name: dish.name,
            restaurant: dish.restaurant ?? "Ресторан",
            price: Number(dish.price) || 0,
            category: dish.category,
            image: resolveDishImage(dish, dish.category, dish.name, dish.businessId),
            quantity
        });
    }

    saveCart(cart);
};

export const updateCartItemQuantity = (id, quantity) => {
    saveCart(
        getCart().map(i =>
            String(i.id) === String(id) ? { ...i, quantity } : i
        )
    );
};

export const removeCartItem = (id) => {
    saveCart(getCart().filter(i => String(i.id) !== String(id)));
};

export const getCartCount = () =>
    getCart().reduce((sum, i) => sum + (i.quantity || 0), 0);

export const clearCart = () => {
    localStorage.removeItem(CART_KEY);
};
