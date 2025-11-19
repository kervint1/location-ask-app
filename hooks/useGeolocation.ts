'use client';

import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報をサポートしていません');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = '位置情報を取得できません。';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'ブラウザの位置情報許可が拒否されています。ブラウザ設定から許可してください。';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = '位置情報サービスが利用できません。';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = '位置情報取得がタイムアウトしました。';
        }
        setError(errorMessage);
        // デフォルト位置（東京）を設定
        setLocation({
          latitude: 35.6812,
          longitude: 139.7671,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  return { location, error, loading };
}
