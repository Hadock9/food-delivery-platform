/** Бекенд OrderStatus enum → ключ UI */
export function mapOrderStatus(status) {
    switch (status) {
        case "Preparing":
            return "preparing";
        case "Ready":
            return "ready";
        case "OutForDelivery":
            return "on-the-way";
        case "Delivered":
            return "delivered";
        case "Canceled":
            return "canceled";
        default:
            return "new";
    }
}

export function getStatusDisplay(statusKey) {
    const displays = {
        preparing: { text: "Готується", color: "#ffb86b", emoji: "🍳", label: "Готується" },
        ready: { text: "Готово до видачі", color: "#50fa7b", emoji: "✅", label: "Готово" },
        "on-the-way": { text: "В дорозі", color: "#00d4ff", emoji: "🏍️", label: "В дорозі" },
        delivered: { text: "Доставлено", color: "#7c5cff", emoji: "✓", label: "Доставлено" },
        canceled: { text: "Скасовано", color: "#ff6b6b", emoji: "✕", label: "Скасовано" },
        new: { text: "Нове", color: "#7c5cff", emoji: "📦", label: "Нове" },
    };
    return displays[statusKey] ?? displays.new;
}

/** Order list item for business dashboard */
export function mapBusinessOrder(o) {
    return {
        id: o.id,
        createdAt: o.orderDate
            ? new Date(o.orderDate).toLocaleTimeString("uk-UA", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "",
        customerName: o.customerFullName ?? "Клієнт",
        address: o.customerAddress ?? "",
        total: o.totalPrice ?? 0,
        status: mapBusinessOrderStatus(o.orderStatus),
        courier: o.courierName?.trim() ? { name: o.courierName.trim() } : null,
        items: (o.dishes ?? []).map((d) => ({
            name: d.dishName ?? d.name ?? "Страва",
            quantity: d.quantity ?? 1,
            price: d.price ?? 0,
        })),
    };
}

export function mapBusinessOrderStatus(status) {
    switch (status) {
        case "Pending":
            return "pending";
        case "Preparing":
            return "preparing";
        case "Ready":
            return "ready";
        case "OutForDelivery":
            return "ready";
        case "Delivered":
            return "delivered";
        case "Canceled":
            return "cancelled";
        default:
            return "pending";
    }
}

export const BUSINESS_STATUS_TO_API = {
    preparing: "Preparing",
    ready: "Ready",
    delivered: "Delivered",
    cancelled: "Canceled",
};

export function mapCustomerOrder(o) {
    return {
        id: o.id,
        restaurant: o.businessName ?? "Ресторан",
        address: o.businessAddress ?? "",
        status: mapOrderStatus(o.orderStatus),
        statusRaw: o.orderStatus,
        total: o.totalPrice,
        createdAt: o.orderDate
            ? new Date(o.orderDate).toLocaleString("uk-UA")
            : "",
        courier: o.courierName?.trim()
            ? { name: o.courierName.trim() }
            : null,
        items: (o.dishes ?? []).map((d) => ({
            name: d.dishName ?? d.name ?? "Страва",
            quantity: d.quantity ?? 1,
            price: d.price ?? 0,
        })),
    };
}
