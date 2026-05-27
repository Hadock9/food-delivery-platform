import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, Edit3 } from "lucide-react";
import "./styles/BusinessHomePage.css";
import DishComponent from "./DishComponent";
import { getBusinessAccountId } from "../utils/businessUserData.js";
import { ROUTES } from "../utils/roleRoutes.js";
import {
    getDishesByBusinessId,
    createDish,
    updateDish,
    deleteDish
} from "../api/Dish.jsx";
import { CategoryListUa, CategoryUa, CategoryMap } from "../constants/category.jsx";

function normalizeCategory(category) {
    if (category == null || category === "") return category;
    if (typeof category === "number" && !Number.isNaN(category)) return category;
    const asNum = Number(category);
    if (!Number.isNaN(asNum) && CategoryMap[asNum] != null) return asNum;
    const key = String(category).trim();
    const byName = Object.entries(CategoryMap).find(
        ([, name]) => name.toLowerCase() === key.toLowerCase()
    );
    return byName ? Number(byName[0]) : category;
}
import { resolveDishImage, handleImageError, dishImgProps } from "../utils/images.js";

export default function BusinessHomePage({ userData }) {
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const businessId = getBusinessAccountId(
        userData?.accounts,
        userData?.currentAccount?.id
    );

    const activeIsBusiness =
        String(userData?.currentAccount?.accountType ?? "").toLowerCase() === "business";

    const [q, setQ] = useState("");
    const [category, setCategory] = useState("all");
    const [onlyPopular, setOnlyPopular] = useState(false);
    const [sortBy, setSortBy] = useState("name");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const [toDelete, setToDelete] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ============================
    // 🔥 LOAD REAL DISHES FROM API
    // ============================
    useEffect(() => {
        if (!businessId) {
            setLoading(false);
            setError("Не знайдено бізнес-акаунт. Перемкніть акаунт у профілі.");
            return;
        }

        const loadDishes = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await getDishesByBusinessId(businessId);

                setDishes(
                    (Array.isArray(res) ? res : []).map((d) => ({
                        ...d,
                        category: normalizeCategory(d.category),
                        imageUrl: d.imageUrl ?? d.image ?? null,
                    }))
                );
            } catch (err) {
                console.error(err);
                setError("Не вдалося завантажити список страв.");
            } finally {
                setLoading(false);
            }
        };

        loadDishes();
    }, [businessId]);

    // ============================
    // 🔥 CREATE DISH — API
    // ============================
    const handleCreate = async (newDish) => {
        try {
            const created = await createDish(newDish);
            setDishes(prev => [created, ...prev]);
        } catch (err) {
            console.log(newDish);
            console.error(err);
            alert("Помилка створення страви");
        }
    };

    // ============================
    // 🔥 UPDATE DISH — API
    // ============================
    const handleUpdate = async (id, patch) => {
        try {
            const updated = await updateDish(id, patch);

            setDishes(prev =>
                prev.map(d => (d.id === id ? updated : d))
            );
        } catch (err) {
            console.error(err);
            alert("Помилка оновлення страви");
        }
    };

    // ============================
    // 🔥 DELETE DISH — API
    // ============================
    const handleDelete = async (id) => {
        try {
            await deleteDish(id);
            setDishes(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
            alert("Не вдалося видалити страву");
        }

        setShowDeleteConfirm(false);
        setToDelete(null);
    };

    // ============================
    // FILTER & SORT
    // ============================
    const categories = useMemo(() => {
        const setC = new Set(dishes.map(d => d.category));
        return ["all", ...Array.from(setC)];
    }, [dishes]);

    const filtered = useMemo(() => {
        let out = dishes.slice();

        if (q.trim()) out = out.filter(d => d.name.toLowerCase().includes(q.toLowerCase()));
        if (category !== "all") {
            out = out.filter((d) => normalizeCategory(d.category) === category);
        }

        if (onlyPopular) out = out.filter(d => d.popular);
        if (sortBy === "name") out.sort((a, b) => a.name.localeCompare(b.name));
        if (sortBy === "price") out.sort((a, b) => a.price - b.price);
        if (sortBy === "rating") out.sort((a, b) => b.rating - a.rating);

        return out;
    }, [dishes, q, category, onlyPopular, sortBy]);

    const openCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (dish) => {
        setEditing(dish);
        setIsModalOpen(true);
    };

    return (
        <>
            <main className="bh-main">
                {!activeIsBusiness && businessId && (
                    <div className="bh-account-hint">
                        Використовується бізнес-акаунт закладу. Щоб змінити активний профіль —{' '}
                        <Link to={ROUTES.profile}>Профіль</Link>.
                    </div>
                )}
                <header className="bh-top">
                    <h1 className="bh-heading">Меню</h1>

                    <div className="bh-controls">
                        <div className="search-wrap">
                            <Search size={16} className="icon" />
                            <input placeholder="Пошук страв..." value={q} onChange={e => setQ(e.target.value)} />
                        </div>

                        <div className="filters">
                            <select
                                value={category}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setCategory(v === "all" ? "all" : Number(v));
                                }}
                            >
                                <option value="all">Усі категорії</option>
                                {CategoryListUa.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="name">За назвою</option>
                                <option value="price">За ціною</option>
                                <option value="rating">За рейтингом</option>
                            </select>

                            <label className="popular-toggle">
                                <input type="checkbox" checked={onlyPopular} onChange={e => setOnlyPopular(e.target.checked)} />
                                Хіти
                            </label>
                        </div>
                    </div>

                    <div className="bh-top-cta">
                        <button className="add-dish-btn" onClick={openCreate}>
                            <Plus size={16} /> Додати страву
                        </button>
                    </div>
                </header>

                {/* CONTENT */}
                <section className="bh-content">
                    {loading ? (
                        <div className="bh-empty">Завантаження…</div>
                    ) : error ? (
                        <div className="bh-empty error">{error}</div>
                    ) : filtered.length === 0 ? (
                        <div className="bh-empty">Немає страв</div>
                    ) : (
                        <div className="dishes-grid admin">
                            {filtered.map(d => (
                                <div key={d.id} className="admin-dish-card">
                                    <div className="thumb">
                                        <img
                                            src={resolveDishImage(
                                                d,
                                                CategoryUa[d.category] ?? d.category,
                                                d.name,
                                                businessId
                                            )}
                                            alt={d.name}
                                            {...dishImgProps}
                                            onError={(e) =>
                                                handleImageError(
                                                    e,
                                                    resolveDishImage(
                                                        null,
                                                        CategoryUa[d.category] ?? d.category,
                                                        d.name,
                                                        businessId
                                                    )
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="meta">
                                        <div className="row">
                                            <h3 className="dish-name">{d.name}</h3>
                                            <div className="price">{d.price} ₴</div>
                                        </div>

                                        <div className="row sub">
                                            <div className="cat">{CategoryUa[d.category] ?? "—"}</div>
                                            {d.cookingTime != null && (
                                                <div className="rating">⏱ {d.cookingTime} хв</div>
                                            )}
                                        </div>

                                        <div className="row actions">
                                            <button className="icon-btn" onClick={() => openEdit(d)} title="Редагувати">
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => {
                                                    setToDelete(d);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                title="Видалити"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* FOOTER */}
                <footer className="bh-footer">
                    <div>Показано: {filtered.length} з {dishes.length}</div>
                </footer>
            </main>

            {/* MODAL */}
            <DishComponent
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                editing={editing}
                userData = {userData}
            />

            {/* DELETE CONFIRM */}
            {showDeleteConfirm && toDelete && (
                <div className="bh-confirm">
                    <div className="bh-confirm-card">
                        <h4>Підтвердіть видалення</h4>
                        <p>Ви видаляєте «{toDelete.name}». Це незворотно.</p>

                        <div className="confirm-actions">
                            <button className="btn ghost" onClick={() => setShowDeleteConfirm(false)}>Скасувати</button>
                            <button className="btn danger" onClick={() => handleDelete(toDelete.id)}>Видалити</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
