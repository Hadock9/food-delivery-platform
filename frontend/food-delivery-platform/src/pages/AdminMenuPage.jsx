import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit3, FolderTree } from "lucide-react";
import DishComponent from "../components/DishComponent.jsx";
import {
    createAdminCategory,
    createAdminDish,
    deleteAdminCategory,
    deleteAdminDish,
    getAdminBusinesses,
    getAdminCategories,
    getAdminDishes,
    updateAdminCategory,
    updateAdminDish,
} from "../api/Admin.jsx";
import { resolveDishImage, handleImageError, dishImgProps } from "../utils/images.js";
import "./styles/AdminPanels.css";
import "../components/styles/BusinessHomePage.css";

export default function AdminMenuPage() {
    const [businesses, setBusinesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        getAdminBusinesses().then((data) => {
            setBusinesses(Array.isArray(data) ? data : []);
            setSelectedBusinessId((current) => current || data?.[0]?.id || "");
        });
        getAdminCategories().then((data) => {
            setCategories(Array.isArray(data) ? data : []);
            setSelectedCategory(data?.[0] ?? null);
        });
    }, []);

    useEffect(() => {
        if (!selectedBusinessId) return;
        getAdminDishes({ businessId: selectedBusinessId }).then((data) => {
            setDishes(Array.isArray(data) ? data : []);
        });
    }, [selectedBusinessId]);

    const categoryOptions = useMemo(
        () => categories.map((category) => ({ id: category.id, name: category.name })),
        [categories]
    );

    const activeBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null;

    const handleCreateDish = async (payload) => {
        const created = await createAdminDish({ ...payload, businessId: selectedBusinessId });
        setDishes((current) => [created, ...current]);
    };

    const handleUpdateDish = async (dishId, payload) => {
        const updated = await updateAdminDish(dishId, { ...payload, businessId: selectedBusinessId });
        setDishes((current) => current.map((dish) => (dish.id === dishId ? updated : dish)));
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Видалити страву?")) return;
        await deleteAdminDish(dishId);
        setDishes((current) => current.filter((dish) => dish.id !== dishId));
    };

    const handleCategorySubmit = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const payload = {
            name: form.get("name"),
            slug: form.get("slug"),
            sortOrder: Number(form.get("sortOrder") || 0),
            isActive: form.get("isActive") === "on",
        };

        if (selectedCategory?.id != null) {
            const updated = await updateAdminCategory(selectedCategory.id, payload);
            setCategories((current) => current.map((category) => (category.id === updated.id ? updated : category)));
            setSelectedCategory(updated);
        } else {
            const created = await createAdminCategory(payload);
            setCategories((current) => [...current, created].sort((a, b) => a.sortOrder - b.sortOrder));
            setSelectedCategory(created);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm("Видалити категорію?")) return;
        await deleteAdminCategory(categoryId);
        const next = categories.filter((category) => category.id !== categoryId);
        setCategories(next);
        setSelectedCategory(next[0] ?? null);
    };

    return (
        <main className="bh-main admin-panel">
            <header className="bh-top">
                <div>
                    <h1 className="bh-heading">
                        <FolderTree size={24} style={{ marginRight: 10, verticalAlign: "middle" }} />
                        Меню та категорії
                    </h1>
                    <p className="bh-subheading">Глобальне керування стравами закладів і backend-backed категоріями.</p>
                </div>
            </header>

            <section className="admin-grid-2">
                <div className="admin-panel-card">
                    <div className="admin-toolbar">
                        <select value={selectedBusinessId} onChange={(e) => setSelectedBusinessId(e.target.value)}>
                            {businesses.map((business) => (
                                <option key={business.id} value={business.id}>
                                    {business.name}
                                </option>
                            ))}
                        </select>
                        <button className="admin-action-btn primary" type="button" onClick={() => {
                            setEditingDish(null);
                            setIsModalOpen(true);
                        }}>
                            <Plus size={16} /> Додати страву
                        </button>
                    </div>

                    <div className="dishes-grid admin" style={{ marginTop: 16 }}>
                        {dishes.map((dish) => (
                            <div key={dish.id} className="admin-dish-card">
                                <div className="thumb">
                                    <img
                                        src={resolveDishImage(dish, dish.categoryLabel, dish.name, activeBusiness?.id)}
                                        alt={dish.name}
                                        {...dishImgProps}
                                        onError={(event) =>
                                            handleImageError(
                                                event,
                                                resolveDishImage(null, dish.categoryLabel, dish.name, activeBusiness?.id)
                                            )
                                        }
                                    />
                                </div>
                                <div className="meta">
                                    <div className="row">
                                        <h3 className="dish-name">{dish.name}</h3>
                                        <div className="price">{dish.price} ₴</div>
                                    </div>
                                    <div className="row sub">
                                        <span>{dish.categoryLabel}</span>
                                        <span>{dish.cookingTime} хв</span>
                                    </div>
                                    <div className="small-muted">{dish.description}</div>
                                    <div className="admin-inline-actions">
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            onClick={() => {
                                                setEditingDish(dish);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-btn danger"
                                            onClick={() => handleDeleteDish(dish.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {dishes.length === 0 && <div className="bh-empty">Для цього закладу ще немає страв.</div>}
                    </div>
                </div>

                <div className="admin-panel-card">
                    <div className="admin-toolbar">
                        <button type="button" onClick={() => setSelectedCategory(null)}>
                            Нова категорія
                        </button>
                    </div>

                    <div className="admin-list" style={{ marginTop: 16 }}>
                        {categories.map((category) => (
                            <div key={category.id} className="admin-list-item">
                                <div>
                                    <strong>{category.name}</strong>
                                    <div className="small-muted">#{category.id} · {category.slug}</div>
                                </div>
                                <div className="admin-inline-actions">
                                    <button type="button" onClick={() => setSelectedCategory(category)}>
                                        Редагувати
                                    </button>
                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={() => handleDeleteCategory(category.id)}
                                    >
                                        Видалити
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form className="admin-stack" onSubmit={handleCategorySubmit} style={{ marginTop: 24 }}>
                        <h3>{selectedCategory ? "Редагувати категорію" : "Створити категорію"}</h3>
                        <div className="admin-form-grid">
                            <div>
                                <label className="small-muted">Назва</label>
                                <input name="name" defaultValue={selectedCategory?.name ?? ""} key={`name-${selectedCategory?.id ?? "new"}`} />
                            </div>
                            <div>
                                <label className="small-muted">Slug</label>
                                <input name="slug" defaultValue={selectedCategory?.slug ?? ""} key={`slug-${selectedCategory?.id ?? "new"}`} />
                            </div>
                            <div>
                                <label className="small-muted">Порядок</label>
                                <input
                                    type="number"
                                    name="sortOrder"
                                    defaultValue={selectedCategory?.sortOrder ?? categories.length}
                                    key={`sort-${selectedCategory?.id ?? "new"}`}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "end" }}>
                                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        defaultChecked={selectedCategory?.isActive ?? true}
                                        key={`active-${selectedCategory?.id ?? "new"}`}
                                    />
                                    Активна
                                </label>
                            </div>
                        </div>
                        <div className="admin-inline-actions">
                            <button type="submit" className="primary">
                                {selectedCategory ? "Оновити" : "Створити"}
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <DishComponent
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editing={editingDish}
                onCreate={handleCreateDish}
                onUpdate={handleUpdateDish}
                userData={{ user: { id: "admin" }, id: "admin" }}
                categories={categoryOptions}
            />
        </main>
    );
}
