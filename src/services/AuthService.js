import crypto from "crypto";
import * as UserModel from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/helpers.js";
import { generateToken } from "../utils/errors.js";
import { ConflictError, AuthError, NotFoundError, ValidationError } from "../utils/errors.js";
import { sendOtpEmail } from "../utils/email.js";
import { containsProfanity } from "../utils/profanity.js";
import * as CollectibleModel from "../models/Collectible.js";
import { OAuth2Client } from "google-auth-library";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function registerUser(email, password, username) {
  if (containsProfanity(username)) {
    throw new ValidationError("Username contains inappropriate language");
  }

  const existingUser = await UserModel.findUserByEmail(email);
  if (existingUser && existingUser.google_id) throw new ConflictError("This email is registered with Google. Please use Google Sign-In.");
  if (existingUser && existingUser.email_verified) throw new ConflictError("Email already registered");

  const existingUsername = await UserModel.findUserByUsername(username);
  if (existingUsername) throw new ConflictError("Username already taken");

  const passwordHash = await hashPassword(password);
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  if (existingUser && !existingUser.email_verified) {
    await UserModel.updateOtp(email, otp);
  } else {
    await UserModel.createUserWithVerification(email, passwordHash, username, otp);
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL not configured — auto-verifying user");
    const user = await UserModel.findUserByEmail(email);
    await UserModel.verifyUserEmail(user.id);
    await CollectibleModel.awardCollectible(user.id, 1, "signup");
    const token = generateToken({ id: user.id, email: user.email, username: user.username });
    return { user, token, emailSent: false };
  }

  await sendOtpEmail(email, otp);
  const newUser = await UserModel.findUserByEmail(email);
  if (newUser) await CollectibleModel.awardCollectible(newUser.id, 1, "signup");
  return { emailSent: true };
}

export async function verifyOtp(email, otp) {
  const user = await UserModel.verifyUserWithOtp(email, otp);
  if (!user) throw new ValidationError("Invalid or expired code. Please try again.");
  const token = generateToken({ id: user.id, email: user.email, username: user.username });
  return { user, token };
}

export async function resendOtp(email) {
  const user = await UserModel.findUserByEmail(email);
  if (!user) throw new ValidationError("No account found with this email.");
  if (user.email_verified) throw new ValidationError("Email is already verified.");
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await UserModel.updateOtp(email, otp);
  await sendOtpEmail(email, otp);
}

export async function loginUser(email, password) {
  const user = await UserModel.findUserByEmail(email);
  if (!user) throw new AuthError("Invalid credentials");

  if (!user.password_hash) throw new AuthError("This email is registered with Google. Please use Google Sign-In.");

  const isPasswordValid = await verifyPassword(password, user.password_hash);
  if (!isPasswordValid) throw new AuthError("Invalid credentials");

  if (!user.email_verified) throw new AuthError("Please verify your email before logging in");

  const token = generateToken({ id: user.id, email: user.email, username: user.username });
  return { user, token };
}

export async function googleLogin(idToken, isAccessToken = false) {
  let googleId, email, name, picture;

  if (isAccessToken) {
    // Verify access token by fetching userinfo from Google
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) throw new AuthError("Invalid Google token");
    const profile = await res.json();
    googleId = profile.sub;
    email = profile.email;
    name = profile.name;
    picture = profile.picture;
  } else {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    googleId = payload.sub;
    email = payload.email;
    name = payload.name;
    picture = payload.picture;
  }

  // Generate a clean username from name, ensure uniqueness
  let baseUsername = (name || email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 30);

  if (containsProfanity(baseUsername)) baseUsername = "agent_" + googleId.slice(0, 8);

  // Ensure username uniqueness by appending random suffix if needed
  let username = baseUsername;
  const existing = await UserModel.findUserByEmail(email);
  if (!existing) {
    let attempt = username;
    let suffix = 1;
    while (true) {
      const taken = await UserModel.findUserByUsername(attempt);
      if (!taken) { username = attempt; break; }
      attempt = `${baseUsername}_${suffix++}`;
    }
  }

  const { user, isNew } = await UserModel.findOrCreateGoogleUser(email, googleId, username, picture);
  if (isNew) await CollectibleModel.awardCollectible(user.id, 1, "signup");
  const token = generateToken({ id: user.id, email: user.email, username: user.username });
  // Use onboarding_completed to decide redirect, not just whether row is new
  return { user, token, isNew: !user.onboarding_completed };
}

export async function getUserProfile(userId) {
  const user = await UserModel.findUserById(userId);
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function updateProfile(userId, username, profileImageUrl) {
  if (username && containsProfanity(username)) {
    throw new ValidationError("Username contains inappropriate language");
  }
  return await UserModel.updateUserProfile(userId, { username, profileImageUrl });
}

export async function awardXP(userId, amount) {
  const result = await UserModel.incrementUserXP(userId, amount);
  if (result.leveledUp) {
    const memeId = 4 + Math.min(result.newLevel - 1, 7);
    await CollectibleModel.awardCollectible(userId, memeId, `level_${result.newLevel}`);
  }
  return await UserModel.findUserById(userId);
}
