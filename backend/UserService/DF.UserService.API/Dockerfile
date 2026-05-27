FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app

# ✅ ВАЖЛИВО: саме тут додаємо certificates (runtime контейнер!)
RUN apt-get update && apt-get install -y \
    libgssapi-krb5-2 \
    ca-certificates && \
    update-ca-certificates

ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

ARG BUILD_CONFIGURATION=Release

WORKDIR /src

RUN apt-get update && apt-get install -y \
    libgssapi-krb5-2 \
    ca-certificates && \
    update-ca-certificates

COPY . .

WORKDIR /src/UserService/DF.UserService.API

RUN dotnet publish DF.UserService.API.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM base AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "DF.UserService.API.dll"]