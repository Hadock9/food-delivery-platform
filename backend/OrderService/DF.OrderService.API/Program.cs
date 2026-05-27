using System.Text;
using System.Text.Json;
using DF.OrderService.Application.Messaging.Clients;
using DF.OrderService.Application.Messaging.Consumers;
using DF.OrderService.Application.Messaging.Publishers;
using DF.OrderService.Application.Repositories;
using DF.OrderService.Application.Repositories.Interfaces;
using DF.OrderService.Application.Services;
using DF.OrderService.Application.Services.Interfaces;
using DF.OrderService.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// 🔹 Swagger
// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174")
            .AllowAnyHeader()                     // дозволяємо всі заголовки
            .AllowAnyMethod()                   // дозволяємо всі HTTP методи
            .AllowCredentials();               // розкоментуй, якщо потрібні куки або авторизація
    });
});

// JWT (shared with UserService / MenuService)
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key")!;
var issuer = jwtSection.GetValue<string>("Issuer");
var audience = jwtSection.GetValue<string>("Audience");
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// Database connection (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// RabbitMQ connection
builder.Services.AddSingleton<IConnection>(sp =>
{
    var config = builder.Configuration.GetSection("RabbitMQ");
    var factory = new ConnectionFactory
    {
        HostName = config["HostName"],
        UserName = config["UserName"],
        Password = config["Password"],
        Port = int.Parse(config["Port"])
    };
    return factory.CreateConnectionAsync().GetAwaiter().GetResult();
});

// RPC clients
builder.Services.AddSingleton<UserServiceRpcClient>();
builder.Services.AddSingleton<MenuServiceRpcClient>();
builder.Services.AddSingleton<TrackingServiceRpcClient>();

//EventPublishers
builder.Services.AddSingleton<IEventPublisher, OrderEventPublisher>();

//Consumers
builder.Services.AddSingleton<IConsumer, LocationsCreatedConsumer>();

builder.Services.AddHostedService<ConsumerHostedService>();


//Repositories
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderDishRepository, OrderDishRepository>();

//Services
builder.Services.AddScoped<IOrderService, OrderService>();

builder.Services.AddHttpClient<IDistanceService, OsrmDistanceService>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); 
}

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();