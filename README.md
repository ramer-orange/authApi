# Account Authentication API

HTTP Basic認証を使用したRESTful APIサーバー

## 実装済みエンドポイント

### POST /signup
ユーザーアカウントを作成します。

**Request:**
```json
{
  "user_id": "TaroYamada",
  "password": "PaSSwd4TY"
}
```

**Success Response (200):**
```json
{
  "message": "Account successfully created",
  "user": {
    "user_id": "TaroYamada",
    "nickname": "TaroYamada"
  }
}
```

## ローカル開発

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# サーバー起動
npm start
```

## デプロイ (Render.com)

1. GitHubリポジトリにプッシュ
2. Render.comで新しいWeb Serviceを作成
3. Build Command: `npm install`
4. Start Command: `npm start`
5. PostgreSQLデータベースを追加し、DATABASE_URL環境変数を設定
