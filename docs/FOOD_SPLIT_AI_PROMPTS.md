# Промпти ШІ для Food Split (готові)

## Етап 1 — БД ✅
Див. `docs/FOOD_SPLIT_SCHEMA.md`, міграція `20260522120000_AddFoodSplitTables`.

## Етап 2 — Socket.io ✅
Реалізовано в `backend/food-split-service/src/socket/handlers.js`.

```text
Промт (виконано): Node.js + Socket.io, події join_room, add_item, remove_item, change_status,
запис у PostgreSQL GroupCartItem, broadcast room_updated, JWT + sessionToken.
```

## Етап 3 — Payment ✅
`backend/food-split-service/src/services/paymentService.js`, `splitCalculator.js`.

```text
Промт (виконано): calculateSplit з пропорційною доставкою/зборами/чайовими,
mock PaymentIntent hold, webhook, capture після всіх учасників, таймаут 10 хв.
```

## Етап 4 — React ✅
`frontend/.../features/food-split/GroupCartPage.jsx`

```text
Промт (виконано): учасники, кошик по людях, сума та "твоя частка", кнопки хоста/учасника,
socket.io-client, room_updated.
```

## Checklist розробника

- [x] Міграція БД
- [x] WebSocket сервер
- [ ] `npm install` у food-split-service та frontend (локально)
- [ ] Тест двох клієнтів
- [ ] Підключити Stripe sandbox (опційно)
