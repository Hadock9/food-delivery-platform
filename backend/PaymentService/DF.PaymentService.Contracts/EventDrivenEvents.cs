namespace DF.Contracts.EventDriven;

public sealed record OrderCreatedEvent(
    Guid OrderId,
    decimal TotalPrice,
    string Currency,
    string PaymentMethod);

public sealed record OrderCancelledEvent(
    Guid OrderId,
    string? PaymentMethod);

public sealed record OrderDeliveredEvent(
    Guid OrderId,
    Guid CourierId,
    decimal CourierFee,
    string Currency,
    DateTime DeliveredAtUtc);
