const ACCOUNT_IMAGES_STORAGE_KEY = "df-account-images-v1";

function readStoredImages() {
    try {
        const raw = localStorage.getItem(ACCOUNT_IMAGES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeStoredImages(images) {
    try {
        localStorage.setItem(ACCOUNT_IMAGES_STORAGE_KEY, JSON.stringify(images));
    } catch {
        // ignore localStorage quota or privacy mode errors
    }
}

export function getStoredAccountImage(accountId) {
    if (!accountId) return null;
    const images = readStoredImages();
    return images[String(accountId)] || null;
}

export function saveStoredAccountImage(accountId, imageDataUrl) {
    if (!accountId || !imageDataUrl) return;
    const images = readStoredImages();
    images[String(accountId)] = imageDataUrl;
    writeStoredImages(images);
}

export function removeStoredAccountImage(accountId) {
    if (!accountId) return;
    const images = readStoredImages();
    delete images[String(accountId)];
    writeStoredImages(images);
}

export function resolveAccountImage(account) {
    if (!account) return null;
    return (
        getStoredAccountImage(account.id ?? account.Id) ||
        account.imageUrl ||
        account.ImageUrl ||
        null
    );
}

export function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
    });
}
