'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRequests, deleteRequest, getResponseByRequestId, getUser } from '@/lib/firestore';

interface Request {
  id: string;
  title?: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status?: string;
  createdAt?: any;
  userId?: string;
  [key: string]: any;
}

interface ReceivedResponse {
  requestId: string;
  requestTitle?: string;
  requestDescription?: string;
  response?: any;
  responderName?: string;
  createdAt?: any;
  requestStatus?: string;
}

type ActiveTab = 'profile' | 'requests' | 'received';

export default function MyPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [requests, setRequests] = useState<Request[]>([]);
  const [receivedResponses, setReceivedResponses] = useState<ReceivedResponse[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load user requests
  useEffect(() => {
    if (!user) return;

    const loadRequests = async () => {
      try {
        setLoadingRequests(true);
        const data = await getUserRequests(user.uid);
        setRequests(data);
      } catch (err) {
        console.error('Failed to load requests:', err);
        setError('依頼を読み込めませんでした');
      } finally {
        setLoadingRequests(false);
      }
    };

    if (activeTab === 'requests') {
      loadRequests();
    }
  }, [user, activeTab]);

  // Load received responses
  useEffect(() => {
    if (!user) return;

    const loadReceivedResponses = async () => {
      try {
        setLoadingResponses(true);
        const userRequests = (await getUserRequests(user.uid)) as (Request & { status: string })[];

        // Filter requests that have responses (status === 'answered')
        const answeredRequests = userRequests.filter(req => req.status === 'answered');

        // Fetch responses for each answered request
        const responses = await Promise.all(
          answeredRequests.map(async (req) => {
            const response = (await getResponseByRequestId(req.id)) as any;

            // Fetch responder name
            let responderName = 'Unknown';
            if (response && response.userId) {
              try {
                const responderUser = (await getUser(response.userId)) as any;
                responderName = responderUser?.username || 'Unknown';
              } catch (err) {
                console.error('Failed to fetch responder info:', err);
              }
            }

            return {
              requestId: req.id,
              requestTitle: req.title,
              requestDescription: req.description,
              response,
              responderName,
              createdAt: req.createdAt,
              requestStatus: req.status,
            };
          })
        );

        setReceivedResponses(responses.filter(r => r.response !== null));
      } catch (err) {
        console.error('Failed to load responses:', err);
        setError('回答を読み込めませんでした');
      } finally {
        setLoadingResponses(false);
      }
    };

    if (activeTab === 'received') {
      loadReceivedResponses();
    }
  }, [user, activeTab]);

  // Handle logout
  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      try {
        await logout();
        router.push('/login');
      } catch (err) {
        console.error('Logout failed:', err);
        setError('ログアウトに失敗しました');
      }
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId: string) => {
    if (confirm('この依頼を削除しますか？')) {
      try {
        setDeletingId(requestId);
        await deleteRequest(requestId);
        setRequests(requests.filter((r) => r.id !== requestId));
      } catch (err) {
        console.error('Failed to delete request:', err);
        setError('依頼の削除に失敗しました');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar Menu */}
      <aside className="w-64 bg-white shadow-lg sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 mb-8 w-full"
          >
            ← ホームに戻る
          </button>

          <h1 className="text-2xl font-bold text-gray-800 mb-8">マイページ</h1>

          {/* Menu Items */}
          <nav className="space-y-2">
            {/* Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-800 hover:bg-gray-100'
              }`}
            >
              📋 基本情報
            </button>

            {/* Requests */}
            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-800 hover:bg-gray-100'
              }`}
            >
              📝 自分の依頼一覧
            </button>

            {/* Received Responses */}
            <button
              onClick={() => setActiveTab('received')}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'received'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-800 hover:bg-gray-100'
              }`}
            >
              💬 受注一覧
            </button>
          </nav>

          {/* Logout Button */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 rounded-lg font-semibold text-red-600 hover:bg-red-50 transition"
            >
              🔚 ログアウト
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <h2 className="text-3xl font-bold">
              {activeTab === 'profile' ? '基本情報' : activeTab === 'requests' ? '自分の依頼一覧' : '受注一覧'}
            </h2>
            <p className="text-blue-100 mt-2">
              {activeTab === 'profile'
                ? 'あなたのプロフィール情報'
                : activeTab === 'requests'
                ? `合計 ${requests.length} 件の依頼`
                : `合計 ${receivedResponses.length} 件の回答`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">✗ {error}</p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
              {/* User Info */}
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{user.displayName || 'ユーザー'}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      📧 メールアドレス
                    </label>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{user.email}</p>
                  </div>

                  {/* User ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      🆔 ユーザーID
                    </label>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg font-mono text-sm break-all">
                      {user.uid}
                    </p>
                  </div>

                  {/* Created At */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      📅 アカウント作成日時
                    </label>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {user.metadata?.creationTime
                        ? new Date(user.metadata.creationTime).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>

                  {/* Last Sign In */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      🕐 最後のログイン
                    </label>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {user.metadata?.lastSignInTime
                        ? new Date(user.metadata.lastSignInTime).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => router.push('/')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    ホームに戻る
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              {loadingRequests ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <p className="text-gray-600 text-lg mb-4">📭 依頼がまだありません</p>
                  <button
                    onClick={() => router.push('/requests/new')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    新しい依頼を作成
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{request.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {request.status === 'active'
                                ? '✓ 募集中'
                                : request.status === 'answered'
                                  ? '✓ 回答あり'
                                  : '✓ 完了'}
                            </span>
                            <span>
                              📅{' '}
                              {new Date(request.createdAt.toDate?.() || request.createdAt).toLocaleDateString(
                                'ja-JP',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          disabled={deletingId === request.id}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition disabled:opacity-50"
                        >
                          {deletingId === request.id ? '削除中...' : '🗑️ 削除'}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 mb-4 line-clamp-3">{request.description}</p>

                      {/* Location */}
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                        <p>
                          📍{' '}
                          <span className="font-mono">
                            {request.location.latitude.toFixed(6)}, {request.location.longitude.toFixed(6)}
                          </span>
                        </p>
                      </div>

                      {/* View Button */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/?lat=${request.location.latitude}&lng=${request.location.longitude}`
                            )
                          }
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          地図で表示
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Received Responses Tab */}
          {activeTab === 'received' && (
            <div>
              {loadingResponses ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : receivedResponses.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <p className="text-gray-600 text-lg mb-4">📭 回答がまだありません</p>
                  <p className="text-gray-500 text-sm mb-6">依頼を作成して、他のユーザーからの回答を待ちましょう</p>
                  <button
                    onClick={() => router.push('/requests/new')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    新しい依頼を作成
                  </button>
                </div>
              ) : (
                <div>
                  {/* In Progress Responses */}
                  {receivedResponses.filter(r => r.requestStatus === 'answered').length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6">🔄 進行中</h3>
                      <div className="grid grid-cols-1 gap-6">
                        {receivedResponses
                          .filter(r => r.requestStatus === 'answered')
                          .map((item) => (
                    <div
                      key={item.requestId}
                      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
                    >
                      {/* Header */}
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">🔔 {item.requestTitle}</h3>
                        <p className="text-sm text-gray-600">
                          📅{' '}
                          {new Date(item.createdAt.toDate?.() || item.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Original Request Info */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 元の依頼</h4>
                        <p className="text-gray-600 text-sm line-clamp-2">{item.requestDescription}</p>
                      </div>

                      {/* Response */}
                      {item.response && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">💬 受け取った回答</h4>
                          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {item.response.comment}
                            </p>
                            <p className="text-xs text-gray-500 mt-3">
                              ✓ 回答者: {item.responderName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              📅{' '}
                              {new Date(item.response.createdAt.toDate?.() || item.response.createdAt).toLocaleDateString(
                                'ja-JP',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* View Button */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/?lat=${item.requestId}`
                            )
                          }
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          元の依頼を表示
                        </button>
                      </div>
                    </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Responses */}
                  {receivedResponses.filter(r => r.requestStatus === 'completed').length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-6">✓ 完了</h3>
                      <div className="grid grid-cols-1 gap-6">
                        {receivedResponses
                          .filter(r => r.requestStatus === 'completed')
                          .map((item) => (
                    <div
                      key={item.requestId}
                      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition opacity-75"
                    >
                      {/* Header */}
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">✓ {item.requestTitle}</h3>
                        <p className="text-sm text-gray-600">
                          📅{' '}
                          {new Date(item.createdAt.toDate?.() || item.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Original Request Info */}
                      <div className="mb-6 pb-6 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 元の依頼</h4>
                        <p className="text-gray-600 text-sm line-clamp-2">{item.requestDescription}</p>
                      </div>

                      {/* Response */}
                      {item.response && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">💬 受け取った回答</h4>
                          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {item.response.comment}
                            </p>
                            <p className="text-xs text-gray-500 mt-3">
                              ✓ 回答者: {item.responderName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              📅{' '}
                              {new Date(item.response.createdAt.toDate?.() || item.response.createdAt).toLocaleDateString(
                                'ja-JP',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                            {item.response.completedAt && (
                              <p className="text-xs text-green-700 mt-2 font-semibold">
                                ✓ 完了:{' '}
                                {new Date(item.response.completedAt.toDate?.() || item.response.completedAt).toLocaleDateString(
                                  'ja-JP',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* View Button */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/?lat=${item.requestId}`
                            )
                          }
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          元の依頼を表示
                        </button>
                      </div>
                    </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
