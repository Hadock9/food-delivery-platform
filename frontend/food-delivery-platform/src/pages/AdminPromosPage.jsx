import React, { useEffect, useState } from "react";
import { TicketPercent } from "lucide-react";
import { createPromo, deletePromo, getPromoAnalytics, getPromos, updatePromo } from "../api/Promo.jsx";
import "./styles/AdminPanels.css";

const EMPTY_PROMO = {
    code: "",
    title: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    minOrderTotal: 0,
    maxUses: 100,
    validFrom: "",
    validTo: "",
    isActive: true,
    personalUserId: "",
};

export default function AdminPromosPage() {
    const [promos, setPromos] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [selectedPromo, setSelectedPromo] = useState(null);

    const reload = async () => {
        const [promoRows, analyticsPayload] = await Promise.all([getPromos(), getPromoAnalytics()]);
        setPromos(Array.isArray(promoRows) ? promoRows : []);
        setAnalytics(analyticsPayload);
        setSelectedPromo((current) =>
            current ? promoRows.find((promo) => promo.id === current.id) ?? null : null
        );
    };

    useEffect(() => {
        reload().catch((err) => console.error("Failed to load promo admin data", err));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const payload = {
            code: form.get("code"),
            title: form.get("title"),
            description: form.get("description"),
            discountType: form.get("discountType"),
            discountValue: Number(form.get("discountValue") || 0),
            minOrderTotal: Number(form.get("minOrderTotal") || 0),
            maxUses: form.get("maxUses") === "" ? null : Number(form.get("maxUses")),
            validFrom: form.get("validFrom") || null,
            validTo: form.get("validTo") || null,
            isActive: form.get("isActive") === "on",
            personalUserId: form.get("personalUserId") || null,
        };

        if (selectedPromo?.id) {
            await updatePromo(selectedPromo.id, payload);
        } else {
            await createPromo(payload);
        }

        formElement.reset();
        setSelectedPromo(null);
        await reload();
    };

    const handleDelete = async (promoId) => {
        if (!window.confirm("Видалити промокод?")) return;
        await deletePromo(promoId);
        if (selectedPromo?.id === promoId) setSelectedPromo(null);
        await reload();
    };

    const formDefaults = selectedPromo ?? EMPTY_PROMO;

    return (
        <main className="bh-main admin-panel">
            <header className="bh-top">
                <div>
                    <h1 className="bh-heading">
                        <TicketPercent size={24} style={{ marginRight: 10, verticalAlign: "middle" }} />
                        Промокоди
                    </h1>
                    <p className="bh-subheading">CRUD акцій, ліміти використання та базова аналітика.</p>
                </div>
            </header>

            <section className="admin-metrics">
                <article className="admin-metric-card">
                    <div className="label">Усього промо</div>
                    <div className="value">{analytics?.totalPromos ?? "—"}</div>
                </article>
                <article className="admin-metric-card">
                    <div className="label">Активні</div>
                    <div className="value">{analytics?.activePromos ?? "—"}</div>
                </article>
                <article className="admin-metric-card">
                    <div className="label">Застосувань</div>
                    <div className="value">{analytics?.totalRedemptions ?? "—"}</div>
                </article>
                <article className="admin-metric-card">
                    <div className="label">Сума знижок</div>
                    <div className="value">{analytics?.discountAmountTotal ?? "—"}</div>
                </article>
            </section>

            <section className="admin-grid-2">
                <div className="admin-panel-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Код</th>
                                <th>Тип</th>
                                <th>Використано</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map((promo) => (
                                <tr key={promo.id}>
                                    <td>
                                        <strong>{promo.code}</strong>
                                        <div className="small-muted">{promo.title}</div>
                                    </td>
                                    <td>{promo.discountType} / {promo.discountValue}</td>
                                    <td>{promo.usedCount}{promo.maxUses != null ? ` / ${promo.maxUses}` : ""}</td>
                                    <td>
                                        <div className="admin-inline-actions">
                                            <button type="button" onClick={() => setSelectedPromo(promo)}>
                                                Редагувати
                                            </button>
                                            <button type="button" className="danger" onClick={() => handleDelete(promo.id)}>
                                                Видалити
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="admin-panel-card">
                    <form className="admin-stack" onSubmit={handleSubmit} key={selectedPromo?.id ?? "new"}>
                        <h3>{selectedPromo ? "Редагувати промокод" : "Новий промокод"}</h3>
                        <div className="admin-form-grid">
                            <div>
                                <label className="small-muted">Код</label>
                                <input name="code" defaultValue={formDefaults.code} />
                            </div>
                            <div>
                                <label className="small-muted">Назва</label>
                                <input name="title" defaultValue={formDefaults.title} />
                            </div>
                            <div className="full">
                                <label className="small-muted">Опис</label>
                                <textarea name="description" defaultValue={formDefaults.description} />
                            </div>
                            <div>
                                <label className="small-muted">Тип</label>
                                <select name="discountType" defaultValue={formDefaults.discountType}>
                                    <option value="percent">percent</option>
                                    <option value="fixed">fixed</option>
                                </select>
                            </div>
                            <div>
                                <label className="small-muted">Значення</label>
                                <input type="number" name="discountValue" defaultValue={formDefaults.discountValue} />
                            </div>
                            <div>
                                <label className="small-muted">Мін. сума</label>
                                <input type="number" name="minOrderTotal" defaultValue={formDefaults.minOrderTotal} />
                            </div>
                            <div>
                                <label className="small-muted">Макс. використань</label>
                                <input type="number" name="maxUses" defaultValue={formDefaults.maxUses ?? ""} />
                            </div>
                            <div>
                                <label className="small-muted">Valid from</label>
                                <input type="datetime-local" name="validFrom" defaultValue={toLocalDateTime(formDefaults.validFrom)} />
                            </div>
                            <div>
                                <label className="small-muted">Valid to</label>
                                <input type="datetime-local" name="validTo" defaultValue={toLocalDateTime(formDefaults.validTo)} />
                            </div>
                            <div className="full">
                                <label className="small-muted">Персональний userId</label>
                                <input name="personalUserId" defaultValue={formDefaults.personalUserId ?? ""} />
                            </div>
                            <div style={{ display: "flex", alignItems: "end" }}>
                                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input type="checkbox" name="isActive" defaultChecked={formDefaults.isActive} />
                                    Активний
                                </label>
                            </div>
                        </div>
                        <div className="admin-inline-actions">
                            <button type="submit" className="primary">
                                {selectedPromo ? "Оновити" : "Створити"}
                            </button>
                            {selectedPromo && (
                                <button type="button" onClick={() => setSelectedPromo(null)}>
                                    Скасувати
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}

function toLocalDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
