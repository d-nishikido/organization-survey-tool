# 組織改善ツール（Organization Survey Tool）

従業員のエンゲージメント向上を目的とした組織改善ツールです。

## 📋 概要

- **対象**: 1000人規模の組織
- **認証**: Microsoft365 SSO（初期開発では認証機能なし）
- **匿名性**: 完全匿名回答を重視
- **機能**: アンケート・サーベイ機能、ダッシュボード・分析機能

## 🛠 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Fastify + TypeScript
- **データベース**: PostgreSQL
- **開発環境**: Docker + Docker Compose
- **デプロイ**: オンプレミス
- **開発フレームワーク**: SuperClaude
- **MCP**: Serena + Playwright
- **E2Eテスト**: Playwright

## 🚀 クイックスタート

### 1. 環境準備
```bash
# リポジトリのクローン
git clone <repository-url>
cd organization-survey-tool

# 環境変数の設定
cp .env.example .env
```

### 2. Docker環境での起動
```bash
# コンテナのビルドと起動
docker compose up --build

# バックグラウンドで実行する場合
docker compose up -d --build
```

### 3. アクセス確認
- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:3001
- **API ドキュメント**: http://localhost:3001/documentation

## 📁 プロジェクト構成

```
organization-survey-tool/
├── docs/              # ドキュメント
├── backend/           # バックエンドAPI
├── frontend/          # フロントエンドアプリ
├── database/          # データベース関連
│   └── init/          # 初期化スクリプト
├── docker-compose.yml # Docker設定
└── .env.example       # 環境変数テンプレート
```

## 👥 ユーザー役割

### 一般従業員
- 調査一覧の確認
- アンケート回答
- 回答完了確認

### HR・人事担当者
- 調査の作成・編集
- 結果分析ダッシュボード
- レポート出力

### システム管理者
- システム設定管理
- ユーザー管理（将来実装）

## 🔒 プライバシー・匿名性

- **完全匿名**: 回答データに個人識別情報は含まれません
- **重複防止**: ブラウザのLocalStorageでセッション管理
- **データ分離**: 進捗管理と回答内容は別テーブルで管理

## 📊 分析機能

調査結果は以下のカテゴリで分析可能：
- A. 仕事について
- B. 最近の状態について  
- C. 周りの方々について
- D. 満足度について
- E. お仕事について
- F. 職場について
- G. 会社や組織について

## 🚧 開発ステータス

- [x] 基盤設計・Docker環境
- [ ] バックエンドAPI実装
- [ ] フロントエンド実装
- [ ] ダッシュボード機能
- [ ] Microsoft365 SSO連携

## 📚 ドキュメント

詳細なドキュメントは`docs/`フォルダを参照してください：

- [API仕様書](docs/api-specification.md)
- [データベース設計書](docs/database-design.md)
- [開発ガイド](docs/development-guide.md)
- [SuperClaude+MCP開発ガイド](docs/superClaude-mcp-guide.md)
- [デプロイガイド](docs/deployment-guide.md)

## 🤝 コントリビューション

1. フィーチャーブランチの作成
2. 変更の実装
3. テストの実行
4. プルリクエストの作成

## 📄 ライセンス

Private Project - All rights reserved.