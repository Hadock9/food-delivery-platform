# Food Split — схема даних (OrderService / PostgreSQL)

Групове замовлення з роздільною оплатою зберігається в **OrderServiceDb** поруч із таблицями `Orders` / `OrderedDishes`.

## Діаграма зв’язків

```mermaid
erDiagram
    GroupSession ||--o{ Participant : has
    GroupSession ||--o{ GroupCartItem : contains
    GroupSession ||--o{ GroupOrderPayment : tracks
    GroupSession }o--o| Order : "final OrderId"
    Participant ||--o{ GroupCartItem : adds
    Participant ||--o{ GroupOrderPayment : pays

    GroupSession {
        uuid Id PK
        uuid HostUserId
        uuid BusinessId
        int Status
        timestamptz ExpiresAt
        timestamptz CreatedAt
        uuid OrderId FK nullable
    }

    Participant {
        uuid Id PK
        uuid GroupSessionId FK
        uuid UserId nullable
        string SessionToken
        string Name
        int PaymentStatus
        timestamptz JoinedAt
    }

    GroupCartItem {
        uuid Id PK
        uuid GroupSessionId FK
        uuid ParticipantId FK
        uuid MenuItemId
        int Quantity
        decimal Price
        string Notes nullable
    }

    GroupOrderPayment {
        uuid Id PK
        uuid GroupSessionId FK
        uuid ParticipantId FK
        string PaymentIntentId UK
        decimal Amount
        int Status
    }
```

## Сутності та enum

| Сутність | Статуси / поля |
|----------|----------------|
| **GroupSession** | `Status`: Open (0), PaymentProcessing (1), Completed (2), Cancelled (3) |
| **Participant** | `PaymentStatus`: Pending, Authorized, Paid, Failed |
| **GroupOrderPayment** | `Status`: Pending, Processing, Succeeded, Failed, Cancelled |

Додатково (для платформи доставки):
- `BusinessId` — заклад (MenuService / business account)
- `OrderId` — посилання на фінальне замовлення після успішного checkout

## Логіка зв’язків

1. **GroupSession** — «кімната» замовлення. Хост (`HostUserId`) створює сесію для одного `BusinessId`, встановлює `ExpiresAt`. Поки `Status = Open`, учасники додають страви.

2. **Participant** — учасник (1:N від сесії). `UserId` заповнюється для залогінених; для гостя достатньо `SessionToken` + `Name`. Унікальність `(GroupSessionId, SessionToken)` не дає дублювати гостя в одній кімнаті.

3. **GroupCartItem** — позиція меню (1:N від сесії та від учасника). `MenuItemId` = `Dish.Id` у MenuService; `Price` фіксується на момент додавання. Подвійний FK на сесію й учасника дозволяє швидко рахувати суму по кімнаті та по людині.

4. **GroupOrderPayment** — спроба оплати учасника (1:N). `PaymentIntentId` унікальний (провайдер платежів). Коли всі учасники `Paid` і всі `GroupOrderPayment` `Succeeded`, сесію переводять у `PaymentProcessing` → створюють `Order` → `Completed`.

5. **Order** (існуюча таблиця) — опційний FK `GroupSession.OrderId` після злиття кошика в одне замовлення для кухні/кур’єра.

## Файли в репозиторії

- Сутності: `backend/OrderService/DF.OrderService.Domain/Entities/FoodSplit/`
- EF конфігурація: `DF.OrderService.Infrastructure/Data/AppDbContext.cs`
- Міграція: `Migrations/20260522120000_AddFoodSplitTables.cs`
- SQL вручну: `backend/OrderService/migrations-sql/20260522120000_AddFoodSplitTables.sql`

## Застосування міграції

```bash
cd backend/OrderService
dotnet ef database update --project DF.OrderService.Infrastructure --startup-project DF.OrderService.API
```

Або через Docker:

```bash
docker exec -i df.orderservice.db psql -U OrderService -d OrderServiceDb \
  < backend/OrderService/migrations-sql/20260522120000_AddFoodSplitTables.sql
docker restart df.orderservice.api
```
