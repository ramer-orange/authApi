const bcrypt = require('bcrypt');
const { pool } = require('./db');

// HTTP Basic認証ミドルウェア
const basicAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        message: 'Authentication failed'
      });
    }

    // "Basic " を除去してBase64デコード
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [user_id, password] = credentials.split(':');

    if (!user_id || !password) {
      return res.status(401).json({
        message: 'Authentication failed'
      });
    }

    // ユーザー存在確認
    const result = await pool.query(
      'SELECT user_id, password FROM users WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Authentication failed'
      });
    }

    const user = result.rows[0];

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Authentication failed'
      });
    }

    // 認証成功 - user_idをリクエストに追加
    req.authenticatedUserId = user_id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      message: 'Authentication failed'
    });
  }
};

module.exports = { basicAuth };
