import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Store } from "lucide-react";
import { geocodeAddress, googleDirectionsUrl } from "../../utils/geocode.js";
import "./DeliveryMapWidget.css";
import "leaflet/dist/leaflet.css";

const KYIV_CENTER = [50.4501, 30.5234];

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
 * @param {{ latitude, longitude, fullAddress?, label? }} [props.deliverFrom] — ресторан
 * @param {{ latitude, longitude, fullAddress?, label? }} [props.deliverTo] — куди їхати
 * @param {{ latitude, longitude, fullAddress? }} [props.courier] — курʼєр (live)
 * @param {string} [props.fallbackAddress] — геокодування, якщо немає координат
 * @param {number} [props.height]
 * @param {boolean} [props.compact]
 */
export default function DeliveryMapWidget({
  deliverFrom,
  deliverTo,
  courier,
  fallbackAddress,
  height = 380,
  compact = false,
  title = "Маршрут доставки",
}) {
  const [resolvedTo, setResolvedTo] = useState(deliverTo ?? null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (deliverTo?.latitude != null && deliverTo?.longitude != null) {
      setResolvedTo(deliverTo);
      return;
    }
    if (!fallbackAddress?.trim()) {
      setResolvedTo(null);
      return;
    }
    let cancelled = false;
    setGeocoding(true);
    geocodeAddress(fallbackAddress).then((pt) => {
      if (cancelled) return;
      setResolvedTo(
        pt
          ? { ...pt, fullAddress: pt.fullAddress || fallbackAddress, label: "Адреса доставки" }
          : null
      );
      setGeocoding(false);
    });
    return () => {
      cancelled = true;
    };
  }, [deliverTo, fallbackAddress]);

  const from = useMemo(() => normalizePoint(deliverFrom, "Ресторан"), [deliverFrom]);
  const to = useMemo(() => normalizePoint(resolvedTo, "Куди їхати"), [resolvedTo]);
  const courierPt = useMemo(() => normalizePoint(courier, "Курʼєр"), [courier]);

  const mapPoints = useMemo(() => {
    const pts = [];
    if (from) pts.push([from.latitude, from.longitude]);
    if (to) pts.push([to.latitude, to.longitude]);
    if (courierPt) pts.push([courierPt.latitude, courierPt.longitude]);
    return pts;
  }, [from, to, courierPt]);

  const routeLine = useMemo(() => {
    if (from && to) {
      return [
        [from.latitude, from.longitude],
        [to.latitude, to.longitude],
      ];
    }
    return null;
  }, [from, to]);

  const center = mapPoints[0] ?? KYIV_CENTER;
  const directionsUrl = googleDirectionsUrl(from, to);

  return (
    <div className={`delivery-map-widget ${compact ? "compact" : ""}`}>
      <div className="dmw-header">
        <h3 className="dmw-title">{title}</h3>
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dmw-directions-btn"
          >
            <Navigation size={16} />
            Як дістатися
          </a>
        )}
      </div>

      <div className="dmw-legend">
        {from && (
          <span className="dmw-legend-item">
            <Store size={14} /> {from.fullAddress || "Ресторан"}
          </span>
        )}
        {to && (
          <span className="dmw-legend-item destination">
            <MapPin size={14} /> {to.fullAddress || "Адреса доставки"}
          </span>
        )}
        {geocoding && <span className="dmw-muted">Пошук адреси на карті…</span>}
        {!geocoding && !to && fallbackAddress && (
          <span className="dmw-muted">Не вдалося показати точку на карті</span>
        )}
      </div>

      <div className="dmw-map" style={{ height }}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={!compact}
          className="dmw-leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFitBounds points={mapPoints} />

          {routeLine && (
            <Polyline positions={routeLine} pathOptions={{ color: "#7c5cff", weight: 4, opacity: 0.75 }} />
          )}

          {from && (
            <Marker position={[from.latitude, from.longitude]} icon={restaurantIcon}>
              <Popup>
                <strong>Ресторан</strong>
                <br />
                {from.fullAddress}
              </Popup>
            </Marker>
          )}

          {to && (
            <Marker position={[to.latitude, to.longitude]} icon={destinationIcon}>
              <Popup>
                <strong>Куди їхати</strong>
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
