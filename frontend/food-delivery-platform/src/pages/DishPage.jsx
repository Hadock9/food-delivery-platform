// src/pages/DishPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, ChevronLeft, Plus, Minus, Zap, MessageCircle } from 'lucide-react';
import './styles/DishPage.css';
import {getDishForCustomer} from "../api/Dish.jsx";
import {CategoryMap} from "../constants/category.jsx";
import { resolveDishImage, handleImageError, dishImgProps } from "../utils/images.js";
import { addToCart } from "../utils/CartStorage.jsx";


// МОК ВІДГУКИ — ЗАЛИШАЮТЬСЯ
const mockReviews = {
    1: [
        { id: 1, author: "Олена", rating: 5, text: "Найкраща Маргарита!", date: "2 дні тому" },
        { id: 2, author: "Макс", rating: 4, text: "Хотілося б більше базиліку.", date: "1 тиждень тому" },
    ],
    2: [
        { id: 1, author: "Ігор", rating: 5, text: "Соковитий і великий бургер.", date: "3 дні тому" }
    ]
};

const DishPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dish, setDish] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [cartMessage, setCartMessage] = useState(null);

    useEffect(() => {
        const loadDish = async () => {
            try {
                const data = await getDishForCustomer(id);

                const mappedDish = {
                    id: data.id,
                    name: data.name,
                    businessId: data.businessDetails?.id,
                    image: resolveDishImage(
                        data,
                        CategoryMap[data.category] ?? data.category,
                        data.name,
                        data.businessDetails?.id
                    ),
                    imageUrl: data.imageUrl,
                    price: data.price,
                    cookingTime: data.cookingTime ? `${data.cookingTime} хв` : "",
                    description: data.description ?? "Опис відсутній",
                    category: CategoryMap[data.category] ?? "Страва",
                    weight: "300 г",
                    rating: 4.5,               // бекенд поки не дає рейтинг
                    reviewsCount: mockReviews[id]?.length ?? 0,
                    restaurant: data.businessDetails?.name ?? "Ресторан",
                    popular: true,
                    ingredients: data.ingredients?.map(i => i.name) ?? [],
                    nutrition: { calories: 400, protein: 20, fats: 10, carbs: 60 },
                    allergens: ["Глютен"]
                };

                setDish(mappedDish);
            } catch (err) {
                console.error("Помилка завантаження страви:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDish();
    }, [id]);

    if (loading) {
        return (
            <div className="dish-loading">
                <div className="spinner"></div>
                Завантаження...
            </div>
        );
    }

    if (!dish) {
        return (
            <div className="dish-not-found">
                <h2>Страву не знайдено</h2>
                <Link to="/">На головну</Link>
            </div>
        );
    }

    const reviewsList = mockReviews[id] ?? [];

    const handleAddToCart = () => {
        try {
            addToCart(dish, quantity);
            setCartMessage(`«${dish.name}» додано до кошика (×${quantity})`);
            window.setTimeout(() => setCartMessage(null), 4000);
        } catch (err) {
            console.error(err);
            setCartMessage('Не вдалося додати в кошик');
        }
    };

    const lineTotal = Number(dish.price) * quantity;


    return (
        <div className="dish-page">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dish-container">

                {/* Хлібні крихти */}
                <div className="breadcrumbs">
                    <Link to="/">Головна</Link> → <span>{dish.category}</span> → {dish.name}
                </div>

                <div className="dish-grid">
                    {/* ЛІВА КОЛОНКА — Фото + Відгуки */}
                    <div className="dish-left">
                        <div className="dish-image-wrapper">
                            <img
                                src={resolveDishImage(dish, dish.category, dish.name, dish.businessId)}
                                alt={dish.name}
                                className="dish-image"
                                {...dishImgProps}
                                onError={(e) =>
                                    handleImageError(
                                        e,
                                        resolveDishImage(null, dish.category, dish.name, dish.businessId)
                                    )
                                }
                            />
                            {dish.popular && <div className="popular-badge"><Zap size={16} /> ХІТ</div>}
                        </div>

                        {/* Відгуки (МОК) */}
                        <div className="reviews-section">
                            <h3><MessageCircle size={20} /> Відгуки ({reviewsList.length})</h3>

                            <div className="reviews-list">
                                {reviewsList.map(r => (
                                    <motion.div
                                        key={r.id}
                                        className="review-card"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <div className="review-header">
                                            <strong>{r.author}</strong>
                                            <div className="review-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        fill={i < r.rating ? "gold" : "none"}
                                                        stroke={i < r.rating ? "gold" : "#555"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p>{r.text}</p>
                                        <small>{r.date}</small>
                                    </motion.div>
                                ))}
                            </div>

                            <button className="show-more-reviews">Показати всі відгуки →</button>
                        </div>
                    </div>

                    {/* ПРАВА КОЛОНКА — Інформація */}
                    <div className="dish-info">
                        <h1 className="dish-title">{dish.name}</h1>

                        <div className="dish-meta">
                            <div className="rating"><Star size={20} fill="gold" /> {dish.rating}</div>
                            <div className="cooking-time"><Clock size={18} /> {dish.cookingTime}</div>
                        </div>

                        <div className="restaurant-info">
                            <MapPin size={16} /> <strong>{dish.restaurant}</strong><br />
                        </div>

                        <div className="price-section">
                            <div className="price-current">{dish.price} ₴</div>
                        </div>

                        <p className="description">{dish.description}</p>

                        {/* Кількість */}
                        <div className="quantity-controls">
                            <motion.button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="qty-btn minus">
                                <Minus size={28} />
                            </motion.button>

                            <motion.span className="quantity">{quantity}</motion.span>

                            <motion.button onClick={() => setQuantity(q => q + 1)} className="qty-btn plus">
                                <Plus size={28} />
                            </motion.button>
                        </div>

                        {cartMessage && (
                            <p className="cart-added-message" role="status">{cartMessage}</p>
                        )}

                        <motion.button
                            type="button"
                            className="add-to-cart-btn"
                            onClick={handleAddToCart}
                        >
                            Додати в кошик · {lineTotal} ₴
                        </motion.button>

                        <button
                            type="button"
                            className="go-to-cart-link"
                            onClick={() => navigate("/cart")}
                        >
                            Перейти до кошика
                        </button>


                        {/* Додаткова інформація */}
                        <div className="extra-info">
                            <div className="info-block">
                                <h4>Склад</h4>
                                <ul>
                                    {dish.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                </ul>
                            </div>

                            <div className="info-block">
                                <h4>Харчова цінність</h4>
                                <div className="nutrition-grid">
                                    <div>Калорії: <strong>{dish.nutrition.calories}</strong></div>
                                    <div>Білки: <strong>{dish.nutrition.protein} г</strong></div>
                                    <div>Жири: <strong>{dish.nutrition.fats} г</strong></div>
                                    <div>Вуглеводи: <strong>{dish.nutrition.carbs} г</strong></div>
                                </div>
                            </div>

                            {dish.allergens.length > 0 && (
                                <div className="info-block warning">
                                    <h4>Алергени</h4>
                                    <p>{dish.allergens.join(', ')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Link to="/" className="back-to-menu">
                    <ChevronLeft size={18} /> На головну
                </Link>
            </motion.div>
        </div>
    );
};

export default DishPage;
