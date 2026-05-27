namespace DF.OrderService.Domain.Entities.FoodSplit;

public class Participant
{
    public Guid Id { get; set; }

    public Guid GroupSessionId { get; set; }

    /// <summary>Зареєстрований користувач; null для гостя за посиланням.</summary>
    public Guid? UserId { get; set; }

    /// <summary>Токен сесії для гостя / ідентифікації в кімнаті.</summary>
    public string SessionToken { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public ParticipantPaymentStatus PaymentStatus { get; set; }

    public DateTime JoinedAt { get; set; }

    public GroupSession GroupSession { get; set; } = null!;
    public ICollection<GroupCartItem> CartItems { get; set; } = new List<GroupCartItem>();
    public ICollection<GroupOrderPayment> Payments { get; set; } = new List<GroupOrderPayment>();
}
