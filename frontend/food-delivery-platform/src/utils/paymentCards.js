const PAYMENT_CARDS_STORAGE_KEY = "df-payment-cards-v1";

function readStoredCardsMap() {
    try {
        const raw = localStorage.getItem(PAYMENT_CARDS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeStoredCardsMap(cardsMap) {
    try {
        localStorage.setItem(PAYMENT_CARDS_STORAGE_KEY, JSON.stringify(cardsMap));
    } catch {
        // ignore localStorage write issues
    }
}

function normalizePaymentCard(raw, index = 0) {
    if (!raw) return null;

    const id = String(raw.id ?? raw.Id ?? `card-${index}`);
    const last4 = String(raw.last4 ?? raw.Last4 ?? "0000").slice(-4);
    const expiryDate = raw.expiryDate ?? raw.ExpiryDate ?? "MM/YY";
    const cardHolder = raw.cardHolder ?? raw.CardHolder ?? "CARD HOLDER";

    return {
        id,
        last4,
        expiryDate,
        cardHolder,
    };
}

export function getStoredPaymentCards(accountId) {
    if (!accountId) return [];
    const cardsMap = readStoredCardsMap();
    const cards = Array.isArray(cardsMap[String(accountId)]) ? cardsMap[String(accountId)] : [];
    return cards.map(normalizePaymentCard).filter(Boolean);
}

export function saveStoredPaymentCards(accountId, cards) {
    if (!accountId) return;
    const cardsMap = readStoredCardsMap();
    cardsMap[String(accountId)] = Array.isArray(cards)
        ? cards.map(normalizePaymentCard).filter(Boolean)
        : [];
    writeStoredCardsMap(cardsMap);
}

export function resolveAccountPaymentCards(account) {
    if (!account) return [];

    const storedCards = getStoredPaymentCards(account.id ?? account.Id);
    if (storedCards.length > 0) {
        return storedCards;
    }

    return Array.isArray(account.paymentCards)
        ? account.paymentCards.map(normalizePaymentCard).filter(Boolean)
        : [];
}

export function formatSavedCardLabel(card) {
    if (!card) return "";
    return `•••• ${card.last4} · ${card.cardHolder} · ${card.expiryDate}`;
}

export function buildSavedCardFormData(card) {
    if (!card) {
        return {
            cardNumber: "",
            cardExpiry: "",
            cardCVV: "",
            cardName: "",
        };
    }

    return {
        cardNumber: `•••• •••• •••• ${card.last4}`,
        cardExpiry: card.expiryDate,
        cardCVV: "",
        cardName: card.cardHolder,
    };
}
