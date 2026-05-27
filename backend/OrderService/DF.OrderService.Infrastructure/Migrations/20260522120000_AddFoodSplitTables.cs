using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DF.OrderService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFoodSplitTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GroupSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HostUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupSessions_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Participants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    SessionToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PaymentStatus = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Participants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Participants_GroupSessions_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupCartItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MenuItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupCartItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupCartItems_GroupSessions_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupCartItems_Participants_ParticipantId",
                        column: x => x.ParticipantId,
                        principalTable: "Participants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupOrderPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentIntentId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupOrderPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupOrderPayments_GroupSessions_GroupSessionId",
                        column: x => x.GroupSessionId,
                        principalTable: "GroupSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupOrderPayments_Participants_ParticipantId",
                        column: x => x.ParticipantId,
                        principalTable: "Participants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupSessions_BusinessId",
                table: "GroupSessions",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupSessions_ExpiresAt",
                table: "GroupSessions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupSessions_HostUserId",
                table: "GroupSessions",
                column: "HostUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupSessions_OrderId",
                table: "GroupSessions",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupSessions_Status",
                table: "GroupSessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Participants_GroupSessionId",
                table: "Participants",
                column: "GroupSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Participants_GroupSessionId_SessionToken",
                table: "Participants",
                columns: new[] { "GroupSessionId", "SessionToken" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Participants_GroupSessionId_UserId",
                table: "Participants",
                columns: new[] { "GroupSessionId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Participants_UserId",
                table: "Participants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupCartItems_GroupSessionId",
                table: "GroupCartItems",
                column: "GroupSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupCartItems_MenuItemId",
                table: "GroupCartItems",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupCartItems_ParticipantId",
                table: "GroupCartItems",
                column: "ParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupOrderPayments_GroupSessionId",
                table: "GroupOrderPayments",
                column: "GroupSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupOrderPayments_ParticipantId",
                table: "GroupOrderPayments",
                column: "ParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupOrderPayments_PaymentIntentId",
                table: "GroupOrderPayments",
                column: "PaymentIntentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupOrderPayments_Status",
                table: "GroupOrderPayments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "GroupOrderPayments");
            migrationBuilder.DropTable(name: "GroupCartItems");
            migrationBuilder.DropTable(name: "Participants");
            migrationBuilder.DropTable(name: "GroupSessions");
        }
    }
}
