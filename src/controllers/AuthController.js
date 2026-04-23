import * as AuthService from "../services/AuthService.js";
import * as UserModel from "../models/User.js";
import { validateSchema, userSignupSchema, userLoginSchema } from "../utils/validation.js";
import { formatResponse, sanitizeUser } from "../utils/helpers.js";
import { ValidationError, generateToken } from "../utils/errors.js";

export async function signup(req, res, next) {
  try {
    const validated = validateSchema(userSignupSchema, req.body);
    const result = await AuthService.registerUser(validated.email, validated.password, validated.username);
    res.status(201).json(formatResponse(true, {
      user: result.user ? sanitizeUser(result.user) : null,
      token: result.token || null,
      emailSent: result.emailSent ?? true,
      email: validated.email,
    }));
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  res.json(formatResponse(false, null, "Please use the OTP verification method"));
}

export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ValidationError("Email and code are required");
    const { user, token } = await AuthService.verifyOtp(email, otp);
    res.json(formatResponse(true, { user: sanitizeUser(user), token }));
  } catch (error) {
    next(error);
  }
}

export async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError("Email is required");
    await AuthService.resendOtp(email);
    res.json(formatResponse(true, { sent: true }));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const validated = validateSchema(userLoginSchema, req.body);
    const { user, token } = await AuthService.loginUser(validated.email, validated.password);
    res.json(formatResponse(true, { user: sanitizeUser(user), token }));
  } catch (error) {
    next(error);
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { idToken, isAccessToken } = req.body;
    if (!idToken) throw new ValidationError("Google token required");
    const { user, token, isNew } = await AuthService.googleLogin(idToken, isAccessToken || false);
    res.json(formatResponse(true, { user: sanitizeUser(user), token, isNew }));
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = await AuthService.getUserProfile(req.user.id);
    res.json(formatResponse(true, sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { username, profileImageUrl } = req.body;
    if (!username && !profileImageUrl) throw new ValidationError("At least one field is required");
    const user = await AuthService.updateProfile(req.user.id, username, profileImageUrl);
    res.json(formatResponse(true, sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const user = await AuthService.getUserProfile(req.user.id);
    const token = generateToken({ id: user.id, email: user.email, username: user.username });
    res.json(formatResponse(true, { token }));
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { username } = req.body;
    const user = await AuthService.getUserProfile(req.user.id);
    if (username !== user.username) throw new ValidationError("Username does not match");
    await UserModel.softDeleteUser(req.user.id);
    res.json(formatResponse(true, { deleted: true }));
  } catch (error) {
    next(error);
  }
}
export async function getOnboardingStatus(req, res, next) {
  try {
    const status = await UserModel.getUserOnboardingStatus(req.user.id);
    res.json(formatResponse(true, status));
  } catch (error) {
    next(error);
  }
}

export async function updateOnboarding(req, res, next) {
  try {
    const { onboardingCompleted, onboardingStep, callsign, mainGoal } = req.body;
    if (typeof onboardingCompleted !== "boolean" || typeof onboardingStep !== "number") {
      throw new ValidationError("Invalid onboarding data");
    }
    const updated = await UserModel.updateUserOnboarding(req.user.id, onboardingCompleted, onboardingStep, callsign, mainGoal);
    res.json(formatResponse(true, updated));
  } catch (error) {
    next(error);
  }
}
