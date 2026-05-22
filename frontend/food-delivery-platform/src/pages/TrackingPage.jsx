import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Truck } from "lucide-react";
import { ROUTES } from "../utils/roleRoutes.js";
import DeliveryMapWidget from "../components/map/DeliveryMapWidget.jsx";
import { DEFAULT_LOCATION_LABEL } from "../constants/region.js";
import { getOrderTracking } from "../api/Tracking.jsx";
import "./styles/TrackingPage.css";

function normalizeLocation(loc) {
  if (!loc) return null;
  return {
    latitude: loc.latitude ?? loc.Latitude,
    longitude: loc.longitude ?? loc.Longitude,
    fullAddress: loc.fullAddress ?? loc.FullAddress,
  };
}

const TrackingPage = () => {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const tracking = await getOrderTracking(orderId);
        setData({
          ...tracking,
          deliverFrom: normalizeLocation(tracking.deliverFrom ?? tracking.DeliverFrom),
          deliverTo: normalizeLocation(tracking.deliverTo ?? tracking.DeliverTo),
          courier: normalizeLocation(tracking.courier ?? tracking.Courier),
        });
      } catch (e) {
        setError("Не вдалося завантажити трекінг замовлення");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fallbackAddress =
    data?.deliverTo?.fullAddress ||
    data?.deliveryAddress ||
    data?.address;

  return (
      <div className="tracking-page customer-page-content">
        <Link to={ROUTES.customer.orders} className="back-link">
          <ArrowLeft size={18} /> До замовлень
        </Link>
        <h1>
          <Truck size={28} /> Відстеження #{orderId?.slice(0, 8)}
        </h1>

        {loading && <p className="muted">Завантаження...</p>}
        {error && <p className="error">{error}</p>}

        {data && (
          <>
            <div className="tracking-status-card">
              <p>
                <strong>Статус:</strong> {data.status ?? "—"}
              </p>
              {data.etaMinutes != null && (
                <p>
                  <Clock size={16} /> Орієнтовно: ~{data.etaMinutes} хв
                </p>
              )}
              {fallbackAddress && (
                <p className="tracking-address-line">
                  <strong>Куди:</strong> {fallbackAddress}
                </p>
              )}
            </div>

            <DeliveryMapWidget
              deliverFrom={data.deliverFrom}
              deliverTo={data.deliverTo}
              courier={data.courier}
              fallbackAddress={fallbackAddress}
              height={420}
              title="Куди їхати"
            />
          </>
        )}

        {!loading && !error && !data?.deliverTo && !fallbackAddress && (
          <DeliveryMapWidget
            fallbackAddress={DEFAULT_LOCATION_LABEL}
            height={320}
            title="Карта"
          />
        )}
      </div>
  );
};

export default TrackingPage;
