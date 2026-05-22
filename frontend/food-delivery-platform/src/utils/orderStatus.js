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
