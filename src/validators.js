// user_id のバリデーション: 6〜20文字、半角英数字のみ
const validateUserId = (userId) => {
  if (!userId) {
    return { valid: false, cause: 'Required user_id and password' };
  }
  if (userId.length < 6 || userId.length > 20) {
    return { valid: false, cause: 'Input length is incorrect' };
  }
  if (!/^[a-zA-Z0-9]+$/.test(userId)) {
    return { valid: false, cause: 'Incorrect character pattern' };
  }
  return { valid: true };
};

// password のバリデーション: 8〜20文字、半角英数字記号（空白と制御コード除く）
const validatePassword = (password) => {
  if (!password) {
    return { valid: false, cause: 'Required user_id and password' };
  }
  if (password.length < 8 || password.length > 20) {
    return { valid: false, cause: 'Input length is incorrect' };
  }
  // ASCII 33-126
  if (!/^[\x21-\x7E]+$/.test(password)) {
    return { valid: false, cause: 'Incorrect character pattern' };
  }
  return { valid: true };
};

// nickname のバリデーション: 30文字以内、制御コード以外
const validateNickname = (nickname) => {
  if (nickname === undefined || nickname === null) {
    return { valid: true }; // 任意項目
  }
  if (nickname.length > 30) {
    return { valid: false, cause: 'String length limit exceeded or containing' };
  }
  // 制御コード (0-31, 127) を含まない
  if (/[\x00-\x1F\x7F]/.test(nickname)) {
    return { valid: false, cause: 'String length limit exceeded or containing' };
  }
  return { valid: true };
};

// comment のバリデーション: 100文字以内、制御コード以外
const validateComment = (comment) => {
  if (comment === undefined || comment === null) {
    return { valid: true }; // 任意項目
  }
  if (comment.length > 100) {
    return { valid: false, cause: 'String length limit exceeded or containing' };
  }
  // 制御コード (0-31, 127) を含まない
  if (/[\x00-\x1F\x7F]/.test(comment)) {
    return { valid: false, cause: 'String length limit exceeded or containing' };
  }
  return { valid: true };
};

module.exports = {
  validateUserId,
  validatePassword,
  validateNickname,
  validateComment
};
