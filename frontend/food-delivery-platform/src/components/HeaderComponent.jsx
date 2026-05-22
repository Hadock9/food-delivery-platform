// src/components/HeaderComponent.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import "./styles/HeaderComponent.css";
import { resolveRestaurantImage, handleImageError } from "../utils/images.js";
import { resolveAccountRole } from "../utils/accountRole.js";
import { ROUTES, homePathForRole } from "../utils/roleRoutes.js";

const Header = () => {
    const { user, accounts, currentAccountId, loading, logout, switchAccount } = useUser();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAccountsOpen, setIsAccountsOpen] = useState(true);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const activeRole = useMemo(() => {
        const acc = accounts.find((a) => a.id === currentAccountId) ?? accounts[0];
        return resolveAccountRole(acc?.accountType);
    }, [accounts, currentAccountId]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setIsAccountsOpen(true);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleOutsideClick);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [isDropdownOpen]);

    const handleSelectAccount = async (account) => {
        if (account.id === currentAccountId) {
            setIsDropdownOpen(false);
            return;
        }
        await switchAccount(account.id);
        setIsDropdownOpen(false);
        const role = resolveAccountRole(account.accountType);
        navigate(homePathForRole(role));
    };

    const toggleAccounts = () => setIsAccountsOpen((prev) => !prev);

    if (loading) {
        return (
            <header className="header">
                <h1>Foodie Delivery</h1>
                <p>Завантаження...</p>
            </header>
        );
    }

    const activeAccount = accounts.find((acc) => acc.id === currentAccountId) || {};
    const otherAccounts = accounts.filter((acc) => acc.id !== currentAccountId);
    const activeAvatar = resolveRestaurantImage(activeAccount, activeAccount.id, activeAccount.name);
    const totalAccounts = accounts.length;
    const navLinkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

    const getPosition = (index) => {
        if (totalAccounts === 1) return { x: 0, y: 0, zIndex: 3 };
        if (totalAccounts === 2) return { x: index === 0 ? -20 : 0, y: 0, zIndex: index === 0 ? 1 : 3 };
        if (index === 0) return { x: -20, y: 0, zIndex: 1 };
        if (index === 1) return { x: 20, y: 0, zIndex: 1 };
        return { x: 0, y: 0, zIndex: 3 };
    };

    const homeLink = user ? homePathForRole(activeRole) : ROUTES.home;

    return (
        <header className="header">
            <NavLink className="page-header" to={homeLink}>
                Foodie Delivery
            </NavLink>

            <nav className="header-nav">
                {!user && (
                    <>
                        <NavLink className={navLinkClass} to={ROUTES.home}>
                            Головна
                        </NavLink>
                        <NavLink className={navLinkClass} to={ROUTES.customer.restaurants}>
                            Заклади
                        </NavLink>
                        <NavLink className={navLinkClass} to={ROUTES.login}>
                            Увійти
                        </NavLink>
                        <NavLink className={navLinkClass} to={ROUTES.register}>
                            Реєстрація
                        </NavLink>
                    </>
                )}

                {user && activeRole === "Customer" && (
                    <>
                        <NavLink className={navLinkClass} to={ROUTES.customer.root}>
                            Каталог
                        </NavLink>
                        <NavLink className={navLinkClass} to={ROUTES.customer.restaurants}>
                            Заклади
                        </NavLink>
                        <NavLink className={navLinkClass} to={ROUTES.customer.cart}>
                            Кошик
                        </NavLink>
                    </>
                )}

                {user && activeRole === "Business" && (
                    <>
                        <NavLink className={navLinkClass} to={ROUTES.business.root}>
                            Панель
                        </NavLink>
                        <NavLink className={navLinkClass} to={ROUTES.business.orders}>
                            Замовлення
                        </NavLink>
                        <NavLink className={navLinkClass} to={ROUTES.business.dishes}>
                            Меню
                        </NavLink>
                    </>
                )}

                {user && activeRole === "Courier" && (
                    <NavLink className={navLinkClass} to={ROUTES.courier.root}>
                        Доставки
                    </NavLink>
                )}

                {user && (
                    <div className="account-bubbles-container" ref={dropdownRef}>
                        <div className="account-bubbles">
                            <motion.div
                                className="account-bubble active"
                                title={activeAccount.accountType}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                animate={{ x: 0, y: 0, scale: 1, zIndex: 3 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <motion.img
                                    src={activeAvatar}
                                    alt={activeAccount.accountType || "Account"}
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 0.2 }}
                                    onError={(e) =>
                                        handleImageError(
                                            e,
                                            resolveRestaurantImage(null, activeAccount.id, activeAccount.name)
                                        )
                                    }
                                />
                            </motion.div>

                            {otherAccounts.map((acc, index) => {
                                const position = getPosition(index);
                                return (
                                    <motion.div
                                        key={acc.id}
                                        className="account-bubble"
                                        title={acc.accountType}
                                        onClick={() => setIsDropdownOpen(true)}
                                        animate={{
                                            x: position.x,
                                            y: position.y,
                                            scale: 1,
                                            zIndex: position.zIndex,
                                            opacity: 0.7,
                                        }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    >
                                        <motion.img
                                            src={resolveRestaurantImage(acc, acc.id, acc.name)}
                                            alt={acc.accountType}
                                            whileHover={{ scale: 1.1, opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                            onError={(e) =>
                                                handleImageError(
                                                    e,
                                                    resolveRestaurantImage(null, acc.id, acc.name)
                                                )
                                            }
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    className="dropdown-content-header show"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    <h4>
                                        {user.name} {user.surname}
                                    </h4>

                                    <motion.button
                                        className="action-btn-header"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate(ROUTES.profile)}
                                    >
                                        Профіль
                                    </motion.button>

                                    <h5 className="accounts-toggle" onClick={toggleAccounts}>
                                        Акаунти {isAccountsOpen ? "▲" : "▼"}
                                    </h5>

                                    {isAccountsOpen && (
                                        <ul>
                                            {accounts.map((acc) => (
                                                <li
                                                    key={acc.id}
                                                    className={acc.id === currentAccountId ? "selected-account" : ""}
                                                    onClick={() => handleSelectAccount(acc)}
                                                >
                                                    {acc.accountType}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {accounts.length < 3 && (
                                        <motion.button
                                            className="action-btn-header"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => navigate(ROUTES.accountCreate)}
                                        >
                                            Новий акаунт
                                        </motion.button>
                                    )}

                                    <motion.button
                                        className="action-btn-header"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={logout}
                                    >
                                        Вийти
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
