namespace DF.OrderService.Domain.Entities.FoodSplit;

public class GroupCartItem
{
    public Guid Id { get; set; }

    public Guid GroupSessionId { get; set; }

    public Guid ParticipantId { get; set; }

    /// <summary>Id страви в MenuService (Dish).</summary>
    public Guid MenuItemId { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public GroupSession GroupSession { get; set; } = null!;
    public Participant Participant { get; set; } = null!;
}
