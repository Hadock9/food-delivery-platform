using DF.OrderService.Application.Services.Interfaces;
using DF.OrderService.Contracts.Models.Requests;
using DF.OrderService.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DF.OrderService.API.Controllers;

/// <summary>§16 REST aliases — delegates to the same order service as <see cref="OrderController"/>.</summary>
[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var result = await orderService.CreateOrderAsync(request);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("{orderId:guid}")]
    public async Task<IActionResult> Get(Guid orderId)
    {
        return Ok(await orderService.GetOrderAsync(orderId));
    }

    [HttpPatch("{orderId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid orderId, [FromQuery] OrderStatus status)
    {
        return Ok(await orderService.ChangeOrderStatus(orderId, status));
    }
}
