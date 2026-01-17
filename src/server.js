const express = require('express');
const { initDB } = require('./db');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());

// ルーティング
app.use('/', usersRouter);

// ヘルスチェック用エンドポイント
app.get('/', (req, res) => {
  res.json({ status: 'API server is running' });
});

// サーバー起動
const startServer = async () => {
  try {
    // データベース初期化
    await initDB();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
