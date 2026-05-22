namespace DF.OrderService.Domain.Entities.FoodSplit;

public class GroupOrderPayment
{
    public Guid Id { get; set; }

    public Guid GroupSessionId { get; set; }

    public Guid ParticipantId { get; set; }

    /// <summary>Id платіжного інтенту (Stripe / LiqPay тощо).</summary>
    public string PaymentIntentId { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public GroupOrderPaymentStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public GroupSession GroupSession { get; set; } = null!;
    public Participant Participant { get; set; } = null!;
}
