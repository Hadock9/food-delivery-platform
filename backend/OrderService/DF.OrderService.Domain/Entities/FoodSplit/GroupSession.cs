namespace DF.OrderService.Domain.Entities.FoodSplit;

/// <summary>
/// Групова сесія «Food Split» — спільне замовлення з роздільною оплатою.
/// </summary>
public class GroupSession
{
    public Guid Id { get; set; }

    /// <summary>UserId хоста (акаунт Customer у UserService).</summary>
    public Guid HostUserId { get; set; }

    /// <summary>BusinessId закладу (MenuService / business account).</summary>
    public Guid BusinessId { get; set; }

    public GroupSessionStatus Status { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>Фінальне замовлення після успішної оплати всіх учасників (nullable до checkout).</summary>
    public Guid? OrderId { get; set; }

    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public ICollection<GroupCartItem> CartItems { get; set; } = new List<GroupCartItem>();
    public ICollection<GroupOrderPayment> Payments { get; set; } = new List<GroupOrderPayment>();
}
