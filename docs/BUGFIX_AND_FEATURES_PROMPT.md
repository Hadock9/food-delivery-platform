# Промпт: виправлення багів і нові фічі — Food Delivery Platform

## Контекст
- Frontend: `frontend/food-delivery-platform/` (Vite, React, basename `/food-delivery-platform`)
- Backend: Docker-сервіси на `df-platform` (User 5001, Menu 5004, Order 5005, Tracking 5006, Promo 5007)
- Гілка роботи: `mod`

## Критичні баги (пріоритет 1)

### 1. Бізнес не бачить замовлення клієнта
**Симптом:** у клієнта є активні замовлення (`/customer/orders`), на `/business/orders` — порожньо.

**Причина:** `OrderService.GetAllByBusinessIdAsync`:
- не фільтрує по `businessId` (бере `GetAll()`);
- вимагає `DeliverToId` + `DeliverFromId`, але при створенні вони `null` (локації приходять асинхронно з RabbitMQ).

**Фікс:**
- `GetOrdersByBusinessIdAsync(businessId)`;
- прибрати жорсткий фільтр по location IDs;
- адресу клієнта брати з Tracking лише якщо IDs є, інакше «—».

### 2. Бізнес «Меню» не відкривається / редірект на профіль
**Фікс:** `ProtectedRoute` — доступ до business-роутів, якщо є Business-акаунт; `HomePage` через `UserContext`.

### 3. API шляхи Order
**Перевірити:** frontend `/api/order` → proxy → `http://localhost:5005/api/Order`.

## Баги (пріоритет 2)

- Категорії страв на бізнес-меню: нормалізація string/number з API.
- `activeClassName` на NavLink → callback `className` (React Router v6+).
- Кнопки «Відстежити» / «Деталі» — flex + padding.
- Зображення страв: `resolveDishImage`, `referrerPolicy`.

## Нові фічі (пріоритет 3)

- Головна: welcome для гостей, `WelcomeBanner` для ролей.
- `/restaurant/:id`: завантаження за id, додавання в кошик.
- Бізнес: єдиний sidebar, `/dashboard`, заглушки promos/analytics.
- `npm run dev:redirect` — 5174 → 5173.

## Тест-план

1. Customer: оформити замовлення → `/customer/orders` — замовлення видно.
2. Business (Burger Hub / Pizza Palace): `/business/orders` — ті самі замовлення для відповідного закладу.
3. `/business/dishes` — CRUD страв.
4. `docker compose -f backend/OrderService/compose.yaml up -d --build` після змін OrderService.

## Food Split (Node + React) — реалізовано

- **Сервіс:** `backend/food-split-service/` (Express + Socket.io, порт **5010**)
- **Події:** `join_room`, `add_item`, `remove_item`, `change_status`, `room_updated`
- **Платежі:** `PaymentService` — split, mock PaymentIntent, webhook, таймаут 10 хв
- **UI:** `frontend/.../features/food-split/GroupCartPage.jsx`

```bash
cd backend/food-split-service && npm install && npm run dev
cd frontend/food-delivery-platform && npm install socket.io-client
```

## Команди

```bash
cd backend/OrderService && docker compose up -d --build
docker restart df.orderservice.api  # якщо лише DLL змінився після build
cd frontend/food-delivery-platform && npm run dev
```
