-- Food Split — застосувати вручну до OrderServiceDb (PostgreSQL), якщо EF migrate не запускали
-- docker exec -i df.orderservice.db psql -U OrderService -d OrderServiceDb < migrations-sql/20260522120000_AddFoodSplitTables.sql

BEGIN;

CREATE TABLE IF NOT EXISTS "GroupSessions" (
    "Id" uuid NOT NULL,
    "HostUserId" uuid NOT NULL,
    "BusinessId" uuid NOT NULL,
    "Status" integer NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "OrderId" uuid NULL,
    CONSTRAINT "PK_GroupSessions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupSessions_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Participants" (
    "Id" uuid NOT NULL,
    "GroupSessionId" uuid NOT NULL,
    "UserId" uuid NULL,
    "SessionToken" character varying(128) NOT NULL,
    "Name" character varying(200) NOT NULL,
    "PaymentStatus" integer NOT NULL,
    "JoinedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_Participants" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Participants_GroupSessions_GroupSessionId" FOREIGN KEY ("GroupSessionId") REFERENCES "GroupSessions" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "GroupCartItems" (
    "Id" uuid NOT NULL,
    "GroupSessionId" uuid NOT NULL,
    "ParticipantId" uuid NOT NULL,
    "MenuItemId" uuid NOT NULL,
    "Quantity" integer NOT NULL,
    "Price" numeric(10,2) NOT NULL,
    "Notes" character varying(500) NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_GroupCartItems" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupCartItems_GroupSessions_GroupSessionId" FOREIGN KEY ("GroupSessionId") REFERENCES "GroupSessions" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GroupCartItems_Participants_ParticipantId" FOREIGN KEY ("ParticipantId") REFERENCES "Participants" ("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "GroupOrderPayments" (
    "Id" uuid NOT NULL,
    "GroupSessionId" uuid NOT NULL,
    "ParticipantId" uuid NOT NULL,
    "PaymentIntentId" character varying(256) NOT NULL,
    "Amount" numeric(10,2) NOT NULL,
    "Status" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NULL,
    CONSTRAINT "PK_GroupOrderPayments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupOrderPayments_GroupSessions_GroupSessionId" FOREIGN KEY ("GroupSessionId") REFERENCES "GroupSessions" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GroupOrderPayments_Participants_ParticipantId" FOREIGN KEY ("ParticipantId") REFERENCES "Participants" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_GroupSessions_BusinessId" ON "GroupSessions" ("BusinessId");
CREATE INDEX IF NOT EXISTS "IX_GroupSessions_ExpiresAt" ON "GroupSessions" ("ExpiresAt");
CREATE INDEX IF NOT EXISTS "IX_GroupSessions_HostUserId" ON "GroupSessions" ("HostUserId");
CREATE INDEX IF NOT EXISTS "IX_GroupSessions_OrderId" ON "GroupSessions" ("OrderId");
CREATE INDEX IF NOT EXISTS "IX_GroupSessions_Status" ON "GroupSessions" ("Status");

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Participants_GroupSessionId_SessionToken" ON "Participants" ("GroupSessionId", "SessionToken");
CREATE INDEX IF NOT EXISTS "IX_Participants_GroupSessionId" ON "Participants" ("GroupSessionId");
CREATE INDEX IF NOT EXISTS "IX_Participants_GroupSessionId_UserId" ON "Participants" ("GroupSessionId", "UserId");

CREATE INDEX IF NOT EXISTS "IX_GroupCartItems_GroupSessionId" ON "GroupCartItems" ("GroupSessionId");
CREATE INDEX IF NOT EXISTS "IX_GroupCartItems_ParticipantId" ON "GroupCartItems" ("ParticipantId");

CREATE UNIQUE INDEX IF NOT EXISTS "IX_GroupOrderPayments_PaymentIntentId" ON "GroupOrderPayments" ("PaymentIntentId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260522120000_AddFoodSplitTables', '9.0.11')
ON CONFLICT DO NOTHING;

COMMIT;
