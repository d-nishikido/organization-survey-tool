# プロジェクト構造

## ルートディレクトリ構成

```
organization-survey-tool/
├── .claude/              # Claude Code設定・カスタムコマンド
│   ├── agents/          # カスタムエージェント定義
│   └── commands/        # スラッシュコマンド
│       └── kiro/        # Kiro spec-driven development
├── .kiro/               # Spec-driven development
│   ├── steering/        # プロジェクトガイド（このディレクトリ）
│   └── specs/           # 機能別仕様書
├── backend/             # バックエンドAPI（Node.js + Fastify）
├── frontend/            # フロントエンド（React + TypeScript）
├── database/            # データベース関連
│   └── init/            # 初期化SQLスクリプト
├── tests/               # E2Eテスト（Playwright）
│   └── e2e/
├── docs/                # プロジェクトドキュメント
├── claudedocs/          # Claude生成ドキュメント・分析結果
├── docker-compose.yml   # Docker環境定義
├── playwright.config.ts # E2Eテスト設定
├── package.json         # ルートパッケージ定義
└── README.md            # プロジェクト概要
```

## バックエンド構造

### ディレクトリ構成
```
backend/
├── src/
│   ├── config/              # 設定管理
│   │   ├── config.ts        # アプリケーション設定
│   │   └── database.ts      # DB接続設定
│   ├── database/            # データベース層
│   │   ├── connection-pool.ts    # コネクションプール管理
│   │   └── transaction-manager.ts # トランザクション管理
│   ├── repositories/        # データアクセス層
│   │   ├── base.repository.ts    # 基底リポジトリ
│   │   ├── interfaces.ts         # リポジトリインターフェース
│   │   ├── question.repository.ts
│   │   └── survey.repository.ts
│   ├── services/            # ビジネスロジック層
│   │   ├── analytics.service.ts  # 分析機能
│   │   ├── operation.service.ts  # 調査運用
│   │   ├── question.service.ts   # 質問管理
│   │   ├── report.service.ts     # レポート生成
│   │   ├── response.service.ts   # 回答処理
│   │   ├── service-container.ts  # DIコンテナ
│   │   ├── session.service.ts    # セッション管理
│   │   ├── survey.service.ts     # 調査管理
│   │   └── template.service.ts   # テンプレート管理
│   ├── routes/              # APIエンドポイント
│   │   ├── analytics.routes.ts   # 分析API
│   │   ├── health.routes.ts      # ヘルスチェック
│   │   ├── operations.routes.ts  # 調査運用API
│   │   ├── questions.routes.ts   # 質問管理API
│   │   ├── responses.routes.ts   # 回答API
│   │   └── surveys.routes.ts     # 調査API
│   ├── middleware/          # ミドルウェア
│   │   ├── anonymity.ts         # 匿名性保証
│   │   ├── errorHandler.ts      # エラーハンドリング
│   │   ├── logging.ts           # ロギング
│   │   └── validation.ts        # リクエスト検証
│   ├── types/               # 型定義
│   │   ├── error.types.ts
│   │   ├── operation.types.ts
│   │   ├── question.types.ts
│   │   ├── reports.ts
│   │   ├── response.types.ts
│   │   └── survey.types.ts
│   ├── utils/               # ユーティリティ
│   │   ├── logger.ts            # ロガー設定
│   │   └── statistics.ts        # 統計計算
│   ├── __tests__/           # テストファイル
│   │   ├── database/
│   │   ├── repositories/
│   │   └── setup.ts             # テストセットアップ
│   └── index.ts             # エントリーポイント
├── jest.config.js           # Jestテスト設定
├── tsconfig.json            # TypeScript設定
├── package.json             # 依存関係定義
└── Dockerfile               # Dockerイメージ定義
```

### 層別責務

#### config/
- アプリケーション設定の一元管理
- 環境変数の読み込みと検証
- データベース接続設定

#### database/
- コネクションプールの管理
- トランザクションの制御
- データベース初期化

#### repositories/
- データアクセスの抽象化
- SQL実行と結果マッピング
- CRUD操作の実装

#### services/
- ビジネスロジックの実装
- トランザクション境界の定義
- リポジトリの組み合わせ使用

#### routes/
- HTTPエンドポイントの定義
- リクエスト/レスポンススキーマ
- Fastifyルーティング設定

#### middleware/
- リクエスト前処理
- 認証・認可（将来実装）
- エラーハンドリング
- ロギング

#### types/
- TypeScript型定義の集約
- ドメインモデル定義
- API契約の型定義

## フロントエンド構造

### ディレクトリ構成
```
frontend/
├── src/
│   ├── api/                 # API通信層
│   │   ├── client.ts            # Axiosクライアント設定
│   │   ├── errorHandler.ts      # APIエラーハンドリング
│   │   ├── types.ts             # API型定義
│   │   └── services/            # APIサービス
│   │       ├── adminService.ts
│   │       ├── analyticsService.ts
│   │       ├── authService.ts
│   │       ├── operationService.ts
│   │       ├── questionService.ts
│   │       ├── surveyQuestionService.ts
│   │       └── surveyService.ts
│   ├── components/          # Reactコンポーネント
│   │   ├── admin/              # 管理者機能
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminNavigation.tsx
│   │   │   ├── ParticipationMonitor.tsx
│   │   │   ├── QuestionBank.tsx
│   │   │   ├── ReminderSettings.tsx
│   │   │   ├── SurveyForm.tsx
│   │   │   ├── SurveyOperationPanel.tsx
│   │   │   └── SurveyPreview.tsx
│   │   ├── analytics/          # 分析・ダッシュボード
│   │   │   ├── AnalyticsCards.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── ChartComponents.tsx
│   │   │   ├── ExportTools.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── TrendAnalysis.tsx
│   │   ├── auth/               # 認証関連
│   │   │   └── ProtectedRoute.tsx
│   │   ├── common/             # 共通コンポーネント
│   │   │   ├── EmployeeLayout.tsx
│   │   │   ├── EmployeeNavigation.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── forms/              # フォーム関連
│   │   │   ├── FormContainer.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── ValidationMessage.tsx
│   │   │   └── questions/          # 質問タイプ別
│   │   │       ├── MultipleChoiceQuestion.tsx
│   │   │       ├── RatingQuestion.tsx
│   │   │       ├── ScaleQuestion.tsx
│   │   │       ├── TextQuestion.tsx
│   │   │       └── YesNoQuestion.tsx
│   │   ├── ui/                 # UIプリミティブ
│   │   │   ├── Alert.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Typography.tsx
│   │   │   └── UserMenu.tsx
│   │   └── SurveyCard.tsx
│   ├── pages/               # ページコンポーネント
│   │   ├── AdminDashboard.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── QuestionManagement.tsx
│   │   ├── SurveyCompletion.tsx
│   │   ├── SurveyDetailPage.tsx
│   │   ├── SurveyListPage.tsx
│   │   ├── SurveyManagement.tsx
│   │   ├── SurveyOperations.tsx
│   │   ├── SurveyPage.tsx
│   │   ├── SurveyQuestionAssignment.tsx
│   │   └── UnauthorizedPage.tsx
│   ├── contexts/            # Reactコンテキスト
│   │   ├── AuthContext.tsx      # 認証状態管理
│   │   └── ThemeContext.tsx     # テーマ管理
│   ├── hooks/               # カスタムフック
│   │   ├── useApiRequest.ts     # API呼び出しフック
│   │   └── useLoading.ts        # ローディング状態管理
│   ├── stores/              # Zustand状態管理
│   │   ├── authStore.ts         # 認証ストア
│   │   └── surveyStore.ts       # 調査ストア
│   ├── styles/              # スタイル定義
│   │   ├── index.css            # グローバルスタイル
│   │   ├── responsive.css       # レスポンシブ対応
│   │   └── tokens.css           # デザイントークン
│   ├── types/               # 型定義
│   │   ├── auth.ts
│   │   ├── operation.ts
│   │   ├── question.ts
│   │   ├── reports.ts
│   │   ├── survey.ts
│   │   └── ui.ts
│   ├── utils/               # ユーティリティ
│   │   └── session.ts           # セッション管理
│   ├── main.tsx             # エントリーポイント
│   ├── App.tsx              # ルートコンポーネント
│   └── test-setup.ts        # テストセットアップ
├── postcss.config.js        # PostCSS設定
├── tailwind.config.js       # Tailwind CSS設定
├── vite.config.ts           # Vite設定
├── tsconfig.json            # TypeScript設定
├── package.json             # 依存関係定義
└── Dockerfile               # Dockerイメージ定義
```

### コンポーネント分類

#### pages/
- ルーティング対象のページ全体
- 複数コンポーネントの組み合わせ
- データ取得とページレベルの状態管理

#### components/admin/
- HR担当者向け管理機能UI
- 調査作成・編集・運用パネル
- 参加状況監視・リマインダー設定

#### components/analytics/
- データ可視化・分析UI
- チャート・グラフコンポーネント
- フィルタリング・エクスポート機能

#### components/forms/
- フォーム関連コンポーネント
- 質問タイプ別入力UI
- バリデーション表示

#### components/common/
- ページレイアウト
- ナビゲーション
- エラーバウンダリ

#### components/ui/
- 再利用可能なUIプリミティブ
- ボタン・カード・モーダルなど
- デザインシステムの基礎

## テスト構造

### E2Eテスト
```
tests/e2e/
├── anonymity-verification.spec.ts    # 匿名性検証
├── auth-debug.spec.ts                # 認証デバッグ
├── error-condition-testing.spec.ts   # エラーハンドリング
├── login-redirect.spec.ts            # ログインフロー
├── question-creation-complete.spec.ts # 質問作成
├── question-management.spec.ts       # 質問管理
├── survey-question-assignment.spec.ts # 質問割り当て
├── survey-response-flow.spec.ts      # 回答フロー
└── smoke.spec.ts                     # スモークテスト
```

### ユニット・統合テスト
- **バックエンド**: `src/**/__tests__/**/*.test.ts`
- **フロントエンド**: `src/**/__tests__/**/*.test.tsx`
- **命名規則**: `[ファイル名].test.ts(x)`

## コード編成パターン

### ファイル命名規則
- **コンポーネント**: PascalCase（例: `SurveyCard.tsx`）
- **サービス**: camelCase + .service.ts（例: `analytics.service.ts`）
- **リポジトリ**: camelCase + .repository.ts（例: `survey.repository.ts`）
- **型定義**: camelCase + .types.ts（例: `survey.types.ts`）
- **テスト**: `[対象].test.ts(x)`（例: `SurveyCard.test.tsx`）
- **設定**: kebab-case（例: `docker-compose.yml`）

### インポート編成

#### バックエンド
```typescript
// 1. 外部ライブラリ
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// 2. 内部モジュール（絶対パス推奨）
import { SurveyService } from '@/services/survey.service';
import { SurveySchema } from '@/types/survey.types';

// 3. 相対パス（同階層のみ）
import { validateRequest } from './middleware/validation';
```

#### フロントエンド
```typescript
// 1. React関連
import React, { useState, useEffect } from 'react';

// 2. 外部ライブラリ
import { useQuery } from 'react-query';
import { useForm } from 'react-hook-form';

// 3. 内部モジュール
import { surveyService } from '@/api/services';
import { SurveyCard } from '@/components';
import { useSurveyStore } from '@/stores';

// 4. 型定義
import type { Survey } from '@/types/survey';

// 5. スタイル（最後）
import './styles.css';
```

## 重要な設計原則

### レイヤードアーキテクチャ（バックエンド）
```
Routes → Services → Repositories → Database
  ↓         ↓            ↓
Middleware  DI      Connection Pool
```

- **責務分離**: 各層は明確な責務を持つ
- **依存方向**: 上位層から下位層への単方向依存
- **テスタビリティ**: 各層を独立してテスト可能

### コンポーネント設計（フロントエンド）
- **Atomic Design原則**: ui → forms → common → pages
- **状態管理分離**: サーバー状態（React Query）とローカル状態（Zustand）
- **プレゼンテーションとロジック分離**: カスタムフックでロジック抽出

### 匿名性保証アーキテクチャ
- **データ分離**: sessions（進捗）とresponses（回答）を完全分離
- **識別子排除**: 個人を特定できる情報を一切含めない
- **セッション管理**: ブラウザLocalStorageによる重複防止のみ

### エラーハンドリング
- **統一エラー型**: error.types.tsで定義
- **中央集約**: errorHandler middleware/errorHandler.ts
- **ユーザーフレンドリー**: 技術詳細を隠蔽し適切なメッセージ表示

### 型安全性
- **厳格なTypeScript設定**: strict mode有効
- **Zodスキーマ**: ランタイムバリデーション
- **型の共有**: フロントエンド・バックエンド間で型定義共有（計画）
