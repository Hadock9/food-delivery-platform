# Portable Docker Run

Цей варіант потрібен для другого ПК, де немає локальних образів:

- `df.userservice.api:latest`
- `df.menuservice.api:latest`
- `df.trackingservice.api:latest`

`compose.portable.yaml` змушує Docker брати їх тільки з локально завантажених локальних образів і не робити `pull`.

## 1. Підготувати архів на першому ПК

Запусти на першому ПК:

```bash
cd "/Users/vasylfalyovskij/Desktop/Arsen/WEB"
docker save -o polyflow-portable-images-arm64.tar \
  df.userservice.api:latest \
  df.menuservice.api:latest \
  df.trackingservice.api:latest
```

Потім перенеси на другий ПК:

- саму папку `WEB`
- файл `polyflow-portable-images-arm64.tar`

## 2. Завантажити образи на другому ПК

PowerShell:

```powershell
cd C:\path\to\WEB
docker load -i .\polyflow-portable-images-arm64.tar
@"
PREBUILT_PLATFORM=linux/arm64
USER_SERVICE_IMAGE=df.userservice.api:latest
MENU_SERVICE_IMAGE=df.menuservice.api:latest
TRACKING_SERVICE_IMAGE=df.trackingservice.api:latest
"@ | Set-Content .\.env.portable
```

## 3. Підняти стек на другому ПК

PowerShell:

```powershell
docker compose --env-file .\.env.portable -f .\compose.yaml -f .\compose.portable.yaml up -d --build
```

Якщо другий ПК `Windows/x64`, залишай `PREBUILT_PLATFORM=linux/arm64` як є. Docker Desktop зазвичай запускає такі образи через емуляцію, просто повільніше.

## 4. Накотити SQL для Food Split

Після першого успішного `up`, накоти таблиці для `food-split`:

```powershell
$sql = Get-Content .\backend\OrderService\migrations-sql\20260522120000_AddFoodSplitTables.sql -Raw
$sql | docker exec -i df.orderservice.db psql -U OrderService -d OrderServiceDb
docker restart food-split-service
```

## 5. Швидка перевірка

```powershell
docker ps
curl http://127.0.0.1:5173/food-delivery-platform/
curl http://127.0.0.1:5001/swagger/index.html
curl http://127.0.0.1:5005/swagger/index.html
curl http://127.0.0.1:5004/swagger/index.html
curl http://127.0.0.1:5006/swagger/index.html
curl http://127.0.0.1:5007/swagger/index.html
```

Очікувано:

- `frontend` -> `200`
- `userservice` -> `200`
- `orderservice` -> `200`
- `menuservice` -> `200`
- `trackingservice` -> `200`
- `promoservice` -> `200`

## 6. Якщо фронт на старті пише `ECONNREFUSED`

Іноді в перші 1-2 хвилини API ще піднімаються. Якщо помилка не зникла сама:

```powershell
docker restart df.orderservice.api df.menuservice.api df.trackingservice.api
```
