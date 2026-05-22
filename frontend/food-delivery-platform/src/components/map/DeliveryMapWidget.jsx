import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Route, Store } from "lucide-react";
import { geocodeAddress, geocodeRestaurant, restaurantLocationQuery } from "../../utils/geocode.js";
import { fetchDrivingRoute } from "../../utils/routing.js";
import { DEFAULT_CITY, MAP_CENTER } from "../../constants/region.js";
import "./DeliveryMapWidget.css";
import "leaflet/dist/leaflet.css";

function pinIcon(color, label) {
  return L.divIcon({
    className: "dm-pin-wrap",
    html: `<span class="dm-pin" style="background:${color}">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const restaurantIcon = pinIcon("#7c5cff", "R");
const destinationIcon = pinIcon("#ff6b6b", "D");
const courierIcon = pinIcon("#00d4ff", "K");

function MapFitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [points, map]);
  return null;
}

/**
 * @param {object} props
 * @param {'delivery' | 'toVenue'} [props.routeMode] — delivery: R→D; toVenue: ваша точка→заклад
 */
export default function DeliveryMapWidget({
  deliverFrom,
  deliverTo,
  courier,
  restaurantAddress,
  destinationAddress,
  fallbackAddress,
  restaurantName,
  restaurantCity,
  height = 380,
  compact = false,
  title = "Маршрут",
  routeMode = "delivery",
}) {
  const destQuery = destinationAddress || fallbackAddress;
  const venueQuery =
    restaurantAddress ||
    (restaurantName
      ? restaurantLocationQuery(restaurantName, restaurantCity || DEFAULT_CITY)
      : null);

  const [resolvedFrom, setResolvedFrom] = useState(deliverFrom ?? null);
  const [resolvedTo, setResolvedTo] = useState(deliverTo ?? null);
  const [geocodingVenue, setGeocodingVenue] = useState(false);
  const [geocodingDest, setGeocodingDest] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState(null);

  useEffect(() => {
    if (deliverFrom?.latitude != null && deliverFrom?.longitude != null) {
      setResolvedFrom(deliverFrom);
      return;
    }
    if (!venueQuery?.trim()) {
      setResolvedFrom(null);
      return;
    }
    let cancelled = false;
    setGeocodingVenue(true);
    const geocodeVenue =
      restaurantAddress?.trim() || !restaurantName
        ? () => geocodeAddress(venueQuery)
        : () => geocodeRestaurant(restaurantName, restaurantCity || DEFAULT_CITY);

    geocodeVenue().then((pt) => {
      if (cancelled) return;
      setResolvedFrom(
        pt
          ? { ...pt, fullAddress: pt.fullAddress || venueQuery, label: "Заклад" }
          : null
      );
      setGeocodingVenue(false);
    });
    return () => {
      cancelled = true;
    };
  }, [deliverFrom, venueQuery, restaurantName, restaurantCity, restaurantAddress]);

  useEffect(() => {
    if (deliverTo?.latitude != null && deliverTo?.longitude != null) {
      setResolvedTo(deliverTo);
      return;
    }
    if (!destQuery?.trim()) {
      setResolvedTo(null);
      return;
    }
    let cancelled = false;
    setGeocodingDest(true);
    geocodeAddress(destQuery).then((pt) => {
      if (cancelled) return;
      setResolvedTo(
        pt
          ? { ...pt, fullAddress: pt.fullAddress || destQuery, label: "Ваша адреса" }
          : null
      );
      setGeocodingDest(false);
    });
    return () => {
      cancelled = true;
    };
  }, [deliverTo, destQuery]);

  const from = useMemo(() => normalizePoint(resolvedFrom, "Заклад"), [resolvedFrom]);
  const to = useMemo(() => normalizePoint(resolvedTo, "Куди їхати"), [resolvedTo]);
  const courierPt = useMemo(() => normalizePoint(courier, "Курʼєр"), [courier]);

  const routeEndpoints = useMemo(() => {
    if (!from || !to) return null;
    if (routeMode === "toVenue") {
      return { start: to, end: from };
    }
    return { start: from, end: to };
  }, [from, to, routeMode]);

  useEffect(() => {
    if (!routeEndpoints) {
      setRouteData(null);
      setRouteError(null);
      return;
    }

    let cancelled = false;
    setRouting(true);
    setRouteError(null);

    fetchDrivingRoute(routeEndpoints.start, routeEndpoints.end).then((result) => {
      if (cancelled) return;
      if (result) {
        setRouteData(result);
      } else {
        setRouteData(null);
        setRouteError("Не вдалося побудувати маршрут по дорогах");
      }
      setRouting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    routeEndpoints?.start?.latitude,
    routeEndpoints?.start?.longitude,
    routeEndpoints?.end?.latitude,
    routeEndpoints?.end?.longitude,
  ]);

  const fallbackLine = useMemo(() => {
    if (!from || !to) return null;
    return [
      [from.latitude, from.longitude],
      [to.latitude, to.longitude],
    ];
  }, [from, to]);

  const routePositions = routeData?.positions?.length ? routeData.positions : fallbackLine;

  const mapPoints = useMemo(() => {
    if (routePositions?.length) return routePositions;
    const pts = [];
    if (from) pts.push([from.latitude, from.longitude]);
    if (to) pts.push([to.latitude, to.longitude]);
    if (courierPt) pts.push([courierPt.latitude, courierPt.longitude]);
    return pts;
  }, [routePositions, from, to, courierPt]);

  const center = mapPoints[0] ?? MAP_CENTER;
  const geocoding = geocodingVenue || geocodingDest;
  const showRouteInfo = routeData?.distanceLabel && routeData?.durationLabel;

  const geocodeError = useMemo(() => {
    if (geocoding) return null;
    const parts = [];
    if (venueQuery && !from) parts.push("заклад");
    if (destQuery && !to) parts.push("вашу адресу");
    if (!parts.length) return null;
    return `Не вдалося знайти на карті: ${parts.join(" та ")}`;
  }, [geocoding, venueQuery, destQuery, from, to]);

  return (
    <div className={`delivery-map-widget ${compact ? "compact" : ""}`}>
      <div className="dmw-header">
        <h3 className="dmw-title">{title}</h3>
        {showRouteInfo && (
          <div className="dmw-route-stats">
            <Route size={16} />
            <span>
              {routeData.distanceLabel} · {routeData.durationLabel}
            </span>
          </div>
        )}
      </div>

      <div className="dmw-legend">
        {from && (
          <span className="dmw-legend-item">
            <Store size={14} /> {from.fullAddress || "Заклад"}
          </span>
        )}
        {to && (
          <span className="dmw-legend-item destination">
            <MapPin size={14} /> {to.fullAddress || "Ваша адреса"}
          </span>
        )}
        {geocoding && <span className="dmw-muted">Пошук точок на карті…</span>}
        {!geocoding && routeMode === "toVenue" && !to && (
          <span className="dmw-muted">Очікуємо вашу геопозицію (GPS)…</span>
        )}
        {routing && <span className="dmw-muted">Прокладаємо маршрут…</span>}
        {geocodeError && !geocoding && (
          <span className="dmw-error">{geocodeError}</span>
        )}
        {routeError && !routing && !geocodeError && (
          <span className="dmw-muted">{routeError}</span>
        )}
        {routeData && !routing && (
          <span className="dmw-muted dmw-route-hint">Маршрут по дорогах (авто)</span>
        )}
      </div>

      <div className="dmw-map" style={{ height }}>
        <MapContainer
          key={mapPoints.length ? `map-${mapPoints.length}-${center[0]}` : "map-default"}
          center={center}
          zoom={mapPoints.length >= 2 ? 12 : 13}
          scrollWheelZoom={!compact}
          className="dmw-leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · маршрут OSRM'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFitBounds points={mapPoints} />

          {routePositions && (
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: routeData ? "#00d4ff" : "#7c5cff",
                weight: routeData ? 5 : 3,
                opacity: routeData ? 0.9 : 0.45,
                dashArray: routeData ? undefined : "8 10",
              }}
            />
          )}

          {from && (
            <Marker position={[from.latitude, from.longitude]} icon={restaurantIcon}>
              <Popup>
                <strong>Заклад</strong>
                <br />
                {from.fullAddress}
              </Popup>
            </Marker>
          )}

          {to && (
            <Marker position={[to.latitude, to.longitude]} icon={destinationIcon}>
              <Popup>
                <strong>{routeMode === "toVenue" ? "Ви тут" : "Адреса доставки"}</strong>
                <br />
                {to.fullAddress}
              </Popup>
            </Marker>
          )}

          {courierPt && (
            <Marker position={[courierPt.latitude, courierPt.longitude]} icon={courierIcon}>
              <Popup>Курʼєр</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

function normalizePoint(p, defaultLabel) {
  if (!p) return null;
  const lat = Number(p.latitude ?? p.lat);
  const lng = Number(p.longitude ?? p.lng ?? p.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return {
    latitude: lat,
    longitude: lng,
    fullAddress: p.fullAddress || p.address || defaultLabel,
    label: p.label || defaultLabel,
  };
}
