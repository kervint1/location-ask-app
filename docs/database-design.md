# データベース設計書 (Cloud Firestore)

## 1. データベース概要

### データベース管理システム
**Cloud Firestore** (Firebase)

### 選定理由
- NoSQLデータベース、スキーマレスで柔軟
- リアルタイムデータ同期
- 位置情報クエリ対応 (Geofirestore使用)
- 完全無料枠が充実 (1GB、50,000読取/日)
- サーバー管理不要
- 自動スケーリング

---

## 2. データ構造図

```
Firestore
├── users (コレクション)
│   └── {userId} (ドキュメント)
│       ├── email: string
│       ├── username: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── requests (コレクション)
│   └── {requestId} (ドキュメント)
│       ├── userId: string
│       ├── title: string
│       ├── description: string
│       ├── coordinates: geopoint
│       ├── referenceImageUrl: string | null
│       ├── status: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── responses (コレクション)
    └── {responseId} (ドキュメント)
        ├── requestId: string
        ├── userId: string
        ├── photoUrl: string
        ├── comment: string
        ├── createdAt: timestamp
        └── completedAt: timestamp | null
```

---

## 3. コレクション定義

### 3.1 users (ユーザー)

ユーザーアカウント情報を管理するコレクション。

#### フィールド

| フィールド名 | 型 | 必須 | デフォルト | 説明 |
|------------|-----|------|-----------|------|
| email | string | ○ | - | メールアドレス |
| username | string | ○ | - | 表示名 |
| createdAt | timestamp | ○ | serverTimestamp() | 作成日時 |
| updatedAt | timestamp | ○ | serverTimestamp() | 更新日時 |

#### インデックス
- なし（ドキュメントIDがuid）

#### サンプルデータ

```javascript
{
  "email": "user@example.com",
  "username": "山田太郎",
  "createdAt": Timestamp(2025, 10, 22, 10, 30, 0),
  "updatedAt": Timestamp(2025, 10, 22, 10, 30, 0)
}
```

#### 作成コード例

```javascript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function createUser(userId, email, username) {
  await setDoc(doc(db, 'users', userId), {
    email,
    username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
```

---

### 3.2 requests (依頼)

ユーザーが投稿した依頼情報を管理するコレクション。

#### フィールド

| フィールド名 | 型 | 必須 | デフォルト | 説明 |
|------------|-----|------|-----------|------|
| userId | string | ○ | - | 依頼者のユーザーID |
| title | string | ○ | - | 依頼のタイトル (50文字以内) |
| description | string | ○ | - | 依頼の説明 (500文字以内) |
| coordinates | geopoint | ○ | - | 依頼場所の座標 (Geofirestore用) |
| referenceImageUrl | string | × | null | 参考画像のURL |
| status | string | ○ | "active" | ステータス |
| createdAt | timestamp | ○ | serverTimestamp() | 作成日時 |
| updatedAt | timestamp | ○ | serverTimestamp() | 更新日時 |

#### ステータス値
- `active`: 募集中
- `answered`: 回答待ち
- `completed`: 完了

#### 複合インデックス（Firestore Consoleで作成）

| フィールド | 方向 |
|-----------|------|
| coordinates | - |
| status | ASC |

#### サンプルデータ

```javascript
{
  "userId": "abc123",
  "title": "渋谷駅前の混雑状況",
  "description": "今の渋谷駅前ハチ公口の混雑状況を教えてください",
  "coordinates": new GeoPoint(35.6581, 139.7016),
  "referenceImageUrl": "https://storage.googleapis.com/.../image.jpg",
  "status": "active",
  "createdAt": Timestamp(2025, 10, 22, 11, 0, 0),
  "updatedAt": Timestamp(2025, 10, 22, 11, 0, 0)
}
```

#### 作成コード例

```javascript
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as geofirestore from 'geofirestore';

const GeoFirestore = geofirestore.initializeApp(db);

async function createRequest(userId, data) {
  const geoCollection = GeoFirestore.collection('requests');

  const docRef = await geoCollection.add({
    userId,
    title: data.title,
    description: data.description,
    coordinates: new GeoPoint(data.location.latitude, data.location.longitude),
    referenceImageUrl: data.referenceImageUrl || null,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}
```

---

### 3.3 responses (回答)

依頼に対する回答情報を管理するコレクション。

#### フィールド

| フィールド名 | 型 | 必須 | デフォルト | 説明 |
|------------|-----|------|-----------|------|
| requestId | string | ○ | - | 依頼ID |
| userId | string | ○ | - | 回答者のユーザーID |
| photoUrl | string | ○ | - | 回答写真のURL |
| comment | string | ○ | - | コメント (500文字以内) |
| createdAt | timestamp | ○ | serverTimestamp() | 回答日時 |
| completedAt | timestamp | × | null | 完了日時 |

#### 複合インデックス

| フィールド | 方向 |
|-----------|------|
| requestId | ASC |
| createdAt | DESC |

| フィールド | 方向 |
|-----------|------|
| userId | ASC |
| createdAt | DESC |

#### サンプルデータ

```javascript
{
  "requestId": "req123",
  "userId": "user456",
  "photoUrl": "https://storage.googleapis.com/.../photo.jpg",
  "comment": "現在の混雑状況です。比較的空いています。",
  "createdAt": Timestamp(2025, 10, 22, 11, 30, 0),
  "completedAt": null
}
```

#### 作成コード例

```javascript
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function createResponse(requestId, userId, data) {
  // 回答を作成
  const docRef = await addDoc(collection(db, 'responses'), {
    requestId,
    userId,
    photoUrl: data.photoUrl,
    comment: data.comment,
    createdAt: serverTimestamp(),
    completedAt: null
  });

  // 依頼のステータスを更新
  await updateDoc(doc(db, 'requests', requestId), {
    status: 'answered',
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}
```

---

## 4. 位置情報検索

### Geofirestore を使用した周辺検索

```javascript
import * as geofirestore from 'geofirestore';
import { GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GeoFirestore = geofirestore.initializeApp(db);

async function getNearbyRequests(center, radiusInKm = 5) {
  const geoCollection = GeoFirestore.collection('requests');

  const query = geoCollection
    .near({
      center: new GeoPoint(center.latitude, center.longitude),
      radius: radiusInKm
    })
    .where('status', 'in', ['active', 'answered']);

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    location: {
      latitude: doc.data().coordinates.latitude,
      longitude: doc.data().coordinates.longitude
    }
  }));
}
```

---

## 5. クエリ例

### 5.1 特定ユーザーの依頼履歴を取得

```javascript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getUserRequests(userId) {
  const q = query(
    collection(db, 'requests'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 5.2 特定ユーザーの回答履歴を取得

```javascript
async function getUserResponses(userId) {
  const q = query(
    collection(db, 'responses'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 5.3 特定依頼の回答を取得

```javascript
async function getResponseByRequestId(requestId) {
  const q = query(
    collection(db, 'responses'),
    where('requestId', '==', requestId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}
```

---

## 6. Firestoreセキュリティルール

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
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.title.size() <= 50
                    && request.resource.data.description.size() <= 500;
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated()
                    && resource.data.userId == request.auth.uid;
    }

    // 回答
    match /responses/{responseId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.comment.size() <= 500;
      allow update: if isAuthenticated();
      allow delete: if false;
    }
  }
}
```

---

## 7. Storageセキュリティルール

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

## 8. データ整合性の管理

### 8.1 依頼削除時の処理

依頼を削除する際は、関連する回答も削除する。

```javascript
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function deleteRequest(requestId) {
  // 関連する回答を削除
  const q = query(collection(db, 'responses'), where('requestId', '==', requestId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  // 依頼を削除
  await deleteDoc(doc(db, 'requests', requestId));
}
```

### 8.2 依頼完了時の処理

```javascript
async function completeRequest(requestId, responseId) {
  const batch = writeBatch(db);

  // 依頼のステータスを完了に
  batch.update(doc(db, 'requests', requestId), {
    status: 'completed',
    updatedAt: serverTimestamp()
  });

  // 回答を完了に
  batch.update(doc(db, 'responses', responseId), {
    completedAt: serverTimestamp()
  });

  await batch.commit();
}
```

---

## 9. データバックアップ

### 9.1 Firebaseコンソールからのエクスポート

Firebase Console > Firestore Database > Import/Export からデータをエクスポート可能。

### 9.2 自動バックアップ（有料プランのみ）

Blaze プランにアップグレードすると、Cloud Scheduler を使用した自動バックアップが可能。

---

## 10. パフォーマンス最適化

### 10.1 インデックスの作成

Firestore Consoleで、以下の複合インデックスを作成:

1. **requests** コレクション
   - coordinates (Geohash) + status (ASC)

2. **responses** コレクション
   - requestId (ASC) + createdAt (DESC)
   - userId (ASC) + createdAt (DESC)

### 10.2 キャッシュ戦略

```javascript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// オフラインキャッシュを有効化
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // 複数タブで開いている場合
      console.warn('Persistence failed');
    } else if (err.code === 'unimplemented') {
      // ブラウザが未対応
      console.warn('Persistence not available');
    }
  });
```

---

## 11. 容量見積もり

### プロトタイプ（50人、30依頼）

| コレクション | ドキュメント数 | 平均サイズ | 合計 |
|------------|--------------|-----------|------|
| users | 50 | 0.5KB | 25KB |
| requests | 30 | 1KB | 30KB |
| responses | 30 | 1KB | 30KB |
| **合計** | - | - | **85KB** |

**無料枠**: 1GB（十分余裕あり）

---

## 12. スケーリング計画

### 12.1 ユーザー数増加時

- 1,000ユーザー、1,000依頼でも約3MB
- Firestoreの無料枠（1GB）で十分対応可能

### 12.2 読み取り回数の最適化

- リアルタイムリスナーの使用を最小限に
- 必要な時のみgetDocsを使用
- キャッシュを活用

---

**作成日**: 2025-10-22
**バージョン**: 2.0 (Cloud Firestore版)
**作成者**: Location Ask 開発チーム
