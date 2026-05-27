using DF.OrderService.Domain.Entities;
using DF.OrderService.Domain.Entities.FoodSplit;
using Microsoft.EntityFrameworkCore;

namespace DF.OrderService.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderedDish> OrderedDishes { get; set; }

    public DbSet<GroupSession> GroupSessions { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<GroupCartItem> GroupCartItems { get; set; }
    public DbSet<GroupOrderPayment> GroupOrderPayments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");

            entity.HasKey(o => o.Id);

            entity.Property(o => o.BusinessId).IsRequired();
            entity.Property(o => o.OrderedBy).IsRequired();
            entity.Property(o => o.OrderDate).IsRequired();
            entity.Property(o => o.TotalPrice).HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(o => o.OrderStatus).HasConversion<int>().IsRequired();
            entity.Property(o => o.OrderNumber).HasMaxLength(50).IsRequired();
            entity.Property(o => o.DeliverToId);
            entity.Property(o => o.DeliverFromId);
            entity.Property(o => o.DeliveredById);
            entity.Property(o => o.Profit).HasColumnType("numeric");
        });

        modelBuilder.Entity<OrderedDish>(entity =>
        {
            entity.ToTable("OrderedDishes");

            entity.HasKey(od => od.Id);
            entity.Property(od => od.OrderId).IsRequired();
            entity.Property(od => od.DishId).IsRequired();

            entity.HasOne(od => od.Order)
                .WithMany()
                .HasForeignKey(od => od.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // --- Food Split ---

        modelBuilder.Entity<GroupSession>(entity =>
        {
            entity.ToTable("GroupSessions");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.HostUserId).IsRequired();
            entity.Property(x => x.BusinessId).IsRequired();
            entity.Property(x => x.Status).HasConversion<int>().IsRequired();
            entity.Property(x => x.ExpiresAt).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.Property(x => x.OrderId);

            entity.HasIndex(x => x.HostUserId);
            entity.HasIndex(x => x.BusinessId);
            entity.HasIndex(x => x.Status);
            entity.HasIndex(x => x.ExpiresAt);

            entity.HasOne<Order>()
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Participant>(entity =>
        {
            entity.ToTable("Participants");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.GroupSessionId).IsRequired();
            entity.Property(x => x.UserId);
            entity.Property(x => x.SessionToken).HasMaxLength(128).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.PaymentStatus).HasConversion<int>().IsRequired();
            entity.Property(x => x.JoinedAt).IsRequired();

            entity.HasIndex(x => x.GroupSessionId);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => new { x.GroupSessionId, x.SessionToken }).IsUnique();
            entity.HasIndex(x => new { x.GroupSessionId, x.UserId });

            entity.HasOne(x => x.GroupSession)
                .WithMany(s => s.Participants)
                .HasForeignKey(x => x.GroupSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GroupCartItem>(entity =>
        {
            entity.ToTable("GroupCartItems");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.GroupSessionId).IsRequired();
            entity.Property(x => x.ParticipantId).IsRequired();
            entity.Property(x => x.MenuItemId).IsRequired();
            entity.Property(x => x.Quantity).IsRequired();
            entity.Property(x => x.Price).HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.Property(x => x.CreatedAt).IsRequired();

            entity.HasIndex(x => x.GroupSessionId);
            entity.HasIndex(x => x.ParticipantId);
            entity.HasIndex(x => x.MenuItemId);

            entity.HasOne(x => x.GroupSession)
                .WithMany(s => s.CartItems)
                .HasForeignKey(x => x.GroupSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Participant)
                .WithMany(p => p.CartItems)
                .HasForeignKey(x => x.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GroupOrderPayment>(entity =>
        {
            entity.ToTable("GroupOrderPayments");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.GroupSessionId).IsRequired();
            entity.Property(x => x.ParticipantId).IsRequired();
            entity.Property(x => x.PaymentIntentId).HasMaxLength(256).IsRequired();
            entity.Property(x => x.Amount).HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(x => x.Status).HasConversion<int>().IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.Property(x => x.UpdatedAt);

            entity.HasIndex(x => x.GroupSessionId);
            entity.HasIndex(x => x.ParticipantId);
            entity.HasIndex(x => x.PaymentIntentId).IsUnique();
            entity.HasIndex(x => x.Status);

            entity.HasOne(x => x.GroupSession)
                .WithMany(s => s.Payments)
                .HasForeignKey(x => x.GroupSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Participant)
                .WithMany(p => p.Payments)
                .HasForeignKey(x => x.ParticipantId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
