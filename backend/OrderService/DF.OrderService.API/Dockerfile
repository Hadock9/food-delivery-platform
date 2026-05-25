FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["OrderService/nuget.config", "./nuget.config"]
COPY ["OrderService/DF.OrderService.API/DF.OrderService.API.csproj", "OrderService/DF.OrderService.API/"]
COPY ["OrderService/DF.OrderService.Application/DF.OrderService.Application.csproj", "OrderService/DF.OrderService.Application/"]
COPY ["OrderService/DF.OrderService.Contracts/DF.OrderService.Contracts.csproj", "OrderService/DF.OrderService.Contracts/"]
COPY ["OrderService/DF.OrderService.Domain/DF.OrderService.Domain.csproj", "OrderService/DF.OrderService.Domain/"]
COPY ["OrderService/DF.OrderService.Infrastructure/DF.OrderService.Infrastructure.csproj", "OrderService/DF.OrderService.Infrastructure/"]
COPY ["Contracts/DF.Contracts/DF.Contracts.csproj", "Contracts/DF.Contracts/"]
RUN dotnet restore "OrderService/DF.OrderService.API/DF.OrderService.API.csproj" --configfile ./nuget.config
COPY ["OrderService", "OrderService"]
COPY ["Contracts", "Contracts"]
WORKDIR "/src/OrderService/DF.OrderService.API"
RUN dotnet build "./DF.OrderService.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./DF.OrderService.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DF.OrderService.API.dll"]
