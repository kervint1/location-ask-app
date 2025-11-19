import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  GeoPoint,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Haversine公式で2点間の距離を計算（km）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球の半径（km）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==================== ユーザー関連 ====================

// ユーザー情報を作成
export async function createUser(
  userId: string,
  email: string,
  username: string
) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    email,
    username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ユーザー情報を取得
export async function getUser(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
}

// ==================== 依頼関連 ====================

// 依頼を作成
export async function createRequest(
  userId: string,
  data: {
    title: string;
    description: string;
    location: { latitude: number; longitude: number };
  }
) {
  const docRef = await addDoc(collection(db, 'requests'), {
    userId,
    title: data.title,
    description: data.description,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// 周辺の依頼を取得（位置情報検索）
export async function getNearbyRequests(
  center: { latitude: number; longitude: number },
  radiusInKm = 10
): Promise<any[]> {
  try {
    // Firestore から active のリクエストをすべて取得（シンプルなクエリ）
    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    // クライアント側で距離計算してフィルタリング
    const nearby = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const distance = calculateDistance(
          center.latitude,
          center.longitude,
          data.latitude || 0,
          data.longitude || 0
        );

        return {
          id: docSnap.id,
          ...data,
          location: {
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
          },
          distance,
        };
      })
      .filter((item) => item.distance <= radiusInKm)
      .sort((a, b) => a.distance - b.distance);

    return nearby;
  } catch (err) {
    console.error('Failed to fetch nearby requests:', err);
    return [];
  }
}

// 依頼詳細を取得
export async function getRequest(requestId: string) {
  const requestRef = doc(db, 'requests', requestId);
  const requestSnap = await getDoc(requestRef);

  if (requestSnap.exists()) {
    const data = requestSnap.data();

    // ユーザー情報を取得
    let requesterName = 'Unknown';
    try {
      if (data.userId) {
        const userRef = doc(db, 'users', data.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          requesterName = userSnap.data().username || 'Unknown';
        }
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }

    // 回答者情報を取得（status === 'answered' の場合）
    let responderName = null;
    try {
      if (data.status === 'answered') {
        const response = (await getResponseByRequestId(requestId)) as any;
        if (response && response.userId) {
          const responderRef = doc(db, 'users', response.userId);
          const responderSnap = await getDoc(responderRef);
          if (responderSnap.exists()) {
            responderName = responderSnap.data().username || 'Unknown';
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch responder info:', err);
    }

    return {
      id: requestSnap.id,
      ...data,
      requesterName,
      responderName,
      location: {
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      },
    };
  }
  return null;
}

// ユーザーの依頼履歴を取得
export async function getUserRequests(userId: string) {
  const q = query(
    collection(db, 'requests'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      location: {
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
      },
    };
  });

  // クライアント側でソート（最新順）
  return requests.sort((a: any, b: any) => {
    const timeA = a.createdAt?.toDate?.() || new Date(0);
    const timeB = b.createdAt?.toDate?.() || new Date(0);
    return timeB.getTime() - timeA.getTime();
  });
}

// 依頼を削除
export async function deleteRequest(requestId: string) {
  const requestRef = doc(db, 'requests', requestId);
  await deleteDoc(requestRef);
}

// ==================== 回答関連 ====================

// 回答を作成
export async function createResponse(
  requestId: string,
  userId: string,
  data: { comment: string }
) {
  const responseRef = await addDoc(collection(db, 'responses'), {
    requestId,
    userId,
    comment: data.comment,
    createdAt: serverTimestamp(),
    completedAt: null,
  });

  // 依頼のステータスを「回答待ち」に更新
  const requestRef = doc(db, 'requests', requestId);
  await updateDoc(requestRef, {
    status: 'answered',
    updatedAt: serverTimestamp(),
  });

  return responseRef.id;
}

// 依頼のIDから回答を取得
export async function getResponseByRequestId(requestId: string) {
  const q = query(
    collection(db, 'responses'),
    where('requestId', '==', requestId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

// ユーザーの回答履歴を取得
export async function getUserResponses(userId: string) {
  const q = query(
    collection(db, 'responses'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// 依頼を完了にする
export async function completeRequest(requestId: string, responseId: string) {
  const requestRef = doc(db, 'requests', requestId);
  const responseRef = doc(db, 'responses', responseId);

  await updateDoc(requestRef, {
    status: 'completed',
    updatedAt: serverTimestamp(),
  });

  await updateDoc(responseRef, {
    completedAt: serverTimestamp(),
  });
}
