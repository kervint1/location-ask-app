'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Map component to avoid SSR issues with mapbox-gl
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialLocation, setInitialLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get location from query parameters
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (lat && lng) {
      setInitialLocation({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-screen h-screen">
      {/* Map (full screen) */}
      <Map initialCenter={initialLocation} />

      {/* Floating Header Overlay */}
      <header className="absolute top-0 left-0 right-0 bg-blue-600 bg-opacity-90 text-white shadow-md z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Location Ask</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/requests/new')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              依頼を作成
            </button>
            <button
              onClick={() => router.push('/mypage')}
              className="bg-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
            >
              マイページ
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
