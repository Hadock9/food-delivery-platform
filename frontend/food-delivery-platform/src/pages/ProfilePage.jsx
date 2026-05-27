import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { updateProfile } from "../api/Profile.jsx";
import { refresh } from "../api/Auth.jsx";
import { ADMIN_ACCOUNT_ID, buildAdminAccount, resolveAppRole } from "../utils/appRole.js";
import { homePathForRole } from "../utils/roleRoutes.js";
import {
    fileToDataUrl,
    resolveAccountImage,
    saveStoredAccountImage,
} from "../utils/accountImages.js";
import {
    resolveAccountPaymentCards,
    saveStoredPaymentCards,
} from "../utils/paymentCards.js";
import "./styles/ProfilePage.css";

const EMPTY_CARD_FORM = {
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: ""
};

const CARD_INPUT_BASE_STYLE = {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    background: "#1e1e1e",
    color: "#fff",
    border: "1px solid #434343",
    borderRadius: "8px"
};

const formatCardNumber = (value) =>
    value.replace(/\D/g, "").slice(0, 19).match(/.{1,4}/g)?.join(" ") || "";

const formatExpiryDate = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatCardHolder = (value) =>
    value
        .replace(/\s+/g, " ")
        .replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ' -]/g, "")
        .toUpperCase()
        .trimStart();

const normalizeExpiryForStorage = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length !== 4) return "";
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const luhnCheck = (number) => {
    let sum = 0;
    let shouldDouble = false;

    for (let i = number.length - 1; i >= 0; i -= 1) {
        let digit = Number(number[i]);
        if (Number.isNaN(digit)) return false;

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
};

const validateExpiryDate = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length !== 4) return "Вкажіть строк дії у форматі MM/YY";

    const month = Number(digits.slice(0, 2));
    const year = Number(`20${digits.slice(2)}`);
    if (month < 1 || month > 12) return "Місяць має бути від 01 до 12";

    const expiryDate = new Date(year, month, 0, 23, 59, 59, 999);
    if (expiryDate < new Date()) return "Строк дії картки минув";

    return null;
};

const validateCardForm = (cardForm, isNewCard) => {
    const errors = {};
    const normalizedHolder = cardForm.cardHolder.trim();
    const cleanNumber = cardForm.cardNumber.replace(/\D/g, "");

    if (!normalizedHolder || normalizedHolder.length < 2) {
        errors.cardHolder = "Вкажіть ім'я власника картки";
    } else if (!/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ' -]+$/.test(normalizedHolder)) {
        errors.cardHolder = "Ім'я може містити лише літери, пробіли, апостроф та дефіс";
    }

    if (isNewCard) {
        if (cleanNumber.length < 13 || cleanNumber.length > 19) {
            errors.cardNumber = "Номер картки має містити від 13 до 19 цифр";
        } else if (!luhnCheck(cleanNumber)) {
            errors.cardNumber = "Номер картки не пройшов перевірку";
        }

        if (!/^\d{3,4}$/.test(cardForm.cvv)) {
            errors.cvv = "CVV має містити 3 або 4 цифри";
        }
    }

    const expiryError = validateExpiryDate(cardForm.expiryDate);
    if (expiryError) {
        errors.expiryDate = expiryError;
    }

    return errors;
};

const ProfilePage = () => {
    const {
        user,
        accounts,
        currentAccountId,
        currentSystemRole,
        reloadUser,
        switchAccount,
        switchSystemRole,
        loading,
    } = useUser();

    const [error, setError] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [formData, setFormData] = useState({ name: "", phone: "", address: "", avatar: null });
    const [isAvatarHovered, setIsAvatarHovered] = useState(false);
    const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    const avatarInputRef = useRef(null);

    // Стан для карток (Customer)
    const [paymentCards, setPaymentCards] = useState([]);
    const [activeCardId, setActiveCardId] = useState(null);
    const [editingCardId, setEditingCardId] = useState(null);
    const [cardForm, setCardForm] = useState({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardHolder: ""
    });
    const [cardSuccess, setCardSuccess] = useState(null);
    const [cardErrors, setCardErrors] = useState({});

    // Стан для адрес закладів (Business)
    const [businessAddresses, setBusinessAddresses] = useState([]);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({ address: "" });
    const navigate = useNavigate();

    const accountTypeMap = { Customer: 0, Business: 1, Courier: 2 };
    const adminAccount = buildAdminAccount(user);
    const activeRole = resolveAppRole(user, accounts, currentAccountId, currentSystemRole);

    useEffect(() => {
        if (user && accounts && currentAccountId) {
            const currentAccount = accounts.find(a => a.id === currentAccountId);
            if (currentAccount) {
                setFormData({
                    name: currentAccount?.name || user.name || "",
                    phone: currentAccount?.phoneNumber || "",
                    address: currentAccount?.address || "",
                    avatar: resolveAccountImage(currentAccount),
                });

                // Ініціалізація платіжних карток
                const cards = resolveAccountPaymentCards(currentAccount);
                setPaymentCards(cards);
                setActiveCardId((prev) => (cards.some((card) => card.id === prev) ? prev : (cards[0]?.id || null)));

                // Ініціалізація адрес для бізнес-акаунту
                if (currentAccount.accountType === "Business" && currentAccount.businessAddresses) {
                    const addresses = currentAccount.businessAddresses.map((addr, index) => ({
                        id: addr.id || `addr-${index}`,
                        address: addr.address || addr
                    }));
                    setBusinessAddresses(addresses);
                } else if (currentAccount.accountType !== "Business") {
                    setBusinessAddresses([]);
                }
            }
        }
    }, [user, accounts, currentAccountId]);

    const handleEditToggle = (field) => setEditingField(field);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Оберіть файл зображення");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError("Зображення має бути меншим за 2 MB");
            return;
        }

        setError(null);
        setIsAvatarUploading(true);

        const currentAccount = accounts.find(a => a.id === currentAccountId);
        if (!currentAccount) {
            setIsAvatarUploading(false);
            setError("No active account found");
            return;
        }

        try {
            const avatarUrl = await fileToDataUrl(file);
            saveStoredAccountImage(currentAccount.id, avatarUrl);
            setFormData(prev => ({ ...prev, avatar: avatarUrl }));
            setIsAvatarHovered(false);

            let token = localStorage.getItem("accessToken");
            if (!token) {
                const tokens = await refresh();
                token = tokens.accessToken;
            }

            const body = {
                Id: currentAccount.id,
                UserId: currentAccount.userId,
                AccountType: accountTypeMap[currentAccount.accountType] ?? 0,
                Name: formData.name || currentAccount.name,
                PhoneNumber: formData.phone || currentAccount.phoneNumber || "",
                Address: formData.address || currentAccount.address || "",
                Surname: currentAccount.surname || "",
                Description: currentAccount.description || "",
                ImageFile: file
            };

            await updateProfile(currentAccount.accountType.toLowerCase(), body, token);
            await reloadUser();
        } catch (err) {
            setError(err.response?.data || err.message || "Failed to update avatar");
        } finally {
            setIsAvatarUploading(false);
            if (avatarInputRef.current) {
                avatarInputRef.current.value = "";
            }
        }
    };

    const handleSave = async (field) => {
        try {
            let token = localStorage.getItem("accessToken");
            if (!token) {
                const tokens = await refresh();
                token = tokens.accessToken;
            }

            const currentAccount = accounts.find(a => a.id === currentAccountId);
            if (!currentAccount) throw new Error("No active account found");

            const body = {
                Id: currentAccount.id,
                UserId: currentAccount.userId,
                AccountType: accountTypeMap[currentAccount.accountType] ?? 0,
                Name: field === "name" ? formData.name : currentAccount.name,
                PhoneNumber: field === "phone" ? formData.phone || "" : currentAccount.phoneNumber || "",
                Address: field === "address" ? formData.address || "" : currentAccount.address || "",
                Surname: currentAccount.surname || "",
                Description: currentAccount.description || "",
            };

            await updateProfile(currentAccount.accountType.toLowerCase(), body, token);
            setEditingField(null);
            await reloadUser();
        } catch (err) {
            setError(err.response?.data || err.message || "Failed to save profile");
        }
    };

    const handleAccountSwitch = async (account) => {
        if (account.id === ADMIN_ACCOUNT_ID) {
            switchSystemRole("Admin");
            await reloadUser();
            navigate(homePathForRole("Admin"));
            return;
        }

        if (account.id === currentAccountId && currentSystemRole === "Admin") {
            switchSystemRole("Account");
            await reloadUser();
            navigate(homePathForRole(account.accountType));
            return;
        }

        await switchAccount(account.id);
        await reloadUser();
        navigate(homePathForRole(account.accountType));
    };

    // === Функції для карток ===
    const handleCardInputChange = (e) => {
        const { name, value } = e.target;
        let formatted = value;
        if (name === "cardNumber") formatted = formatCardNumber(value);
        if (name === "expiryDate") formatted = formatExpiryDate(value);
        if (name === "cvv") formatted = value.replace(/\D/g, "").slice(0, 4);
        if (name === "cardHolder") formatted = formatCardHolder(value);
        setCardForm(prev => ({ ...prev, [name]: formatted }));
        setCardErrors(prev => ({ ...prev, [name]: null }));
    };

    const startAddingCard = () => {
        setEditingCardId("new");
        const defaultHolder = formatCardHolder(
            [user?.name, user?.surname].filter(Boolean).join(" ") || formData.name || ""
        );
        setCardForm({ ...EMPTY_CARD_FORM, cardHolder: defaultHolder });
        setCardErrors({});
    };

    const startEditingCard = (card) => {
        setEditingCardId(card.id);
        setCardForm({
            cardNumber: "",
            expiryDate: formatExpiryDate(card.expiryDate),
            cvv: "",
            cardHolder: card.cardHolder
        });
        setCardErrors({});
    };

    const deleteCard = (id) => {
        const updatedCards = paymentCards.filter(c => c.id !== id);
        setPaymentCards(updatedCards);
        saveStoredPaymentCards(currentAccountId, updatedCards);
        if (activeCardId === id) {
            setActiveCardId(updatedCards[0]?.id || null);
        }
        setCardSuccess("Картку видалено");
        setTimeout(() => setCardSuccess(null), 3000);
    };

    const handleCardSubmit = (e) => {
        e.preventDefault();
        const isNewCard = editingCardId === "new";
        const validationErrors = validateCardForm(cardForm, isNewCard);
        if (Object.keys(validationErrors).length > 0) {
            setCardErrors(validationErrors);
            return;
        }

        const cleanNumber = cardForm.cardNumber.replace(/\D/g, "");

        const formattedExpiry = normalizeExpiryForStorage(cardForm.expiryDate) || "MM/YY";

        const cardData = {
            last4: cleanNumber.slice(-4) || paymentCards.find(c => c.id === editingCardId)?.last4 || "0000",
            expiryDate: formattedExpiry,
            cardHolder: cardForm.cardHolder.trim() || "CARD HOLDER",
        };

        let nextCards = [];
        if (editingCardId === "new") {
            const newCard = { id: Date.now().toString(), ...cardData };
            nextCards = [...paymentCards, newCard];
            setPaymentCards(nextCards);
            setActiveCardId(newCard.id);
            setCardSuccess("Картку додано!");
        } else {
            nextCards = paymentCards.map(c => c.id === editingCardId ? { ...c, ...cardData } : c);
            setPaymentCards(nextCards);
            setCardSuccess("Картку оновлено!");
        }
        saveStoredPaymentCards(currentAccountId, nextCards);

        setEditingCardId(null);
        setCardForm(EMPTY_CARD_FORM);
        setCardErrors({});
        setTimeout(() => setCardSuccess(null), 3000);
    };

    const cancelCardEdit = () => {
        setEditingCardId(null);
        setCardForm(EMPTY_CARD_FORM);
        setCardErrors({});
    };

    const selectCard = (id) => setActiveCardId(id);
    const getCardInputStyle = (fieldName, widthOverride = null) => ({
        ...CARD_INPUT_BASE_STYLE,
        ...(widthOverride ? { width: widthOverride } : {}),
        border: cardErrors[fieldName] ? "1px solid #ff7875" : CARD_INPUT_BASE_STYLE.border,
        boxShadow: cardErrors[fieldName] ? "0 0 0 1px rgba(255, 120, 117, 0.25)" : "none",
    });

    // === Функції для адрес бізнесу ===
    const startAddingAddress = () => {
        setEditingAddressId("new");
        setAddressForm({ address: "" });
    };

    const startEditingAddress = (addr) => {
        setEditingAddressId(addr.id);
        setAddressForm({ address: addr.address });
    };

    const deleteAddress = (id) => {
        setBusinessAddresses(prev => prev.filter(a => a.id !== id));
    };

    const handleAddressSubmit = (e) => {
        e.preventDefault();
        if (!addressForm.address.trim()) return;

        if (editingAddressId === "new") {
            const newAddr = {
                id: Date.now().toString(),
                address: addressForm.address.trim()
            };
            setBusinessAddresses(prev => [...prev, newAddr]);
        } else {
            setBusinessAddresses(prev => prev.map(a =>
                a.id === editingAddressId ? { ...a, address: addressForm.address.trim() } : a
            ));
        }

        setEditingAddressId(null);
        setAddressForm({ address: "" });
    };

    const cancelAddressEdit = () => {
        setEditingAddressId(null);
        setAddressForm({ address: "" });
    };

    if (loading) return <>⏳ Loading profile...</>;
    if (error) return <>❌ {error}</>;

    const currentAccount = accounts.find(a => a.id === currentAccountId);
    const displayedAccounts = adminAccount ? [adminAccount, ...accounts] : accounts;
    const isCustomer = currentAccount?.accountType === "Customer";
    const isBusiness = currentAccount?.accountType === "Business";

    return (
        <div className="page-wrapper">
            <div className="user-container">
                <h2>🍔 FoodExpress — Profile</h2>

                <div className="user-card">
                    <div
                        className="user-avatar"
                        onMouseEnter={() => setIsAvatarHovered(true)}
                        onMouseLeave={() => setIsAvatarHovered(false)}
                    >
                        {formData.avatar ? (
                            <img src={formData.avatar} alt="Avatar" className="avatar-image" />
                        ) : (
                            <div className="avatar-initial">{currentAccount?.name?.[0] ?? "U"}</div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="avatar-input"
                            ref={avatarInputRef}
                            onChange={handleAvatarChange}
                            disabled={isAvatarUploading}
                        />
                        {isAvatarHovered && (
                            <div className="avatar-tooltip">
                                {isAvatarUploading ? "Uploading..." : "Edit"}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        className="avatar-upload-btn"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isAvatarUploading}
                    >
                        {isAvatarUploading ? "Uploading..." : "Завантажити фото"}
                    </button>

                    <div className="meta">
                        {editingField === "name" ? (
                            <div className="edit-field">
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    onBlur={() => handleSave("name")}
                                    className="edit-input"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="user-name">
                                {formData.name}
                                <button className="field-edit-btn" onClick={() => handleEditToggle("name")}>✏️</button>
                            </div>
                        )}
                        <p>📧 {user?.email}</p>

                        {editingField === "phone" ? (
                            <div className="edit-field">
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    onBlur={() => handleSave("phone")}
                                    className="edit-input"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <p>
                                📱 {formData.phone || "—"}
                                <button className="field-edit-btn" onClick={() => handleEditToggle("phone")}>✏️</button>
                            </p>
                        )}

                        {editingField === "address" ? (
                            <div className="edit-field">
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    onBlur={() => handleSave("address")}
                                    className="edit-input"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <p>
                                📍 {formData.address || "—"}
                                <button className="field-edit-btn" onClick={() => handleEditToggle("address")}>✏️</button>
                            </p>
                        )}
                    </div>
                </div>

                <div className="user-info">
                    <div className="active-accounts">
                        <h3>Accounts</h3>
                        <ul>
                            {displayedAccounts.map((account) => (
                                <li
                                    key={account.id}
                                    className={
                                        (account.id === ADMIN_ACCOUNT_ID && activeRole === "Admin") ||
                                        (account.id === currentAccountId && activeRole !== "Admin")
                                            ? "active-account"
                                            : ""
                                    }
                                    onClick={() => handleAccountSwitch(account)}
                                >
                                    <div className="account-avatar">
                                        {resolveAccountImage(account) ? (
                                            <img src={resolveAccountImage(account)} alt={account.name} className="account-avatar-image" />
                                        ) : (
                                            <div className="avatar-initial">{account.name?.[0] ?? "U"}</div>
                                        )}
                                    </div>
                                    <div>
                                        {account.name} ({account.accountType})
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Блок платіжних карток — тільки для Customer */}
                    {isCustomer && (
                        <div style={{ marginTop: "24px" }}>
                            <h3 style={{ color: "#fff" }}>💳 Банківські картки</h3>
                            {cardSuccess && (
                                <div style={{ color: "#52c41a", marginBottom: "12px", fontWeight: "500" }}>
                                    {cardSuccess}
                                </div>
                            )}

                            {paymentCards.map((card) => (
                                <div
                                    key={card.id}
                                    style={{
                                        marginBottom: "12px",
                                        padding: "16px",
                                        background: activeCardId === card.id ? "#1f3a5f" : "#2d2d2d",
                                        borderRadius: "12px",
                                        border: activeCardId === card.id ? "2px solid #1890ff" : "1px solid #434343",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                    }}
                                    onClick={() => selectCard(card.id)}
                                >
                                    <p style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "500", color: "#fff" }}>
                                        •••• •••• •••• {card.last4}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditingCard(card);
                                            }}
                                            style={{ marginLeft: "12px", background: "none", border: "none", color: "#69b1ff", fontSize: "14px", cursor: "pointer" }}
                                        >
                                            ✏️ Змінити
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCard(card.id);
                                            }}
                                            style={{ marginLeft: "8px", background: "none", border: "none", color: "#ff4d4f", fontSize: "14px", cursor: "pointer" }}
                                        >
                                            🗑️ Видалити
                                        </button>
                                    </p>
                                    <p style={{ margin: "4px 0", color: "#d0d0d0" }}>Термін дії: {card.expiryDate}</p>
                                    <p style={{ margin: "4px 0", color: "#d0d0d0" }}>Власник: {card.cardHolder}</p>
                                </div>
                            ))}

                            {editingCardId && (
                                <div style={{
                                    padding: "16px",
                                    background: "#2d2d2d",
                                    borderRadius: "12px",
                                    border: "1px solid #434343",
                                    marginBottom: "16px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                                }}>
                                    <form onSubmit={handleCardSubmit}>
                                        <div style={{ marginBottom: "16px" }}>
                                            <input
                                                type="text"
                                                name="cardHolder"
                                                placeholder="Ім'я власника"
                                                value={cardForm.cardHolder}
                                                onChange={handleCardInputChange}
                                                required
                                                autoComplete="cc-name"
                                                style={getCardInputStyle("cardHolder")}
                                            />
                                            {cardErrors.cardHolder && (
                                                <div style={{ marginTop: "8px", color: "#ff7875", fontSize: "13px" }}>
                                                    {cardErrors.cardHolder}
                                                </div>
                                            )}
                                        </div>

                                        {editingCardId === "new" && (
                                            <div style={{ marginBottom: "16px" }}>
                                                <input
                                                    type="text"
                                                    name="cardNumber"
                                                    placeholder="Номер карти (наприклад: 4242 4242 4242 4242)"
                                                    value={cardForm.cardNumber}
                                                    onChange={handleCardInputChange}
                                                    required
                                                    autoComplete="cc-number"
                                                    inputMode="numeric"
                                                    maxLength="23"
                                                    style={getCardInputStyle("cardNumber")}
                                                />
                                                {cardErrors.cardNumber && (
                                                    <div style={{ marginTop: "8px", color: "#ff7875", fontSize: "13px" }}>
                                                        {cardErrors.cardNumber}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    name="expiryDate"
                                                    placeholder="MM/YY"
                                                    value={cardForm.expiryDate}
                                                    onChange={handleCardInputChange}
                                                    required
                                                    autoComplete="cc-exp"
                                                    inputMode="numeric"
                                                    maxLength="5"
                                                    style={getCardInputStyle("expiryDate")}
                                                />
                                                {cardErrors.expiryDate && (
                                                    <div style={{ marginTop: "8px", color: "#ff7875", fontSize: "13px" }}>
                                                        {cardErrors.expiryDate}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ width: "100px" }}>
                                                <input
                                                    type="password"
                                                    name="cvv"
                                                    placeholder="CVV"
                                                    value={cardForm.cvv}
                                                    onChange={handleCardInputChange}
                                                    required={editingCardId === "new"}
                                                    autoComplete="cc-csc"
                                                    inputMode="numeric"
                                                    maxLength="4"
                                                    style={getCardInputStyle("cvv", "100px")}
                                                />
                                                {cardErrors.cvv && (
                                                    <div style={{ marginTop: "8px", color: "#ff7875", fontSize: "13px" }}>
                                                        {cardErrors.cvv}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            style={{
                                                width: "100%",
                                                padding: "14px",
                                                background: "#1890ff",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontSize: "16px",
                                                fontWeight: "500",
                                                cursor: "pointer"
                                            }}
                                        >
                                            {editingCardId === "new" ? "Додати картку" : "Зберегти зміни"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={cancelCardEdit}
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                marginTop: "10px",
                                                background: "#434343",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontSize: "15px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Скасувати
                                        </button>
                                    </form>
                                </div>
                            )}

                            {!editingCardId && (
                                <button
                                    onClick={startAddingCard}
                                    style={{
                                        width: "100%",
                                        padding: "16px",
                                        background: "#1890ff",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontSize: "16px",
                                        fontWeight: "500",
                                        cursor: "pointer",
                                        marginTop: paymentCards.length > 0 ? "12px" : "0",
                                        boxShadow: "0 4px 12px rgba(24, 144, 255, 0.4)"
                                    }}
                                >
                                    ➕ Додати картку
                                </button>
                            )}
                        </div>
                    )}

                    {/* Блок адрес закладів — тільки для Business */}
                    {isBusiness && (
                        <div style={{ marginTop: "24px" }}>
                            <h3 style={{ color: "#fff" }}>🏪 Адреси закладів</h3>

                            {businessAddresses.map((addr) => (
                                <div
                                    key={addr.id}
                                    style={{
                                        position: "relative",
                                        marginBottom: "12px",
                                        padding: "16px",
                                        background: "#2d2d2d",
                                        borderRadius: "12px",
                                        border: "1px solid #434343",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                    }}
                                >
                                    <p style={{ margin: "0 0 8px 0", color: "#fff", fontSize: "16px" }}>
                                        📍 {addr.address}
                                    </p>
                                    <button
                                        onClick={() => startEditingAddress(addr)}
                                        style={{
                                            position: "absolute",
                                            top: "12px",
                                            right: "120px",  // ← Змінено з 68px на 100px — тепер не наїжджає
                                            background: "none",
                                            border: "none",
                                            color: "#69b1ff",
                                            fontSize: "14px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ✏️ Змінити
                                    </button>
                                    <button
                                        onClick={() => deleteAddress(addr.id)}
                                        style={{
                                            position: "absolute",
                                            top: "12px",
                                            right: "12px",
                                            background: "none",
                                            border: "none",
                                            color: "#ff4d4f",
                                            fontSize: "14px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        🗑️ Видалити
                                    </button>
                                </div>
                            ))}

                            {editingAddressId && (
                                <div style={{
                                    padding: "16px",
                                    background: "#2d2d2d",
                                    borderRadius: "12px",
                                    border: "1px solid #434343",
                                    marginBottom: "16px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                                }}>
                                    <form onSubmit={handleAddressSubmit}>
                                        <input
                                            type="text"
                                            placeholder="Введіть адресу закладу"
                                            value={addressForm.address}
                                            onChange={(e) => setAddressForm({ address: e.target.value })}
                                            required
                                            autoFocus
                                            style={{
                                                width: "100%",
                                                padding: "12px",
                                                fontSize: "15px",
                                                background: "#1e1e1e",
                                                color: "#fff",
                                                border: "1px solid #434343",
                                                borderRadius: "8px",
                                                marginBottom: "12px"
                                            }}
                                        />
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <button
                                                type="submit"
                                                style={{
                                                    flex: 1,
                                                    padding: "14px",
                                                    background: "#1890ff",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    fontSize: "16px",
                                                    fontWeight: "500",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {editingAddressId === "new" ? "Додати адресу" : "Зберегти"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelAddressEdit}
                                                style={{
                                                    flex: 1,
                                                    padding: "14px",
                                                    background: "#434343",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    fontSize: "16px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Скасувати
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {!editingAddressId && (
                                <button
                                    onClick={startAddingAddress}
                                    style={{
                                        width: "100%",
                                        padding: "16px",
                                        background: "#1890ff",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "12px",
                                        fontSize: "16px",
                                        fontWeight: "500",
                                        cursor: "pointer",
                                        marginTop: businessAddresses.length > 0 ? "12px" : "0",
                                        boxShadow: "0 4px 12px rgba(24, 144, 255, 0.4)"
                                    }}
                                >
                                    ➕ Додати адресу закладу
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;