const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { validateUserId, validatePassword } = require('../validators');

const router = express.Router();

// POST /signup - ユーザー作成
router.post('/signup', async (req, res) => {
  try {
    const { user_id, password } = req.body;

    // バリデーション
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.valid) {
      return res.status(400).json({
        message: 'Account creation failed',
        cause: userIdValidation.cause
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: 'Account creation failed',
        cause: passwordValidation.cause
      });
    }

    // 既存ユーザーチェック
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [user_id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: 'Account creation failed',
        cause: 'Already same user_id is used'
      });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成（nickname初期値はuser_idと同じ）
    await pool.query(
      'INSERT INTO users (user_id, password, nickname) VALUES ($1, $2, $3)',
      [user_id, hashedPassword, user_id]
    );

    res.status(200).json({
      message: 'Account successfully created',
      user: {
        user_id: user_id,
        nickname: user_id
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;
