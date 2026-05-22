import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ArrowLeft, Clock, Truck } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CustomerSidebar from "../components/customer-components/CustomerSidebar.jsx";
import { getOrderTracking } from "../api/Tracking.jsx";
import "./styles/TrackingPage.css";

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const TrackingPage = () => {
    const { orderId } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const tracking = await getOrderTracking(orderId);
                setData(tracking);
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

    const center = data?.deliverTo
        ? [data.deliverTo.latitude, data.deliverTo.longitude]
        : [50.4501, 30.5234];

    return (
        <div className="app-wrapper">
            <CustomerSidebar />
            <div className="tracking-page">
                <Link to="/customer/orders" className="back-link">
                    <ArrowLeft size={18} /> До замовлень
                </Link>
                <h1><Truck size={28} /> Відстеження #{orderId?.slice(0, 8)}</h1>

                {loading && <p className="muted">Завантаження...</p>}
                {error && <p className="error">{error}</p>}

                {data && (
                    <>
                        <div className="tracking-status-card">
                            <p><strong>Статус:</strong> {data.status}</p>
                            {data.etaMinutes != null && (
                                <p><Clock size={16} /> Орієнтовно: ~{data.etaMinutes} хв</p>
                            )}
                        </div>
                        <div className="tracking-map">
                            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {data.deliverFrom && (
                                    <Marker position={[data.deliverFrom.latitude, data.deliverFrom.longitude]}>
                                        <Popup>Ресторан</Popup>
                                    </Marker>
                                )}
                                {data.deliverTo && (
                                    <Marker position={[data.deliverTo.latitude, data.deliverTo.longitude]}>
                                        <Popup>Адреса доставки</Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TrackingPage;
