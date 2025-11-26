'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RequestDetailModalProps {
  requestId: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt?: any;
  userId?: string;
  requesterName?: string;
  responderName?: string | null;
  status?: string;
  onClose: () => void;
}

export default function RequestDetailModal({
  requestId,
  title,
  description,
  location,
  createdAt,
  requesterName = 'Unknown',
  responderName = null,
  status = 'active',
  onClose,
}: RequestDetailModalProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  const handleAccept = () => {
    setHasAccepted(true);
  };

  const handleAnswerSubmit = () => {
    setIsAccepting(true);
    // Navigate to answer page
    setTimeout(() => {
      router.push(`/requests/${requestId}/answer`);
    }, 500);
  };

  const handleCancel = () => {
    setHasAccepted(false);
  };

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 sticky top-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <div className="space-y-1">
                  <p className="text-blue-100 text-sm">
                    👤 依頼者: {requesterName}
                  </p>
                  <p className="text-blue-100 text-sm">
                    📅 {formatDate(createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">📝 詳しい説明</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">📍 位置情報</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 font-mono">
                  緯度: {location.latitude.toFixed(6)}
                </p>
                <p className="text-gray-700 font-mono">
                  経度: {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Responder Info - Show if answered */}
            {status === 'answered' && responderName && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">✓ 承諾者</h3>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-gray-700 font-semibold">{responderName}</p>
                  <p className="text-sm text-gray-600 mt-1">この人が既にこの依頼に回答しています</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className={`${status === 'answered' ? 'bg-gray-50 border-gray-300' : 'bg-blue-50 border-blue-500'} border-l-4 p-4`}>
              <p className={`${status === 'answered' ? 'text-gray-600' : 'text-blue-800'} text-sm`}>
                {status === 'answered'
                  ? 'ℹ️ この依頼は既に回答されています'
                  : 'ℹ️ この依頼に回答する場合、「この依頼に回答する」ボタンをクリックしてください。'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end sticky bottom-0 border-t border-gray-200">
            {!hasAccepted ? (
              <>
                <button
                  onClick={onClose}
                  disabled={isAccepting}
                  className="px-6 py-2 rounded-lg font-semibold text-gray-800 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                    isAccepting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {isAccepting ? '読み込み中...' : '✓ この依頼を受ける'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isAccepting}
                  className="px-6 py-2 rounded-lg font-semibold text-gray-800 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAnswerSubmit}
                  disabled={isAccepting}
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                    isAccepting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {isAccepting ? '読み込み中...' : '→ 回答画面へ'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
