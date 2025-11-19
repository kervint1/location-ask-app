# 技術スタック提案書 (Webアプリ版)

## 1. 確定した技術構成

### プロトタイプ推奨構成

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| **フロントエンド** | Next.js 14 (App Router) | React、SSR対応、ファイルベースルーティング |
| **UI** | Tailwind CSS | 高速開発、レスポンシブ対応 |
| **認証** | Firebase Authentication | 無料、簡単実装 |
| **データベース** | Cloud Firestore | 無料枠充実、リアルタイム同期 |
| **ストレージ** | Firebase Storage | 無料、画像保存 |
| **地図API** | Mapbox GL JS | 無料枠が大きい（50,000リクエスト/月） |
| **位置情報検索** | Geofirestore | Firestoreの地理空間クエリ |
| **ホスティング** | Vercel | 無料、Next.jsと相性抜群 |
| **サーバーレス** | Cloud Functions (任意) | 自動処理が必要な場合のみ |

### コスト: **完全無料** ($0/月)

---

## 2. アーキテクチャ概要

```
[ユーザー (ブラウザ)]
        ↓
   [Vercel (Next.js)]
        ↓
   [Firebase Services]
   ├── Authentication (認証)
   ├── Firestore (DB)
   └── Storage (画像)
        ↓
   [Mapbox API (地図)]
```

---

## 3. プロジェクト構成

```
location-ask-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.js                 # ルートレイアウト
│   │   ├── page.js                   # トップページ（地図画面）
│   │   ├── login/
│   │   │   └── page.js               # ログイン
│   │   ├── signup/
│   │   │   └── page.js               # サインアップ
│   │   ├── requests/
│   │   │   ├── new/
│   │   │   │   └── page.js           # 依頼作成
│   │   │   └── [id]/
│   │   │       └── page.js           # 依頼詳細
│   │   ├── responses/
│   │   │   └── new/
│   │   │       └── page.js           # 回答作成
│   │   └── mypage/
│   │       └── page.js               # マイページ
│   ├── components/
│   │   ├── Map.jsx                   # Mapbox地図コンポーネント
│   │   ├── RequestCard.jsx           # 依頼カード
│   │   ├── Header.jsx                # ヘッダー
│   │   ├── AuthGuard.jsx             # 認証ガード
│   │   └── ImageUpload.jsx           # 画像アップロード
│   ├── lib/
│   │   ├── firebase.js               # Firebase初期化
│   │   ├── firestore.js              # Firestore操作
│   │   ├── storage.js                # Storage操作
│   │   └── geolocation.js            # 位置情報取得
│   ├── hooks/
│   │   ├── useAuth.js                # 認証フック
│   │   ├── useRequests.js            # 依頼取得フック
│   │   └── useGeolocation.js         # 位置情報フック
│   └── contexts/
│       └── AuthContext.jsx           # 認証コンテキスト
├── public/
│   ├── icons/                        # アイコン
│   └── images/                       # 画像
├── docs/                             # ドキュメント
│   ├── requirements.md
│   ├── tech-stack.md
│   ├── database-design.md
│   └── research-proposal.md
├── firebase.json                     # Firebase設定
├── firestore.rules                   # Firestoreセキュリティルール
├── storage.rules                     # Storageセキュリティルール
├── .env.local                        # 環境変数
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 4. 必要なパッケージ

### package.json

```json
{
  "name": "location-ask-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "firebase": "^10.12.0",
    "geofirestore": "^6.0.0",
    "mapbox-gl": "^3.3.0",
    "react-map-gl": "^7.1.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

---

## 5. Firebase設定

### 環境変数 (.env.local)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Firebase初期化 (src/lib/firebase.js)

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

---

## 6. Firestoreデータ構造

### コレクション構成

```
firestore/
├── users/
│   └── {userId}
│       ├── email: string
│       ├── username: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── requests/
│   └── {requestId}
│       ├── userId: string
│       ├── title: string
│       ├── description: string
│       ├── coordinates: geopoint (Geofirestore用)
│       ├── referenceImageUrl: string | null
│       ├── status: "active" | "answered" | "completed"
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── responses/
    └── {responseId}
        ├── requestId: string
        ├── userId: string
        ├── photoUrl: string
        ├── comment: string
        ├── createdAt: timestamp
        └── completedAt: timestamp | null
```

---

## 7. Firestoreセキュリティルール

### firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 認証済みユーザーのみアクセス可能
    function isAuthenticated() {
      return request.auth != null;
    }

    // 自分のデータかチェック
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // ユーザー
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId);
      allow delete: if false;
    }

    // 依頼
    match /requests/{requestId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
                    && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated()
                    && resource.data.userId == request.auth.uid;
    }

    // 回答
    match /responses/{responseId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
                    && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated();
      allow delete: if false;
    }
  }
}
```

---

## 8. Storageセキュリティルール

### storage.rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // 依頼の参考画像
    match /requests/{userId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // 回答の写真
    match /responses/{userId}/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 9. Mapbox設定

### 地図コンポーネント例 (src/components/Map.jsx)

```javascript
'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map({ requests, onMarkerClick, center, zoom = 13 }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [markers, setMarkers] = useState([]);

  // 地図初期化
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center ? [center.lng, center.lat] : [139.7671, 35.6812],
      zoom: zoom
    });
  }, []);

  // マーカー追加
  useEffect(() => {
    if (!map.current || !requests) return;

    // 既存のマーカーを削除
    markers.forEach(marker => marker.remove());

    // 新しいマーカーを追加
    const newMarkers = requests.map(request => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = getMarkerColor(request.status);
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([request.location.longitude, request.location.latitude])
        .addTo(map.current);

      el.addEventListener('click', () => {
        onMarkerClick && onMarkerClick(request);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [requests]);

  const getMarkerColor = (status) => {
    switch (status) {
      case 'active': return '#3B82F6';    // 青
      case 'answered': return '#FBBF24';  // 黄
      case 'completed': return '#10B981'; // 緑
      default: return '#EF4444';          // 赤
    }
  };

  return <div ref={mapContainer} className="w-full h-full" />;
}
```

---

## 10. 位置情報取得

### src/hooks/useGeolocation.js

```javascript
'use client';

import { useState, useEffect } from 'react';

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
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
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        // デフォルト位置（東京）を設定
        setLocation({
          latitude: 35.6812,
          longitude: 139.7671
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  return { location, error, loading };
}
```

---

## 11. 開発環境セットアップ手順

### 1. プロジェクト作成

```bash
# Next.jsプロジェクト作成
npx create-next-app@latest location-ask-app
cd location-ask-app

# 必要なパッケージをインストール
npm install firebase geofirestore mapbox-gl react-map-gl
```

### 2. Tailwind CSS設定（create-next-appで自動設定済み）

```bash
# 既に設定されている場合はスキップ
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Firebase プロジェクト作成

```bash
# Firebase CLIインストール
npm install -g firebase-tools

# Firebaseログイン
firebase login

# プロジェクト初期化
firebase init

# 選択:
# - Firestore
# - Storage
# - (オプション) Functions
```

### 4. Mapboxアカウント作成

1. https://www.mapbox.com/ でアカウント作成
2. アクセストークンを取得
3. `.env.local` に追加

### 5. 環境変数設定

`.env.local` ファイルを作成し、Firebase と Mapbox の設定を追加

### 6. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

---

## 12. デプロイ手順

### Vercelへのデプロイ

```bash
# Vercel CLIインストール
npm install -g vercel

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

**または**、GitHubにpushして、Vercelダッシュボードから自動デプロイ設定

### 環境変数の設定

Vercelダッシュボードで、`.env.local` の内容をすべて設定

---

## 13. コスト試算

| サービス | プラン | 無料枠 | 月額コスト |
|---------|--------|--------|-----------|
| **Firebase Auth** | Spark | 無制限 | $0 |
| **Cloud Firestore** | Spark | 1GB、50,000読取/日 | $0 |
| **Firebase Storage** | Spark | 5GB、1GB転送/日 | $0 |
| **Mapbox** | 無料 | 50,000リクエスト/月 | $0 |
| **Vercel** | Hobby | 100GB帯域/月 | $0 |

**合計: $0/月**

プロトタイプで50人×30依頼なら、すべて無料枠内で運用可能。

---

## 14. 開発スケジュール

| 週 | タスク |
|----|--------|
| **1週目** | Next.js + Firebase環境構築、認証実装 |
| **2週目** | Mapbox地図表示、位置情報取得、依頼投稿機能 |
| **3週目** | 回答機能、画像アップロード機能 |
| **4週目** | マイページ、UI/UXブラッシュアップ |
| **5週目** | テスト、デバッグ、Vercelデプロイ |

**合計: 5週間**

---

## 15. プロトタイプ実装しない機能

- プッシュ通知
- チャット機能
- ポイント・報酬システム
- 評価・レビュー機能
- PWA対応（将来的に追加可能）
- 詳細な検索・フィルタリング

---

## 16. 将来の拡張

- **PWA化**: オフライン対応、ホーム画面追加
- **プッシュ通知**: Firebase Cloud Messaging
- **ポイントシステム**: インセンティブ追加
- **モバイルアプリ**: React Nativeで展開
- **AI検証**: 回答写真の自動チェック

---

**作成日**: 2025-10-22
**バージョン**: 3.0 (Firebase + Webアプリ版)
**作成者**: Location Ask 開発チーム
