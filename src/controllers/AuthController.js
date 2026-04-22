import * as AuthService from "../services/AuthService.js";
import {
  validateSchema,
  userSignupSchema,
  userLoginSchema,
} from "../utils/validation.js";
import { formatResponse, sanitizeUser } from "../utils/helpers.js";
import { ValidationError, generateToken } from "../utils/errors.js";

export async function signup(req, res, next) {
  try {
    const validated = validateSchema(userSignupSchema, req.body);
    const { user, token } = await AuthService.registerUser(
      validated.email,
      validated.password,
      validated.username,
    );

    res.status(201).json(
      formatResponse(true, {
        user: sanitizeUser(user),
        token,
      }),
    );
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const validated = validateSchema(userLoginSchema, req.body);
    const { user, token } = await AuthService.loginUser(
      validated.email,
      validated.password,
    );

    res.json(
      formatResponse(true, {
        user: sanitizeUser(user),
        token,
      }),
    );
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await AuthService.getUserProfile(userId);

    res.json(formatResponse(true, sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { username, profileImageUrl } = req.body;
    const userId = req.user.id;

    if (!username && !profileImageUrl) {
      throw new ValidationError("At least one field is required");
    }

    const user = await AuthService.updateProfile(
      userId,
      username,
      profileImageUrl,
    );

    res.json(formatResponse(true, sanitizeUser(user)));
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await AuthService.getUserProfile(userId);

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    res.json(formatResponse(true, { token }));
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;
    await AuthService.deleteUserAccount(userId);
    res.json(formatResponse(true, { deleted: true }));
  } catch (error) {
    next(error);
  }
}
