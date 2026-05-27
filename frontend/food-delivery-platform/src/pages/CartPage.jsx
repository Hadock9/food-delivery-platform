import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

import "./styles/CartPage.css";
import { ROUTES } from "../utils/roleRoutes.js";
import { getCart, saveCart } from "../utils/CartStorage.jsx";
import { resolveDishImage, handleImageError, dishImgProps } from "../utils/images.js";
import { useUser } from "../context/UserContext.jsx";
import { resolveAccountRole } from "../utils/accountRole.js";

const CartPage = () => {
    const navigate = useNavigate();
    const { user, accounts, currentAccountId, loading } = useUser();
    const [cartItems, setCartItems] = useState(() => getCart());

    const syncCart = useCallback(() => {
        setCartItems(getCart());
    }, []);

    useEffect(() => {
        syncCart();
        const onStorage = (e) => {
            if (e.key === 'cart') syncCart();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [syncCart]);

    const currentAcc = accounts.find((a) => a.id === currentAccountId);
    const isCustomer =
        resolveAccountRole(currentAcc?.accountType) === 'Customer' ||
        resolveAccountRole(localStorage.getItem('currentAccountType')) === 'Customer';

    const updateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;
        const updated = cartItems.map(item =>
            String(item.id) === String(id) ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updated);
        saveCart(updated);
    };

    const removeItem = (id) => {
        const updated = cartItems.filter(item => String(item.id) !== String(id));
        setCartItems(updated);
        saveCart(updated);
    };

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate(ROUTES.login, { state: { from: ROUTES.customer.checkout } });
            return;
        }
        if (!loading && user && !isCustomer) {
            navigate(ROUTES.profile, { state: { cartHint: true, neededRole: 'Customer', from: ROUTES.customer.checkout } });
            return;
        }
        navigate(ROUTES.customer.checkout);
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-empty-wrapper">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="cart-empty">
                    <ShoppingCart size={80} strokeWidth={1.2} className="empty-icon" />
                    <h2>Ваш кошик порожній</h2>
                    <p>Додайте страви з меню, щоб зробити замовлення</p>
                    <Link to={ROUTES.customer.root} className="back-to-menu-btn">
                        <ArrowLeft size={20} /> Повернутись до меню
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="customer-page-content cart-page-root">
            <div className="cart-page-wrapper">
                <div className="cart-container">
                    <motion.h1 initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="cart-title">
                        <ShoppingCart size={32} /> Ваш кошик
                    </motion.h1>

                    <div className="cart-content">
                        <div className="cart-items">
                            <AnimatePresence>
                                {cartItems.map((item) => (
                                    <motion.div key={item.id} layout className="cart-item-card">
                                        <img
                                            src={resolveDishImage(item, item.category, item.name, item.businessId)}
                                            alt={item.name}
                                            className="cart-item-image"
                                            {...dishImgProps}
                                            onError={(e) =>
                                                handleImageError(
                                                    e,
                                                    resolveDishImage(null, item.category, item.name, item.businessId)
                                                )
                                            }
                                        />
                                        <div className="cart-item-info">
                                            <h3>{item.name}</h3>
                                            <p className="cart-restaurant">{item.restaurant}</p>
                                            <div className="quantity-controls">
                                                <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16} /></button>
                                                <span className="quantity">{item.quantity}</span>
                                                <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="cart-item-price">
                                            <p>{item.price * item.quantity} ₴</p>
                                            <button type="button" onClick={() => removeItem(item.id)} className="remove-btn"><Trash2 size={18} /></button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <motion.div className="cart-summary">
                            <div className="summary-row"><span>Разом:</span><strong>{totalPrice} ₴</strong></div>
                            <div className="summary-row"><span>Доставка:</span><span>Безкоштовно</span></div>
                            <div className="summary-divider" />
                            <div className="summary-row total"><span>До сплати:</span><strong className="final-price">{totalPrice} ₴</strong></div>
                            <button type="button" className="checkout-btn" onClick={handleCheckout}>
                                Оформити замовлення
                            </button>
                            <Link to={ROUTES.customer.root} className="continue-shopping">Продовжити покупки</Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
