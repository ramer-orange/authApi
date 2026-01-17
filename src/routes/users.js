const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { validateUserId, validatePassword } = require('../validators');
const { basicAuth } = require('../auth');

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

// GET /users/{user_id} - ユーザー情報取得
router.get('/users/:user_id', basicAuth, async (req, res) => {
  try {
    const { user_id } = req.params;

    // user_id バリデーション
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.valid) {
      return res.status(400).json({
        message: 'Bad Request',
        cause: userIdValidation.cause
      });
    }

    // ユーザー情報取得
    const result = await pool.query(
      'SELECT user_id, nickname, comment FROM users WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'No user found'
      });
    }

    const user = result.rows[0];

    // レスポンス構築（commentがNULLの場合は省略）
    const response = {
      message: 'User details by user_id',
      user: {
        user_id: user.user_id,
        nickname: user.nickname
      }
    };

    // commentが存在する場合のみ追加
    if (user.comment !== null) {
      response.user.comment = user.comment;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// PATCH /users/:user_id - ユーザー情報更新（認証あり）
router.patch('/users/:user_id', basicAuth, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { nickname, comment, user_id: bodyUserId, password } = req.body;

    // user_id バリデーション
    const userIdValidation = validateUserId(user_id);
    if (!userIdValidation.valid) {
      return res.status(400).json({
        message: 'Bad Request',
        cause: userIdValidation.cause
      });
    }

    // 認証ユーザーとパスパラメータの一致確認
    if (req.authenticatedUserId !== user_id) {
      return res.status(403).json({
        message: 'No permission for update'
      });
    }

    // user_id または password の変更を試みた場合
    if (bodyUserId !== undefined || password !== undefined) {
      return res.status(400).json({
        message: 'User updation failed',
        cause: 'Not updatable user_id and password'
      });
    }

    // nickname と comment の両方が未指定の場合
    if (nickname === undefined && comment === undefined) {
      return res.status(400).json({
        message: 'User updation failed',
        cause: 'Required nickname or comment'
      });
    }

    // バリデーション
    const { validateNickname, validateComment } = require('../validators');

    if (nickname !== undefined) {
      const nicknameValidation = validateNickname(nickname);
      if (!nicknameValidation.valid) {
        return res.status(400).json({
          message: 'User updation failed',
          cause: nicknameValidation.cause
        });
      }
    }

    if (comment !== undefined) {
      const commentValidation = validateComment(comment);
      if (!commentValidation.valid) {
        return res.status(400).json({
          message: 'User updation failed',
          cause: commentValidation.cause
        });
      }
    }

    // ユーザー存在確認
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [user_id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        message: 'No user found'
      });
    }

    // 更新処理
    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    let valueIndex = 1;

    if (nickname !== undefined) {
      // 空文字または null の場合は user_id に戻す
      const newNickname = (nickname === '' || nickname === null) ? user_id : nickname;
      updateQuery += `nickname = $${valueIndex}, `;
      updateValues.push(newNickname);
      valueIndex++;
    }

    if (comment !== undefined) {
      // 空文字の場合は NULL にする
      const newComment = comment === '' ? null : comment;
      updateQuery += `comment = $${valueIndex}, `;
      updateValues.push(newComment);
      valueIndex++;
    }

    // 末尾のカンマとスペースを削除
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE user_id = $${valueIndex}`;
    updateValues.push(user_id);

    await pool.query(updateQuery, updateValues);

    // 更新後のユーザー情報を取得
    const result = await pool.query(
      'SELECT user_id, nickname, comment FROM users WHERE user_id = $1',
      [user_id]
    );

    const user = result.rows[0];

    // レスポンス構築
    const response = {
      message: 'User successfully updated',
      user: {
        user_id: user.user_id,
        nickname: user.nickname
      }
    };

    // commentが存在する場合のみ追加
    if (user.comment !== null) {
      response.user.comment = user.comment;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

// POST /close - アカウント削除（認証あり）
router.post('/close', basicAuth, async (req, res) => {
  try {
    const user_id = req.authenticatedUserId;

    // ユーザー削除
    await pool.query(
      'DELETE FROM users WHERE user_id = $1',
      [user_id]
    );

    res.status(200).json({
      message: 'Account and user successfully removed'
    });
  } catch (error) {
    console.error('Close account error:', error);
    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

module.exports = router;
