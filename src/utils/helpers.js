import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function sanitizeUser(user) {
  const { password_hash, deleted_at, ...sanitized } = user;
  return sanitized;
}

export function formatResponse(success, data = null, error = null) {
  return {
    success,
    data: success ? data : null,
    error: !success ? error : null,
  };
}
