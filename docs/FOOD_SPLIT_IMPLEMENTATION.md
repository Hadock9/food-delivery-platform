# Food Split — реалізація (Етапи 2–4)

## Архітектура

```
React (Vite)  ←Socket.io→  food-split-service (Node :5010)
                                ↓ SQL
                         OrderServiceDb (PostgreSQL)
                                ↓ HTTP
                         OrderService (.NET :5005)
```

## Етап 2 — WebSocket (Socket.io)

| Подія | Хто | Дія |
|--------|-----|-----|
| `join_room` | Усі | JWT або `sessionToken` гостя → кімната `sessionId` |
| `add_item` | Учасник | INSERT `GroupCartItems` → `room_updated` |
| `remove_item` | Власник позиції | DELETE → `room_updated` |
| `change_status` | Хост | `PAYMENT_PROCESSING` → блокування кошика |

Безпека: перевірка `sessionToken` / `accessToken` (JWT з UserService), перевірка `Status === OPEN` для змін кошика.

## Етап 3 — PaymentService

- `calculateSplit(sessionId)` — страви + пропорційна доставка/сервіс/чайові.
- `startPaymentPhase` — mock `PaymentIntent` на кожного учасника (статус Hold = `Processing`).
- `POST /webhooks/payment` — підтвердження холду; коли всі учасники авторизовані → **Capture** → `create-orders` в OrderService.
- Кожні 60 с — скасування сесій, де за 10 хв не всі захолдили кошти.

## Етап 4 — React

- `/split/create?businessId={uuid}` — створення сесії (Customer).
- `/split/:sessionId` — груповий кошик, live-оновлення.
- Стилі: `food-split.css` (utility-класи в стилі Tailwind).

## Запуск

```bash
# 1. БД (якщо ще не застосовано)
docker exec -i df.orderservice.db psql -U OrderService -d OrderServiceDb \
  < backend/OrderService/migrations-sql/20260522120000_AddFoodSplitTables.sql

# 2. Node сервіс
cd backend/food-split-service
cp .env.example .env
npm install && npm run dev

# 3. Frontend
cd frontend/food-delivery-platform
npm install socket.io-client
npm run dev
```

## Тест вручну

1. Увійти як Customer, відкрити `/split/create?businessId={id закладу}`.
2. Скопіювати посилання `/split/{sessionId}?name=Оксана` в інкогніто — другий учасник.
3. Додати страви — обидва бачать `room_updated`.
4. Хост: «Перейти до роздільної оплати» → кожен «Захолдити» (mock).
5. Після всіх холдів — замовлення в OrderService.

## Stripe / LiqPay

Зараз mock (`pi_mock_*`). Для продакшену: підставити `STRIPE_SECRET_KEY`, у `authorizePayment` викликати Stripe API (`capture_method: manual`).
