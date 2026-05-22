import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { buildBusinessUserData, getBusinessAccountId } from "../utils/businessUserData.js";
import {
    Package,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight
} from "lucide-react";
import "../components/styles/BusinessHomePage.css";
import "./styles/BusinessOrdersPage.css";
import OrderDetailsComponent from "../components/OrderDetailsComponent.jsx";
import { getOrdersByBusiness, changeOrderStatus } from "../api/Order.jsx";
import {
    mapBusinessOrder,
    BUSINESS_STATUS_TO_API,
} from "../utils/orderStatus.js";

const STATUS_MAP = {
    pending: { label: "Нове", color: "#7c5cff", icon: Package },
    preparing: { label: "Готується", color: "#ffb86b", icon: Clock },
    ready: { label: "Готове", color: "#00d4ff", icon: CheckCircle },
    delivered: { label: "Доставлено", color: "#50fa7b", icon: CheckCircle },
    cancelled: { label: "Скасовано", color: "#ff6b6b", icon: XCircle },
};

export default function BusinessOrdersPage() {
    const { user, accounts, currentAccountId, loading: userLoading } = useUser();
    const userData = useMemo(
        () => buildBusinessUserData(user, accounts, currentAccountId),
        [user, accounts, currentAccountId]
    );

    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const businessId = getBusinessAccountId(accounts, currentAccountId);

    const loadOrders = useCallback(async () => {
        if (!businessId) {
            setLoading(false);
            setError("Не знайдено бізнес-акаунт. Перемкніть акаунт у профілі.");
            setOrders([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getOrdersByBusiness(businessId);
            const list = Array.isArray(data) ? data : [];
            setOrders(list.map(mapBusinessOrder));
        } catch (e) {
            console.error("Failed to load business orders", e);
            const status = e?.response?.status;
            setError(
                status === 401
                    ? "Увійдіть знову — сесія закінчилась."
                    : "Не вдалося завантажити замовлення. Перевірте OrderService (порт 5005) і перезапустіть контейнер після оновлення."
            );
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [businessId]);

    useEffect(() => {
        if (userLoading) return;
        loadOrders();
    }, [businessId, userLoading, loadOrders]);

    const filteredOrders =
        filter === "all"
            ? orders
            : orders.filter((o) => o.status === filter);

    const handleStatusChange = async (orderId, newStatus) => {
        const apiStatus = BUSINESS_STATUS_TO_API[newStatus];
        if (!apiStatus) return;

        try {
            await changeOrderStatus(orderId, apiStatus);
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId ? { ...o, status: newStatus } : o
                )
            );
        } catch (e) {
            console.error("Failed to change order status", e);
            alert("Не вдалося оновити статус замовлення");
        }
    };

    if (userLoading) {
        return (
            <main className="bh-main" style={{ placeItems: "center" }}>
                <div className="bh-empty">Завантаження…</div>
            </main>
        );
    }

    return (
            <main className="bh-main">
                <header className="bh-top">
                    <div>
                        <h1 className="bh-heading">Замовлення</h1>
                        {userData?.currentAccount?.name && (
                            <p className="bh-subheading">{userData.currentAccount.name}</p>
                        )}
                    </div>

                    <div className="filters">
                        <button
                            type="button"
                            className="bh-refresh-btn"
                            onClick={loadOrders}
                            disabled={loading}
                        >
                            Оновити
                        </button>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="all">Усі</option>
                            <option value="pending">Нові</option>
                            <option value="preparing">Готується</option>
                            <option value="ready">Готові</option>
                            <option value="delivered">Доставлені</option>
                            <option value="cancelled">Скасовані</option>
                        </select>
                    </div>
                </header>

                <section className="bh-content">
                    {loading ? (
                        <div className="bh-empty">Завантаження…</div>
                    ) : error ? (
                        <div className="bh-empty error">{error}</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bh-empty">
                            <Package size={64} />
                            <p>Немає замовлень</p>
                        </div>
                    ) : (
                        <div className="orders-grid">
                            {filteredOrders.map((order) => {
                                const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
                                const StatusIcon = s.icon;

                                return (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <div className="order-id">#{String(order.id).slice(0, 8)}</div>
                                            <div className="order-time">{order.createdAt}</div>
                                        </div>

                                        <div className="order-body">
                                            <strong>{order.customerName}</strong>
                                            <div className="address">{order.address}</div>

                                            <div className="order-items">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="item-row">
                                                        <span>
                                                            {item.quantity}× {item.name}
                                                        </span>
                                                        <span>{item.price * item.quantity} ₴</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="order-total">
                                                Разом: {order.total} ₴
                                            </div>
                                        </div>

                                        <div className="order-footer">
                                            <div
                                                className="status-badge"
                                                style={{
                                                    background: s.color + "22",
                                                    color: s.color,
                                                }}
                                            >
                                                <StatusIcon size={16} />
                                                {s.label}
                                            </div>

                                            <div className="status-actions">
                                                {order.status === "pending" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleStatusChange(order.id, "preparing")
                                                            }
                                                        >
                                                            Прийняти
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="danger"
                                                            onClick={() =>
                                                                handleStatusChange(order.id, "cancelled")
                                                            }
                                                        >
                                                            Скасувати
                                                        </button>
                                                    </>
                                                )}

                                                {order.status === "preparing" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusChange(order.id, "ready")
                                                        }
                                                    >
                                                        Готово
                                                    </button>
                                                )}

                                                {order.status === "ready" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusChange(order.id, "delivered")
                                                        }
                                                    >
                                                        Видано
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className="details-btn"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                Детальніше <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {selectedOrder && (
                <OrderDetailsComponent
                    order={selectedOrder}
                    statusMap={STATUS_MAP}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
    );
}
