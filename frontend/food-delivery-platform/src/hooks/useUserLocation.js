import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocode } from "../utils/geocode.js";

/**
 * Поточна геопозиція користувача (navigator.geolocation).
 */
export function useUserLocation({ watch = true, enabled = true } = {}) {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      setError("Браузер не підтримує геолокацію");
      return;
    }

    clearWatch();
    setStatus("loading");
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 15000,
    };

    const onSuccess = (geoPos) => {
      const coords = {
        latitude: geoPos.coords.latitude,
        longitude: geoPos.coords.longitude,
        accuracy: geoPos.coords.accuracy,
        label: "Ви",
        fullAddress: "Ваше місцезнаходження",
      };
      setPosition(coords);
      setStatus("ready");
      setError(null);

      reverseGeocode(coords.latitude, coords.longitude).then((label) => {
        if (!label) return;
        setPosition((prev) =>
          prev ? { ...prev, fullAddress: label } : prev
        );
      });
    };

    const onError = (err) => {
      const code = err?.code;
      if (code === 1) {
        setStatus("denied");
        setError("Дозвольте доступ до геолокації в браузері");
      } else if (code === 2) {
        setStatus("unavailable");
        setError("Не вдалося визначити місцезнаходження");
      } else {
        setStatus("unavailable");
        setError("Геолокація недоступна");
      }
    };

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        options
      );
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch, clearWatch]);

  useEffect(() => {
    if (!enabled) return;
    start();
    return clearWatch;
  }, [enabled, start, clearWatch]);

  return {
    position,
    status,
    error,
    retry: start,
    isReady: status === "ready" && position != null,
    isLoading: status === "loading",
  };
}
