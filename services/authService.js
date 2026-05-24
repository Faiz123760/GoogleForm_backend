import { findByEmail, createUser, findById } from "../repositories/userRepository.js";
import { generateTokens } from "../utils/token.js";
import jwt from "jsonwebtoken";

export const registerUser = async ({ name, email, password }) => {
  // 1. Check if email is already registered
  const userExists = await findByEmail(email);
  if (userExists) {
    throw new Error("User already exists with this email");
  }

  // 2. Create user (password automatically hashed by mongoose pre-save hook)
  const user = await createUser({ name, email, password });

  // 3. Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  return { user, accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  // 1. Check if user exists
  const user = await findByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 2. Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // 3. Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  return { user, accessToken, refreshToken };
};

export const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  // 1. Verify Refresh Token signature
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }

  // 2. Find the user
  const user = await findById(decoded.id);
  if (!user) {
    throw new Error("User not found");
  }

  // 3. Generate new tokens (Rotation strategy)
  return generateTokens(user);
};
