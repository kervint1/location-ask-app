# Location Ask - 位置情報確認アプリ

「今、その場所にいる人」に現地の情報を確認してもらえる、位置情報マッチングWebアプリのプロトタイプです。

## プロジェクト概要

このアプリは、遠隔地の情報を知りたい人と、その場にいる人をマッチングさせるプラットフォームです。ボランティアベースで、リアルタイムな現地情報の共有を促進します。

### 主な機能

- 地図上での依頼投稿・検索
- 写真付きの回答投稿
- 依頼・回答の履歴管理
- ボランティアベースの助け合い

### ユースケース例

- 店舗の営業状況や混雑確認
- 海や公園などの自然環境の状態確認
- 商品の在庫確認
- イベント会場の様子確認

## ドキュメント

プロジェクトの詳細は、以下のドキュメントを参照してください。

### 設計ドキュメント

- [要件定義書](./docs/requirements.md) - アプリの詳細な機能要件
- [技術スタック提案](./docs/tech-stack.md) - 採用技術の選定理由と構成
- [データベース設計](./docs/database-design.md) - DBスキーマとクエリ設計

### 研究関連

- [研究提案書](./docs/research-proposal.md) - 研究テーマとしての位置づけ

## 開発ステータス

**現在**: 設計フェーズ

### 開発予定

1. フェーズ1: 設計 (1週間) ← 現在
2. フェーズ2: Next.js + Firebase環境構築、認証実装 (1週間)
3. フェーズ3: 地図表示、依頼・回答機能実装 (2週間)
4. フェーズ4: UI/UX調整、テスト (1週間)
5. フェーズ5: Vercelデプロイ・検証 (1週間)

**合計: 約6週間**

## 技術スタック

### フロントエンド
- Next.js 14 (App Router)
- Tailwind CSS
- Mapbox GL JS

### バックエンド (Firebase)
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### インフラ
- Vercel (ホスティング)
- 完全無料 ($0/月)

## プロジェクト構成

```
location-ask-app/
├── docs/                          # ドキュメント
│   ├── requirements.md            # 要件定義書
│   ├── tech-stack.md              # 技術スタック提案
│   ├── database-design.md         # データベース設計
│   └── research-proposal.md       # 研究提案書
│
├── src/                           # Next.jsアプリケーション
│   ├── app/                       # App Router (Next.js 14)
│   │   ├── layout.js              # ルートレイアウト
│   │   ├── page.js                # トップページ (地図画面)
│   │   ├── login/                 # ログイン
│   │   │   └── page.js
│   │   ├── signup/                # サインアップ
│   │   │   └── page.js
│   │   ├── requests/              # 依頼関連
│   │   │   ├── new/               # 依頼作成
│   │   │   │   └── page.js
│   │   │   └── [id]/              # 依頼詳細
│   │   │       └── page.js
│   │   ├── responses/             # 回答関連
│   │   │   └── new/               # 回答作成
│   │   │       └── page.js
│   │   └── mypage/                # マイページ
│   │       └── page.js
│   │
│   ├── components/                # 共通コンポーネント
│   │   ├── Map.jsx                # Mapbox地図コンポーネント
│   │   ├── RequestCard.jsx        # 依頼カード
│   │   ├── Header.jsx             # ヘッダー
│   │   ├── AuthGuard.jsx          # 認証ガード
│   │   └── ImageUpload.jsx        # 画像アップロード
│   │
│   ├── lib/                       # ライブラリ・ユーティリティ
│   │   ├── firebase.js            # Firebase初期化
│   │   ├── firestore.js           # Firestore操作
│   │   ├── storage.js             # Storage操作
│   │   └── geolocation.js         # 位置情報取得
│   │
│   ├── hooks/                     # カスタムフック
│   │   ├── useAuth.js             # 認証フック
│   │   ├── useRequests.js         # 依頼取得フック
│   │   └── useGeolocation.js      # 位置情報フック
│   │
│   └── contexts/                  # Reactコンテキスト
│       └── AuthContext.jsx        # 認証コンテキスト
│
├── public/                        # 静的ファイル
│   ├── icons/                     # アイコン
│   └── images/                    # 画像
│
├── firebase.json                  # Firebase設定 (未作成)
├── firestore.rules                # Firestoreセキュリティルール (未作成)
├── storage.rules                  # Storageセキュリティルール (未作成)
├── .env.local                     # 環境変数 (未作成)
├── next.config.js                 # Next.js設定 (未作成)
├── tailwind.config.js             # Tailwind CSS設定 (未作成)
├── package.json                   # パッケージ管理 (未作成)
└── README.md                      # このファイル
```

## 研究目的

このアプリは、大学の研究テーマとしても位置づけられています。

**研究課題**: 「ボランティアベース位置情報マッチングアプリの成立条件: 内発的動機による情報共有の可能性」

詳細は [研究提案書](./docs/research-proposal.md) を参照してください。

## ライセンス

このプロジェクトは教育・研究目的で開発されています。

## 作成者

- 作成日: 2025-10-22
- バージョン: 1.0.0 (設計完了、実装準備中)

## 次のステップ

1. ✅ 技術スタックの確定 (Next.js + Firebase)
2. ⬜ Next.jsプロジェクト作成
3. ⬜ Firebaseプロジェクト作成
4. ⬜ 開発環境のセットアップ
5. ⬜ 認証機能実装開始

---

詳細な情報は `docs/` ディレクトリ内のドキュメントを参照してください。
