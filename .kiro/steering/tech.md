# 技術スタック

## アーキテクチャ概要

### システム構成
3層アーキテクチャ（フロントエンド・バックエンド・データベース）を採用したモノリポジトリ構成。Docker Composeによるコンテナオーケストレーションで開発環境を統一。

```
┌─────────────────┐
│   Frontend      │ React + TypeScript + Vite
│   (Port: 5173)  │
└────────┬────────┘
         │ HTTP/REST
┌────────▼────────┐
│   Backend       │ Node.js + Fastify + TypeScript
│   (Port: 3001)  │
└────────┬────────┘
         │ PostgreSQL Driver
┌────────▼────────┐
│   Database      │ PostgreSQL 15
│   (Port: 5432)  │
└─────────────────┘
```

## フロントエンド

### コア技術
- **フレームワーク**: React 18.2.0
- **言語**: TypeScript 5.3.3
- **ビルドツール**: Vite 5.0.10
- **ルーティング**: React Router DOM 6.20.1

### 状態管理
- **グローバル状態**: Zustand 5.0.8
- **サーバー状態**: React Query 3.39.3
- **フォーム管理**: React Hook Form 7.48.2

### UIライブラリとスタイリング
- **CSSフレームワーク**: Tailwind CSS 3.4.0
- **チャート**: Recharts 2.10.3
- **ユーティリティ**: clsx, date-fns

### バリデーション
- **スキーマ検証**: Zod 3.22.4
- **フォーム連携**: @hookform/resolvers 3.3.2

### テスティング
- **テストランナー**: Vitest 1.1.0
- **テスティングライブラリ**: @testing-library/react 14.1.2
- **DOM環境**: happy-dom 12.10.3

## バックエンド

### コア技術
- **フレームワーク**: Fastify 4.25.2
- **言語**: TypeScript 5.3.3
- **ランタイム**: Node.js >=20.0.0
- **プロセス管理**: tsx 4.7.0（開発）

### セキュリティ・ミドルウェア
- **CORS**: @fastify/cors 8.5.0
- **セキュリティヘッダー**: @fastify/helmet 11.1.1
- **レート制限**: @fastify/rate-limit 9.1.0

### API ドキュメント
- **Swagger**: @fastify/swagger 8.12.2
- **Swagger UI**: @fastify/swagger-ui 2.0.1
- **アクセス**: http://localhost:3001/documentation

### データベース接続
- **PostgreSQLクライアント**: pg 8.11.3
- **接続プール管理**: カスタム実装（connection-pool.ts）
- **トランザクション管理**: カスタム実装（transaction-manager.ts）

### バリデーション・ロギング
- **スキーマ検証**: Zod 3.22.4
- **ロガー**: Pino 8.17.2 + Pino Pretty 10.3.1
- **UUID生成**: uuid 9.0.1

### テスティング
- **テストランナー**: Jest 29.7.0
- **TypeScript連携**: ts-jest 29.1.1

## データベース

### RDBMS
- **システム**: PostgreSQL 15（Alpine Linux）
- **コンテナ**: postgres:15-alpine
- **初期化**: /docker-entrypoint-initdb.d による自動スキーマ構築

### データベース設計
- **surveys**: 調査マスタ
- **questions**: 質問バンク
- **survey_questions**: 調査と質問の関連
- **responses**: 匿名回答データ
- **sessions**: 回答セッション管理（重複防止）

## 開発環境

### 必須ツール
- **Node.js**: 20.0.0以上
- **Docker**: 最新版
- **Docker Compose**: V2推奨
- **Git**: バージョン管理

### エディタ・拡張機能推奨
- **エディタ**: VS Code / Cursor
- **TypeScript**: 公式拡張機能
- **ESLint**: eslint-plugin-prettier, eslint-config-prettier
- **Prettier**: コードフォーマッタ

### 開発フレームワーク
- **SuperClaude**: Claude Code拡張フレームワーク
- **MCP統合**: Serena（コード理解）、Playwright（E2Eテスト）

## よく使うコマンド

### プロジェクト全体
```bash
# Docker環境起動
docker compose up --build

# バックグラウンド起動
docker compose up -d --build

# 停止
docker compose down

# E2Eテスト実行
npm run test:e2e
```

### バックエンド
```bash
cd backend

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番起動
npm start

# テスト
npm test
npm run test:watch
npm run test:coverage

# コード品質
npm run lint
npm run lint:fix
npm run format
npm run type-check
```

### フロントエンド
```bash
cd frontend

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# テスト
npm test
npm run test:ui
npm run test:coverage

# コード品質
npm run lint
npm run lint:fix
npm run format
npm run type-check
```

## 環境変数

### バックエンド (.env)
```bash
# サーバー設定
NODE_ENV=development
PORT=3001

# データベース接続
DATABASE_URL=postgresql://survey_user:survey_password@localhost:5432/organization_survey

# ロギング
LOG_LEVEL=info
```

### フロントエンド (.env)
```bash
# API接続
VITE_API_URL=http://localhost:3001

# 環境
NODE_ENV=development
DOCKERIZED=true
```

### データベース (docker-compose.yml)
```bash
POSTGRES_DB=organization_survey
POSTGRES_USER=survey_user
POSTGRES_PASSWORD=survey_password
```

## ポート構成

| サービス | ポート | 用途 |
|---------|--------|------|
| フロントエンド | 5173 | Vite開発サーバー |
| バックエンド | 3001 | Fastify APIサーバー |
| PostgreSQL | 5432 | データベース接続 |
| Swagger UI | 3001/documentation | API仕様書 |

## コード品質ツール

### Linter
- **ESLint**: TypeScript/React対応設定
- **構成**: @typescript-eslint/parser + recommended rules
- **Prettier統合**: eslint-config-prettier

### Formatter
- **Prettier**: コード自動整形
- **対象**: TypeScript, TSX, JSON, CSS

### 型チェック
- **TypeScript Compiler**: tsc --noEmit
- **厳格モード**: 型安全性を最大化

### テストカバレッジ
- **バックエンド**: Jest coverage reporter
- **フロントエンド**: Vitest coverage (c8)
- **E2E**: Playwright test results

## デプロイメント

### ターゲット環境
- **方式**: オンプレミスデプロイ
- **コンテナ化**: Docker / Docker Compose
- **プロキシ**: Nginx（推奨）
- **SSL/TLS**: Let's Encrypt / 企業証明書

### CI/CD（計画）
- **GitHub Actions**: 自動テスト・ビルド
- **品質ゲート**: Lint・Type-check・Test必須
- **デプロイ戦略**: Blue-Green / Rolling update

## セキュリティ考慮事項

### 実装済み
- **CORS制限**: オリジン検証
- **Helmet**: セキュリティヘッダー設定
- **Rate Limiting**: API呼び出し制限
- **入力検証**: Zodによる厳格なバリデーション
- **SQLインジェクション対策**: パラメータ化クエリ

### 計画中
- **CSP**: Content Security Policy強化
- **認証**: Microsoft 365 SSO
- **監査ログ**: 操作履歴の記録
- **暗号化**: 機密データの暗号化保存
