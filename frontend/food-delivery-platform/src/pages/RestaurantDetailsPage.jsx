import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, X, Flame, MapPin, Star, Clock,
    ShoppingCart, Plus, Check
} from 'lucide-react';
import './styles/RestaurantDetailsPage.css';
import { getDishesForCustomerByBusinessId } from '../api/Dish.jsx';
import { getAllBusinessAccounts } from '../api/Account.jsx';
import { CategoryMap } from '../constants/category.jsx';
import { ROUTES } from '../utils/roleRoutes.js';
import {
    resolveDishImage,
    resolveRestaurantImage,
    handleImageError,
    dishImgProps,
} from '../utils/images.js';
import { addToCart, getCartCount } from '../utils/CartStorage.jsx';

const mapRestaurant = (r) => ({
    id: r.id,
    name: r.name,
    image: resolveRestaurantImage(r, r.id, r.name),
    description: r.description ?? 'Смачні страви з доставкою',
    rating: 4.8,
    deliveryTime: '25–40 хв',
    deliveryPrice: 'Безкоштовно від 300 ₴',
});

const RestaurantDetailsPage = () => {
    const { id: routeId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState(state?.restaurant ?? null);
    const [menu, setMenu] = useState([]);
    const [loadingRestaurant, setLoadingRestaurant] = useState(!state?.restaurant);
    const [loadingMenu, setLoadingMenu] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [userCity, setUserCity] = useState('Київ');
    const [userAddress, setUserAddress] = useState('Хрещатик, 22');
    const [cartToast, setCartToast] = useState(null);
    const [cartCount, setCartCount] = useState(getCartCount);

    const categoryRefs = useRef({});

    const restaurantId = restaurant?.id ?? routeId;

    useEffect(() => {
        if (restaurant || !routeId) return;

        let cancelled = false;
        const loadRestaurant = async () => {
            setLoadingRestaurant(true);
            setLoadError(null);
            try {
                const businesses = await getAllBusinessAccounts();
                const found = businesses?.find((b) => String(b.id) === String(routeId));
                if (!found) {
                    if (!cancelled) setLoadError('Заклад не знайдено');
                    return;
                }
                if (!cancelled) setRestaurant(mapRestaurant(found));
            } catch (e) {
                console.error('Помилка завантаження закладу:', e);
                if (!cancelled) setLoadError('Не вдалося завантажити заклад');
            } finally {
                if (!cancelled) setLoadingRestaurant(false);
            }
        };

        loadRestaurant();
        return () => {
            cancelled = true;
        };
    }, [routeId, restaurant]);

    useEffect(() => {
        if (!restaurantId) return;

        let cancelled = false;
        const loadMenu = async () => {
            setLoadingMenu(true);
            try {
                const dishes = await getDishesForCustomerByBusinessId(restaurantId);
                if (cancelled) return;
                setMenu(
                    (dishes ?? []).map((d) => ({
                        ...d,
                        businessId: restaurantId,
                        image: resolveDishImage(
                            d,
                            CategoryMap[d.category],
                            d.name,
                            restaurantId
                        ),
                        desc: d.description,
                        rating: d.rating ?? 4.5,
                        reviews: d.reviews ?? 0,
                        popular: d.popular ?? false,
                        restaurant: restaurant?.name ?? 'Ресторан',
                        category: CategoryMap[d.category] ?? 'Інше',
                        price: Number(d.price) || 0,
                    }))
                );
            } catch (e) {
                console.error('Помилка завантаження меню:', e);
                if (!cancelled) setLoadError('Не вдалося завантажити меню');
            } finally {
                if (!cancelled) setLoadingMenu(false);
            }
        };

        loadMenu();
        return () => {
            cancelled = true;
        };
    }, [restaurantId, restaurant?.name]);

    useEffect(() => {
        fetch('https://ipapi.co/json/')
            .then((res) => res.json())
            .then((data) => {
                if (data.city) {
                    setUserCity(data.city);
                    const addresses = {
                        Київ: 'Хрещатик, 22',
                        Львів: 'просп. Свободи, 7',
                        Одеса: 'Дерибасівська, 10',
                        Харків: 'вул. Сумська, 35',
                        Дніпро: 'просп. Дмитра Яворницького, 50',
                    };
                    setUserAddress(addresses[data.city] || 'центр міста');
                }
            })
            .catch(() => {
                setUserCity('Київ');
                setUserAddress('Хрещатик, 22');
            });
    }, []);

    const categories = useMemo(
        () => ['all', ...new Set(menu.map((d) => d.category).filter(Boolean))],
        [menu]
    );

    const displayedMenu = useMemo(() => {
        let result = [...menu];
        if (searchQuery) {
            result = result.filter((dish) =>
                dish.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedCategory !== 'all') {
            result = result.filter((dish) => dish.category === selectedCategory);
        }
        result.sort((a, b) => {
            if (sortBy === 'popular')
                return (b.popular ? 1 : 0) - (a.popular ? 1 : 0) || b.reviews - a.reviews;
            if (sortBy === 'price-asc') return a.price - b.price;
            if (sortBy === 'price-desc') return b.price - a.price;
            if (sortBy === 'rating') return b.rating - a.rating;
            return 0;
        });
        return result;
    }, [menu, searchQuery, selectedCategory, sortBy]);

    const handleAddToCart = useCallback(
        (dish, e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(
                {
                    id: dish.id,
                    businessId: restaurantId,
                    name: dish.name,
                    restaurant: restaurant?.name,
                    price: dish.price,
                    category: dish.category,
                    image: dish.image,
                },
                1
            );
            setCartCount(getCartCount());
            setCartToast(dish.name);
            window.setTimeout(() => setCartToast(null), 2200);
        },
        [restaurantId, restaurant?.name]
    );

    const scrollToCategory = (cat) => {
        setSelectedCategory(cat);
        if (cat === 'all') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (loadingRestaurant) {
        return (
            <div className="restaurant-page-glovo restaurant-page-loading">
                <div className="restaurant-loading-spinner" />
                <p>Завантаження закладу…</p>
            </div>
        );
    }

    if (loadError && !restaurant) {
        return (
            <div className="restaurant-page-glovo restaurant-page-error">
                <p>{loadError}</p>
                <Link to={ROUTES.customer.restaurants} className="restaurant-error-back">
                    <ArrowLeft size={18} /> До списку закладів
                </Link>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="restaurant-page-glovo not-found">
                <p>Ресторан не знайдено</p>
                <Link to={ROUTES.customer.restaurants}>Повернутися до закладів</Link>
            </div>
        );
    }

    const heroImage = resolveRestaurantImage(restaurant, restaurant.id, restaurant.name);
    const menuByCategory =
        selectedCategory === 'all' && !searchQuery
            ? categories.filter((c) => c !== 'all')
            : null;

    return (
        <div className="restaurant-page-glovo">
            <div className="restaurant-hero">
                <img
                    src={heroImage}
                    alt={restaurant.name}
                    className="hero-bg"
                    {...dishImgProps}
                    onError={(e) =>
                        handleImageError(
                            e,
                            resolveRestaurantImage(null, restaurant.id, restaurant.name)
                        )
                    }
                />
                <div className="hero-content">
                    <Link to={ROUTES.customer.restaurants} className="back-btn" aria-label="Назад">
                        <ArrowLeft size={28} />
                    </Link>
                    <div>
                        <h1 className="restaurant-name">{restaurant.name}</h1>
                        {restaurant.description && (
                            <p className="restaurant-tagline">{restaurant.description}</p>
                        )}
                        <div className="restaurant-meta-row">
                            <span className="restaurant-meta-badge">
                                <Star size={14} fill="gold" /> {restaurant.rating}
                            </span>
                            <span className="restaurant-meta-badge">
                                <Clock size={14} /> {restaurant.deliveryTime}
                            </span>
                            <span className="restaurant-meta-badge">
                                <MapPin size={14} /> {restaurant.deliveryPrice}
                            </span>
                        </div>
                        <div className="restaurant-location">
                            <MapPin size={18} />
                            <span>
                                Доставка: {userAddress}, {userCity}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sticky-header">
                <div className="search-input-wrapper">
                    <Search size={22} className="restaurant-search-icon" />
                    <input
                        type="text"
                        placeholder={`Пошук у ${restaurant.name}…`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <X
                            size={22}
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                            role="button"
                            tabIndex={0}
                            aria-label="Очистити"
                        />
                    )}
                    <div className="sort-bar">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="popular">Популярні</option>
                            <option value="price-asc">Дешевші спочатку</option>
                            <option value="price-desc">Дорожчі спочатку</option>
                            <option value="rating">За рейтингом</option>
                        </select>
                    </div>
                </div>

                <div className="categories-scroll">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => scrollToCategory(cat)}
                            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                        >
                            {cat === 'all' ? 'Усе меню' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {loadingMenu ? (
                <div className="menu-content menu-content--loading">
                    <p>Завантаження меню…</p>
                </div>
            ) : menu.length === 0 ? (
                <div className="menu-content menu-empty">
                    <p>У цьому закладі поки немає страв у меню.</p>
                    <Link to={ROUTES.customer.restaurants}>Інші заклади</Link>
                </div>
            ) : (
                <div className="menu-content">
                    {searchQuery || selectedCategory !== 'all' ? (
                        <div className="search-results">
                            {displayedMenu.length === 0 ? (
                                <p className="no-results">Нічого не знайдено за вашим запитом</p>
                            ) : (
                                <div className="dishes-grid dishes-grid--cards">
                                    {displayedMenu.map((dish) => (
                                        <MenuDishCard
                                            key={dish.id}
                                            dish={dish}
                                            restaurantId={restaurantId}
                                            onAdd={handleAddToCart}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        menuByCategory?.map((category) => {
                            const items = menu.filter((d) => d.category === category);
                            if (items.length === 0) return null;

                            return (
                                <div
                                    key={category}
                                    ref={(el) => {
                                        categoryRefs.current[category] = el;
                                    }}
                                    className="category-section"
                                >
                                    <h2 className="category-title">
                                        {category}
                                        <span className="count">{items.length}</span>
                                    </h2>
                                    <div className="dishes-grid dishes-grid--cards">
                                        {items.map((dish, i) => (
                                            <motion.div
                                                key={dish.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.03 }}
                                            >
                                                <MenuDishCard
                                                    dish={dish}
                                                    restaurantId={restaurantId}
                                                    onAdd={handleAddToCart}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <button
                type="button"
                className="restaurant-fab-cart"
                onClick={() => navigate(ROUTES.customer.cart)}
                aria-label="Кошик"
            >
                <ShoppingCart size={22} />
                {cartCount > 0 && <span className="restaurant-fab-badge">{cartCount}</span>}
            </button>

            <AnimatePresence>
                {cartToast && (
                    <motion.div
                        className="restaurant-cart-toast"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <Check size={18} /> {cartToast} додано в кошик
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function MenuDishCard({ dish, restaurantId, onAdd }) {
    const imgSrc = resolveDishImage(dish, dish.category, dish.name, restaurantId);

    return (
        <article className="menu-dish-card">
            <Link to={`/dish/${dish.id}`} className="menu-dish-card-link">
                {dish.popular && (
                    <div className="hit-badge">
                        <Flame size={16} /> Хіт
                    </div>
                )}
                <img
                    src={imgSrc}
                    alt={dish.name}
                    {...dishImgProps}
                    onError={(e) =>
                        handleImageError(
                            e,
                            resolveDishImage(null, dish.category, dish.name, restaurantId)
                        )
                    }
                />
                <div className="menu-dish-card-body">
                    <h3>{dish.name}</h3>
                    {dish.desc && <p className="desc">{dish.desc}</p>}
                    <div className="bottom">
                        <span className="price">{dish.price} ₴</span>
                        <span className="rating">
                            ★ {Number(dish.rating).toFixed(1)}
                        </span>
                    </div>
                </div>
            </Link>
            <button
                type="button"
                className="menu-dish-add-btn"
                onClick={(e) => onAdd(dish, e)}
                aria-label={`Додати ${dish.name} в кошик`}
            >
                <Plus size={20} />
            </button>
        </article>
    );
}

export default RestaurantDetailsPage;
