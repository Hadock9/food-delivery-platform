# Run Project From Zero

Цей файл описує повний запуск проєкту з нуля: Docker, бази даних, сіди, перевірка та типові проблеми.

## 1. Що потрібно встановити

- `Docker Desktop` для macOS
- `Node.js` 22+ для запуску `scripts/seed-dev.mjs` і `scripts/smoke-check.mjs`
- `git`

Перевірка:

```bash
docker --version
docker compose version
node --version
git --version
```

## 2. Коренева папка проєкту

Працювати потрібно з кореня репозиторію:

```bash
cd "/Users/vasylfalyovskij/Desktop/Arsen/WEB"
```

## 3. Перед першим запуском

1. Запусти `Docker Desktop`.
2. Дочекайся, поки підніметься Docker daemon.

Швидка перевірка:

```bash
docker info
```

Якщо `docker info` не відповідає або пише, що daemon недоступний, не запускай `docker compose up` далі, поки Docker Desktop не стане нормальним.

## 4. Підняти весь стек

Рекомендований запуск:

```bash
docker compose up -d --build
```

Якщо хочеш бачити логи у foreground:

```bash
docker compose up --build
```

Після підйому перевір:

```bash
docker compose ps
```

Очікувано повинні бути `Up` такі сервіси:

- `df.frontend.dev`
- `df.userservice.api`
- `df.orderservice.api`
- `df.menuservice.api`
- `df.trackingservice.api`
- `df.promoservice.api`
- `df.adminservice.api`
- `food-split-service`
- `mssql`
- `df.orderservice.db`
- `df.menuservice.db`
- `df.trackingservice.db`
- `df.trackingservice.mongo`
- `df.redis`
- `rabbitmq`

## 5. Які БД використовуються

### UserService

- engine: `MS SQL Server`
- container: `mssql`
- host port: `11433`
- database: `UserServiceDb`

### OrderService

- engine: `PostgreSQL`
- container: `df.orderservice.db`
- host port: `5435`
- database: `OrderServiceDb`

### MenuService

- engine: `PostgreSQL`
- container: `df.menuservice.db`
- host port: `5436`
- database: `MenuServiceDb`

### TrackingService

- engine: `PostGIS/PostgreSQL`
- container: `df.trackingservice.db`
- host port: `5437`
- database: `TrackingServiceDb`

### TrackingService Mongo

- engine: `MongoDB`
- container: `df.trackingservice.mongo`
- host port: `27017`

### Додатково

- `Redis`: порт `6379`
- `RabbitMQ`: порти `5672`, `15672`

## 6. Порядок старту БД

У `compose.yaml` уже є healthchecks і `depends_on`, тому вручну нічого ініціалізувати не треба:

- `mssql-init` створює `UserServiceDb` і логін для `UserService`
- PostgreSQL/PostGIS/Mongo/Redis піднімаються контейнерами автоматично
- volume-и створюються автоматично Docker Compose
- `rabbitmq` сам виправляє права на `.erlang.cookie` під час старту, тому ручний `chown/chmod` більше не потрібен

## 7. Засіяти БД тестовими даними

Після того як стек піднятий:

```bash
node scripts/seed-dev.mjs
```

Що робить цей скрипт:

- створює тестових користувачів
- створює customer/business/courier акаунти
- створює бізнеси
- засіває меню й страви
- створює demo order
- створює реального `Admin` у `UserServiceDb`
- оновлює `frontend/food-delivery-platform/public/seed-business-catalog.json`
- генерує `frontend/food-delivery-platform/src/generated/seedBusinessCatalog.js`

## 8. Тестові креденшали

- `seed-admin@example.com` / `Test123!`
- `seed-customer@example.com` / `Test123!`
- `seed-courier@example.com` / `Test123!`
- `seed-owner-pizza@example.com` / `Test123!`
- `seed-owner-burger@example.com` / `Test123!`
- `seed-owner-sushi@example.com` / `Test123!`
- `seed-owner-coffee@example.com` / `Test123!`

## 9. Перевірити, що все працює

Після сіду:

```bash
node scripts/smoke-check.mjs
```

Скрипт перевіряє:

- логін користувача
- логін адміна
- реальну роль `Admin` у профілі
- admin users API
- admin orders API
- admin categories API
- admin businesses API
- admin dishes API
- admin dashboard API
- promo list API
- promo `check`

## 10. URL-и сервісів

### Frontend

- `http://localhost:5173/food-delivery-platform/`

### Admin zone

- `http://localhost:5173/food-delivery-platform/admin`
- `http://localhost:5173/food-delivery-platform/admin/users`
- `http://localhost:5173/food-delivery-platform/admin/orders`
- `http://localhost:5173/food-delivery-platform/admin/menu`
- `http://localhost:5173/food-delivery-platform/admin/promos`

### Backend ports

- `UserService`: `http://localhost:5001`
- `MenuService`: `http://localhost:5004`
- `OrderService`: `http://localhost:5005`
- `TrackingService`: `http://localhost:5006`
- `PromoService`: `http://localhost:5007`
- `AdminService`: `http://localhost:5011`
- `Food Split Service`: `http://localhost:5010`

## 11. Якщо потрібно запустити все абсолютно "з нуля"

Це повністю скине локальні дані БД:

```bash
docker compose down -v
docker compose up -d --build
node scripts/seed-dev.mjs
node scripts/smoke-check.mjs
```

Після `docker compose down -v` будуть видалені:

- MSSQL data
- PostgreSQL data
- PostGIS data
- Mongo data
- promo data volume

## 12. Якщо Docker зламався

Симптоми:

- `unexpected end of JSON input`
- `unable to get image ...`
- `docker ps` або `docker image inspect` зависає
- `Cannot connect to the Docker daemon`

Що робити:

1. Повністю перезапусти `Docker Desktop`.
2. Перевір:

```bash
docker info
```

3. Лише після цього повтори:

```bash
docker compose up -d --build
```

## 13. Якщо не стартує адмінка

Перевір:

```bash
docker compose ps df.adminservice.api df.promoservice.api frontend
```

Якщо треба перебудувати лише адмінські сервіси:

```bash
docker compose up -d --build frontend df.adminservice.api df.promoservice.api
```

## 14. Якщо треба дивитися логи

Увесь стек:

```bash
docker compose logs -f
```

Окремі сервіси:

```bash
docker compose logs -f frontend
docker compose logs -f df.userservice.api
docker compose logs -f df.orderservice.api
docker compose logs -f df.menuservice.api
docker compose logs -f df.trackingservice.api
docker compose logs -f df.promoservice.api
docker compose logs -f df.adminservice.api
```

## 15. Короткий чекліст запуску

```bash
cd "/Users/vasylfalyovskij/Desktop/Arsen/WEB"
docker info
docker compose up -d --build
docker compose ps
node scripts/seed-dev.mjs
node scripts/smoke-check.mjs
```

Після цього можна логінитися під:

- `seed-admin@example.com`
- `seed-customer@example.com`
Test123!
і працювати з UI.

docker compose up -d --build

Основний UI:

http://localhost:5173/food-delivery-platform/ — клієнтський фронтенд
http://localhost:5173/food-delivery-platform/admin — адмінка
Прямі сторінки адмінки:

http://localhost:5173/food-delivery-platform/admin/users
http://localhost:5173/food-delivery-platform/admin/orders
http://localhost:5173/food-delivery-platform/admin/menu
http://localhost:5173/food-delivery-platform/admin/promos
UI/Swagger для бекенд мікросервісів:

http://localhost:5001/swagger — UserService
http://localhost:5004/swagger — MenuService
http://localhost:5005/swagger — OrderService
http://localhost:5006/swagger — TrackingService
http://localhost:5007 — PromoService (якщо Swagger не піднятий, дивись API через frontend/admin)
http://localhost:5011 — AdminService
http://localhost:5010 — Food Split Service
Додатковий UI:

http://localhost:15672 — RabbitMQ Management логін зазвичай: guest / guest