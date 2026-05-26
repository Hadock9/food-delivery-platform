/** Централізовані шляхи за ролями */
export const ROUTES = {
    home: "/",
    admin: "/admin",
    adminUsers: "/admin/users",
    adminOrders: "/admin/orders",
    adminMenu: "/admin/menu",
    adminPromos: "/admin/promos",
    login: "/login",
    register: "/register",
    profile: "/profile",
    accountCreate: "/account/create",
    customer: {
        root: "/customer",
        restaurants: "/customer/restaurants",
        restaurant: (id) => `/customer/restaurant/${id}`,
        cart: "/customer/cart",
        checkout: "/customer/checkout",
        orders: "/customer/orders",
        tracking: (orderId) => `/customer/tracking/${orderId}`,
        dish: (id) => `/customer/dish/${id}`,
        splitCreate: "/customer/split/create",
        split: (sessionId) => `/customer/split/${sessionId}`,
    },
    business: {
        root: "/business",
        orders: "/business/orders",
        dishes: "/business/dishes",
        promos: "/business/promos",
        analytics: "/business/analytics",
    },
    courier: {
        root: "/courier",
    },
};

export function homePathForRole(role) {
    switch (role) {
        case "Admin":
            return ROUTES.admin;
        case "Customer":
            return ROUTES.customer.root;
        case "Business":
            return ROUTES.business.root;
        case "Courier":
            return ROUTES.courier.root;
        default:
            return ROUTES.home;
    }
}

/** Чи шлях належить зоні клієнта / бізнесу */
export function isCustomerPath(pathname) {
    return pathname === ROUTES.customer.root || pathname.startsWith(`${ROUTES.customer.root}/`);
}

export function isBusinessPath(pathname) {
    return pathname === ROUTES.business.root || pathname.startsWith(`${ROUTES.business.root}/`);
}
