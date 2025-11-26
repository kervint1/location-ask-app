'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getNearbyRequests, getRequest } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

// Dynamic import to avoid SSR issues
const RequestDetailModal = dynamic(() => import('./RequestDetailModal'), { ssr: false });

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface RequestData {
  id: string;
  title?: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt?: any;
  userId?: string;
  status?: string;
  coordinates?: any;
  updatedAt?: any;
  [key: string]: any;
}

interface MapProps {
  initialCenter?: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function Map({ initialCenter }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { location, error } = useGeolocation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!location || !mapContainer.current) return;

    if (map.current) {
      // If map already exists and we have a new initialCenter, flyTo that location
      if (initialCenter) {
        map.current.flyTo({
          center: [initialCenter.longitude, initialCenter.latitude],
          zoom: 16,
          duration: 1000,
        });
      }
      return;
    }

    try {
      // Use initialCenter if provided, otherwise use current location
      const centerLocation = initialCenter || location;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerLocation.longitude, centerLocation.latitude],
        zoom: initialCenter ? 16 : 14, // Zoom in more if showing specific location
      });

      // Add user location marker
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(new mapboxgl.Popup().setHTML('<div style="color: #000000;">あなたの現在地</div>'))
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Wait for map style to load
      map.current.on('load', () => {
        setMapLoading(false);
      });

      map.current.on('error', () => {
        setMapLoading(false);
      });
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapLoading(false);
    }

    return () => {
      // Cleanup is handled by Next.js, but we keep the map instance
    };
  }, [location, initialCenter]);

  // Fetch and display nearby requests
  useEffect(() => {
    if (!location || mapLoading || !map.current) return;

    const fetchNearbyRequests = async () => {
      try {
        // Fetch all requests (use very large radius)
        const nearby = await getNearbyRequests({ latitude: location.latitude, longitude: location.longitude }, 10000); // ~10000km radius to get all
        setRequests(nearby);

        // Clear existing request markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add markers for each request
        nearby.forEach(request => {
          // 自分の依頼かどうかを判定
          const isOwnRequest = request.userId === user?.uid;
          const markerColor = isOwnRequest ? '#3b82f6' : '#ef4444'; // 青 or 赤

          const el = document.createElement('div');
          el.className = 'w-8 h-8 rounded-full cursor-pointer flex items-center justify-center text-white text-xs font-bold';
          el.textContent = '📍';
          el.style.backgroundImage = 'none';
          el.style.background = markerColor;

          // ホバー時の色も動的に設定
          const hoverColor = isOwnRequest ? '#1e40af' : '#dc2626'; // 濃い青 or 濃い赤
          el.style.cursor = 'pointer';
          el.onmouseover = () => { el.style.background = hoverColor; };
          el.onmouseout = () => { el.style.background = markerColor; };

          const marker = new mapboxgl.Marker(el)
            .setLngLat([request.location.longitude, request.location.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div class="p-3">
                  <h3 class="font-bold text-sm mb-2 text-black">${request.title || '依頼'}</h3>
                  <p class="text-xs text-gray-600 mb-3">${(request.description || '').substring(0, 50)}...</p>
                  <button class="w-full bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-blue-700" id="detail-btn-${request.id}">
                    詳細を見る
                  </button>
                </div>
              `)
            )
            .addTo(map.current!);

          // Add click handler to detail button
          marker.getPopup()?.on('open', () => {
            const detailBtn = document.getElementById(`detail-btn-${request.id}`);
            if (detailBtn) {
              detailBtn.addEventListener('click', async () => {
                // Fetch full request details including requester name
                const fullRequest = await getRequest(request.id);
                if (fullRequest) {
                  setSelectedRequest(fullRequest);
                  setShowModal(true);
                }
              });
            }
          });

          markersRef.current.push(marker);
        });
      } catch (err) {
        console.error('Failed to fetch nearby requests:', err);
      }
    };

    fetchNearbyRequests();
  }, [location, mapLoading]);

  if (error || !location) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600">位置情報を取得できませんでした</p>
          <p className="text-gray-600 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Map container - always render this */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading overlay while map initializes */}
      {mapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center bg-white rounded-lg p-6">
            <p className="text-gray-600">地図を読み込み中...</p>
          </div>
        </div>
      )}
      {requests.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4 max-w-xs">
          <h3 className="font-bold text-sm mb-2">近くの依頼 ({requests.length})</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {requests.map(request => (
              <div key={request.id} className="text-xs border-l-2 border-blue-500 pl-2 py-1">
                <p className="font-semibold text-gray-800">{request.title || '依頼'}</p>
                <p className="text-gray-600">{(request.description || '').substring(0, 40)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {showModal && selectedRequest && (
        <RequestDetailModal
          requestId={selectedRequest.id}
          title={selectedRequest.title || '依頼'}
          description={selectedRequest.description || '説明なし'}
          location={selectedRequest.location}
          createdAt={selectedRequest.createdAt}
          userId={selectedRequest.userId}
          requesterName={selectedRequest.requesterName}
          responderName={selectedRequest.responderName}
          status={selectedRequest.status}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
