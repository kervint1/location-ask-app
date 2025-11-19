'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getRequest, createResponse } from '@/lib/firestore';

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
  requesterName?: string;
  responderName?: string | null;
  status?: string;
  [key: string]: any;
}

export default function AnswerPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch request details
  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
      try {
        setLoading(true);
        const data = await getRequest(requestId);
        if (!data) {
          setError('依頼が見つかりません');
          return;
        }
        setRequest(data);
      } catch (err) {
        console.error('Failed to fetch request:', err);
        setError('依頼の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!answer.trim()) {
      setError('回答を入力してください');
      return;
    }

    if (!user) {
      setError('ユーザー情報が取得されていません');
      return;
    }

    setIsSubmitting(true);

    try {
      await createResponse(requestId, user.uid, {
        comment: answer.trim(),
      });

      setSuccess(true);

      // Redirect to home after 1.5 seconds
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Failed to create response:', err);
      setError('回答の送信に失敗しました。もう一度試してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 mb-6"
          >
            ← ホームに戻る
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-red-600 font-semibold text-lg">{error || '依頼が見つかりません'}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: any) => {
    try {
      const d = date.toDate?.() || new Date(date);
      return new Date(d).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 mb-6"
        >
          ← ホームに戻る
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">回答を入力</h1>
          <p className="text-gray-600">この依頼に対してあなたの回答を送信します</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              ✓ 回答を送信しました！ホームに移動します...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">✗ {error}</p>
          </div>
        )}

        {/* Request Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{request.title}</h2>
            <p className="text-sm text-gray-600 mb-4">
              📅 {formatDate(request.createdAt)}
            </p>

            {/* Requester Name */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">👤 依頼者</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 font-semibold">{request.requesterName || 'Unknown'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 依頼の説明</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {request.description}
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📍 場所</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-mono">
                  緯度: {request.location.latitude.toFixed(6)}
                </p>
                <p className="text-sm text-gray-700 font-mono">
                  経度: {request.location.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Responder Info - Show if answered */}
            {request.status === 'answered' && request.responderName && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">✓ 承諾者</h3>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-gray-700 font-semibold">{request.responderName}</p>
                  <p className="text-sm text-gray-600 mt-1">この人が既にこの依頼に回答しています</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className={`${request.status === 'answered' ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'} border-l-4 p-4 rounded`}>
            <p className={`${request.status === 'answered' ? 'text-gray-600' : 'text-blue-800'} text-sm`}>
              {request.status === 'answered'
                ? 'ℹ️ この依頼は既に回答されています'
                : '💬 この依頼に対して回答を入力してください。あなたの回答は依頼者に送信されます。'}
            </p>
          </div>
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Answer Textarea */}
          <div className="mb-6">
            <label htmlFor="answer" className="block text-sm font-semibold text-gray-800 mb-3">
              あなたの回答 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="例: はい、それは在庫があります。明日の営業時間内であればご用意できます。"
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
              disabled={isSubmitting || success}
            />
            <p className="text-gray-500 text-sm mt-2">
              詳細で丁寧な回答をすることで、より良い情報共有ができます
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              disabled={isSubmitting || success}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-gray-800 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition ${
                isSubmitting || success
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              }`}
            >
              {isSubmitting ? '送信中...' : success ? '✓ 完了' : '✓ 回答を送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
