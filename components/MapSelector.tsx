'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapSelectorProps {
  initialLocation: {
    latitude: number;
    longitude: number;
  };
  onLocationSelect: (latitude: number, longitude: number) => void;
  placeName: string;
}

export default function MapSelector({ initialLocation, onLocationSelect, placeName }: MapSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!initialLocation || !mapContainer.current) return;

    if (map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLocation.longitude, initialLocation.latitude],
      zoom: 15,
    });

    // Add initial marker
    markerRef.current = new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([initialLocation.longitude, initialLocation.latitude])
      .addTo(map.current);

    setSelectedCoords({
      lat: initialLocation.latitude,
      lng: initialLocation.longitude,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Handle map click to select location
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;

      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }

      // Update selected coordinates
      setSelectedCoords({ lat, lng });
    });

    // Change cursor to pointer on map
    map.current.on('mouseenter', 'place', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'place', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    return () => {
      // Cleanup
    };
  }, [initialLocation]);

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords.lat, selectedCoords.lng);
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Map */}
      <div ref={mapContainer} className="w-full flex-1" />

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 bg-blue-600 bg-opacity-90 text-white shadow-md p-4 z-10">
        <h2 className="text-2xl font-bold">{placeName}</h2>
        <p className="text-sm text-blue-100 mt-1">正確な位置をクリックして選択してください</p>
      </div>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">選択した座標</p>
              {selectedCoords ? (
                <p className="text-lg font-mono font-bold text-gray-800">
                  {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-lg text-gray-400">まだ選択されていません</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Reset to initial location
                  if (map.current && initialLocation) {
                    map.current.flyTo({
                      center: [initialLocation.longitude, initialLocation.latitude],
                      zoom: 15,
                    });
                  }
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition"
              >
                リセット
              </button>

              <button
                onClick={handleConfirm}
                disabled={!selectedCoords}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                  selectedCoords
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                この位置に決定
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-24 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
        <h3 className="font-bold text-gray-800 mb-2">📍 操作方法</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• マップをクリックして位置を選択</li>
          <li>• マーカーが移動します</li>
          <li>• ズーム：マウスホイール</li>
          <li>• ドラッグ：マップを移動</li>
        </ul>
      </div>
    </div>
  );
}
