'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { createRequest } from '@/lib/firestore';

interface SearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Map component を動的インポート（SSR回避）
const MapSelector = dynamic(() => import('@/components/MapSelector'), { ssr: false });

export default function CreateRequestPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { location, loading: geoLoading } = useGeolocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Handle search with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults([]);

    if (!query.trim()) {
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);

    // Debounce search API call (500ms)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!mapboxToken) {
          setError('Mapbox トークンが設定されていません');
          setIsSearching(false);
          return;
        }

        // Use Mapbox Geocoding API
        const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/');
        url.pathname += `${encodeURIComponent(query)}.json`;
        url.searchParams.append('access_token', mapboxToken);
        url.searchParams.append('country', 'JP'); // 日本のみに絞る
        url.searchParams.append('limit', '10');

        // バイアス設定：ユーザーの現在地を中心に検索
        if (location) {
          url.searchParams.append('proximity', `${location.longitude},${location.latitude}`);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('検索に失敗しました');
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const results = data.features.map((feature: any, index: number) => ({
            id: `${feature.id}-${index}`,
            name: feature.text || feature.place_name,
            address: feature.place_name,
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
          }));
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('検索中にエラーが発生しました');
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // Handle location selection from search
  const handleSelectSearchLocation = (location: SearchResult) => {
    setSelectedLocation(location);
    setSearchResults([]);
    setShowMap(true);
  };

  // Handle location selection from map click
  const handleMapLocationSelect = (latitude: number, longitude: number) => {
    setSelectedLocation({
      id: `custom-${Date.now()}`,
      name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      address: `座標: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      latitude,
      longitude,
    });
    setShowMap(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    if (!description.trim()) {
      setError('説明を入力してください');
      return;
    }

    if (!selectedLocation) {
      setError('場所を選択してください');
      return;
    }

    if (!user) {
      setError('ユーザー情報が取得されていません');
      return;
    }

    setIsSubmitting(true);

    try {
      await createRequest(user.uid, {
        title: title.trim(),
        description: description.trim(),
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
      });

      setSuccess(true);

      // Redirect to home after 1 second
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      console.error('Failed to create request:', err);
      setError('依頼の作成に失敗しました。もう一度試してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || geoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Map selection view
  if (showMap && selectedLocation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MapSelector
          initialLocation={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }}
          onLocationSelect={handleMapLocationSelect}
          placeName={selectedLocation.name}
        />
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 mb-4"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">新しい依頼を作成</h1>
          <p className="text-gray-600">場所を検索→地図で選択→依頼を作成</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✓ 依頼を作成しました！ホームに移動します...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">✗ {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Info Card */}
            {selectedLocation && (
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h3 className="font-semibold text-gray-800 mb-2">✓ 場所が選択されました</h3>
                <p className="text-lg font-bold text-green-700">{selectedLocation.name}</p>
                <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                <p className="text-xs text-gray-500 mt-2">
                  座標: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setShowMap(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                  >
                    📍 地図で再選択
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setSearchQuery('');
                    }}
                    className="text-orange-600 hover:text-orange-800 text-sm font-semibold"
                  >
                    別の場所を検索
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: プリンは売っていますか？"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={isSubmitting}
                />
                <p className="text-gray-500 text-sm mt-1">何について知りたいのかを簡潔に</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
                  詳しい説明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例: 特製プリン（自社製？それともデザート会社製？）が在庫で売っているか確認したいです。今週末に訪問予定なので、できれば今日か明日に情報をください。"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                  disabled={isSubmitting}
                />
                <p className="text-gray-500 text-sm mt-1">詳細な説明で、より良い回答が得られます</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedLocation}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                  isSubmitting || !selectedLocation
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {isSubmitting ? '作成中...' : '依頼を作成'}
              </button>
            </form>
          </div>

          {/* Right Side - Search */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 場所を検索</h3>

              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="駅名や住所を入力..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Search Status */}
              {isSearching && (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm">検索中...</p>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectSearchLocation(result)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                      <p className="font-semibold text-gray-800 text-sm">{result.name}</p>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{result.address}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">検索結果がありません</p>
                </div>
              )}

              {/* Tips */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">💡 使い方</h4>
                <ol className="space-y-1 text-gray-600 text-xs list-decimal pl-4">
                  <li>駅名や住所を検索</li>
                  <li>検索結果をクリック</li>
                  <li>地図にジャンプ</li>
                  <li>正確な位置をクリック</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
