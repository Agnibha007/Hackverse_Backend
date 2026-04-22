import * as UserModel from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/helpers.js";
import { generateToken } from "../utils/errors.js";
import { ConflictError, AuthError, NotFoundError } from "../utils/errors.js";

export async function registerUser(email, password, username) {
  const existingUser = await UserModel.findUserByEmail(email);

  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.createUser(email, passwordHash, username);

  const token = generateToken({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  return { user, token };
}

export async function loginUser(email, password) {
  const user = await UserModel.findUserByEmail(email);

  if (!user) {
    throw new AuthError("Invalid credentials");
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AuthError("Invalid credentials");
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  return { user, token };
}

export async function getUserProfile(userId) {
  const user = await UserModel.findUserById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

export async function updateProfile(userId, username, profileImageUrl) {
  const user = await UserModel.updateUserProfile(userId, {
    username,
    profileImageUrl,
  });

  return user;
}

export async function deleteUserAccount(userId) {
  await UserModel.deleteUser(userId);
}

export async function awardXP(userId, amount) {
  await UserModel.incrementUserXP(userId, amount);
  return await UserModel.findUserById(userId);
}

export async function calculateAndUpdateStreak(userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const formattedDate = sevenDaysAgo.toISOString().split("T")[0];

  const result = await UserModel.findUserById(userId);
  await UserModel.updateFocusStreak(userId, 0);

  return result;
}
