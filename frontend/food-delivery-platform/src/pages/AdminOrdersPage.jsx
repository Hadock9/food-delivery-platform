import React, { useEffect, useMemo, useState } from "react";
import { Package, ChevronRight } from "lucide-react";
import { getAdminOrders, updateAdminOrderStatus } from "../api/Admin.jsx";
import OrderDetailsComponent from "../components/OrderDetailsComponent.jsx";
import "./styles/AdminPanels.css";
import "./styles/BusinessOrdersPage.css";

const STATUS_MAP = {
    Preparing: { label: "Готується", color: "#ffb86b", icon: Package },
    Ready: { label: "Готово", color: "#00d4ff", icon: Package },
    OutForDelivery: { label: "В дорозі", color: "#7c5cff", icon: Package },
    Delivered: { label: "Доставлено", color: "#50fa7b", icon: Package },
    Canceled: { label: "Скасовано", color: "#ff6b6b", icon: Package },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({ status: "", businessId: "" });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAdminOrders({
            status: filters.status || undefined,
            businessId: filters.businessId || undefined,
        })
            .then((data) => {
                setOrders(Array.isArray(data) ? data : []);
                setError(null);
            })
            .catch((err) => {
                console.error("Failed to load admin orders", err);
                setError("Не вдалося завантажити замовлення.");
            });
    }, [filters.status, filters.businessId]);

    const businesses = useMemo(() => {
        const map = new Map();
        orders.forEach((order) => {
            map.set(order.businessId, order.businessName);
        });
        return [...map.entries()];
    }, [orders]);

    const mappedOrders = orders.map((order) => ({
        id: order.id,
        createdAt: new Date(order.orderDate).toLocaleString("uk-UA"),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.customerAddress,
        total: order.totalPrice,
        status: order.orderStatus,
        statusRaw: order.orderStatus,
        courier: order.courierName ? { name: order.courierName, phone: order.courierPhone } : null,
        items: order.dishes.map((dish) => ({
            name: dish.dishName,
            quantity: dish.quantity,
            price: dish.price,
        })),
    }));

    const handleStatusChange = async (orderId, status) => {
        try {
            const updated = await updateAdminOrderStatus(orderId, status);
            setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
            if (selectedOrder?.id === updated.id) {
                setSelectedOrder({
                    ...selectedOrder,
                    status: updated.orderStatus,
                    statusRaw: updated.orderStatus,
                });
            }
        } catch (err) {
            console.error("Failed to change admin order status", err);
            alert("Не вдалося оновити статус замовлення.");
        }
    };

    return (
        <main className="bh-main admin-panel">
            <header className="bh-top">
                <div>
                    <h1 className="bh-heading">Глобальні замовлення</h1>
                    <p className="bh-subheading">Усі замовлення з усіх закладів в одному місці.</p>
                </div>
            </header>

            <section className="admin-panel-card">
                <div className="admin-toolbar">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
                    >
                        <option value="">Усі статуси</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="OutForDelivery">OutForDelivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Canceled">Canceled</option>
                    </select>
                    <select
                        value={filters.businessId}
                        onChange={(e) => setFilters((current) => ({ ...current, businessId: e.target.value }))}
                    >
                        <option value="">Усі заклади</option>
                        {businesses.map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {error && <div className="bh-empty error">{error}</div>}

            <section className="bh-content">
                {mappedOrders.length === 0 ? (
                    <div className="bh-empty">Замовлень поки немає.</div>
                ) : (
                    <div className="orders-grid">
                        {mappedOrders.map((order) => {
                            const s = STATUS_MAP[order.status] ?? STATUS_MAP.Preparing;
                            return (
                                <div key={order.id} className="order-card">
                                    <div className="order-header">
                                        <div className="order-id">#{String(order.id).slice(0, 8)}</div>
                                        <div className="order-time">{order.createdAt}</div>
                                    </div>

                                    <div className="order-body">
                                        <strong>{order.customerName}</strong>
                                        <div className="address">{order.address}</div>
                                        <div className="small-muted" style={{ marginTop: 8 }}>
                                            {orders.find((entry) => entry.id === order.id)?.businessName}
                                        </div>

                                        <div className="order-items">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="item-row">
                                                    <span>{item.quantity}× {item.name}</span>
                                                    <span>{item.quantity * item.price} ₴</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-total">Разом: {order.total} ₴</div>
                                    </div>

                                    <div className="order-footer">
                                        <div className="status-badge" style={{ background: `${s.color}22`, color: s.color }}>
                                            {s.label}
                                        </div>
                                        <div className="status-actions">
                                            {["Preparing", "Ready", "OutForDelivery", "Delivered", "Canceled"].map((status) => (
                                                <button key={status} type="button" onClick={() => handleStatusChange(order.id, status)}>
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                        <button type="button" className="details-btn" onClick={() => setSelectedOrder(order)}>
                                            Детальніше <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {selectedOrder && (
                <OrderDetailsComponent
                    order={selectedOrder}
                    statusMap={Object.fromEntries(
                        Object.entries(STATUS_MAP).map(([key, value]) => [
                            key,
                            { label: value.label, color: value.color, emoji: "📦" },
                        ])
                    )}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </main>
    );
}
