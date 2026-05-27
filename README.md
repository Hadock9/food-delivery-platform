# food-delivery-platform

Повний гайд запуску з нуля: `docs/RUN_FROM_ZERO.md`

## Dev seed

Після `docker compose up -d` можна наповнити стек тестовими бізнесами, меню, стравами, customer/courier і demo-order:

```bash
node scripts/seed-dev.mjs
```

Скрипт також оновлює `frontend/food-delivery-platform/public/seed-business-catalog.json`, щоб публічний каталог закладів працював навіть якщо поточний `UserService` image все ще вимагає авторизацію для `/api/Account/all/business`.

Тестові креденшали після сіду:

- `seed-admin@example.com` / `Test123!`
- `seed-customer@example.com` / `Test123!`
- `seed-courier@example.com` / `Test123!`
- `seed-owner-pizza@example.com` / `Test123!`

Швидка перевірка MVP-контрактів після сіду:

```bash
node scripts/smoke-check.mjs
```

## Admin zone

Після `docker compose up -d --build frontend df.adminservice.api df.promoservice.api` доступна повна dev admin-зона:

- `http://localhost:5173/food-delivery-platform/admin`
- `http://localhost:5173/food-delivery-platform/admin/users`
- `http://localhost:5173/food-delivery-platform/admin/orders`
- `http://localhost:5173/food-delivery-platform/admin/menu`
- `http://localhost:5173/food-delivery-platform/admin/promos`

Backend опирається на:

- `df.adminservice.api` для users / orders / menu / dashboard
- source-controlled `df.promoservice.api` для promo CRUD + analytics + `check/apply`

`scripts/seed-dev.mjs` тепер виставляє реальну системну роль `Admin` у `UserServiceDb`, тому фронт більше не залежить від email-based pseudo-admin fallback.