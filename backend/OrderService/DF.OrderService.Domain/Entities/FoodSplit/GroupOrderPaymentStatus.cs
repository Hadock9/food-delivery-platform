namespace DF.OrderService.Domain.Entities.FoodSplit;

public enum GroupOrderPaymentStatus
{
    Pending = 0,
    Processing = 1,
    Succeeded = 2,
    Failed = 3,
    Cancelled = 4
}
