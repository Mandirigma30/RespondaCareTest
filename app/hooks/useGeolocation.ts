import { useState, useCallback } from 'react';

export interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
  getLocation: () => void;
}

/**
 * useGeolocation — RespondaCare shared hook
 * Wraps navigator.geolocation.getCurrentPosition
 * Returns { lat, lng, error, loading, getLocation }
 * No PII logged per RA 10173 / blueprint rules.
 */
export function useGeolocation(): GeolocationState {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve location.');
        setLoading(false);
        // Fallback to Barangay 45 Pasay City center coordinates
        setLat(14.5547);
        setLng(121.0244);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );
  }, []);

  return { lat, lng, error, loading, getLocation };
}
