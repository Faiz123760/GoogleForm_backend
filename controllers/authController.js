import { registerUser, loginUser, refreshUserToken } from "../services/authService.js";
import { findByIdWithoutPassword } from "../repositories/userRepository.js";

// Cookie options helper for Refresh Tokens
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const { user, accessToken, refreshToken } = await registerUser({ name, email, password });

    res.cookie("refreshToken", refreshToken, getCookieOptions());
    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.message === "User already exists with this email") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const { user, accessToken, refreshToken } = await loginUser({ email, password });

    res.cookie("refreshToken", refreshToken, getCookieOptions());
    return res.status(200).json({
      message: "Logged in successfully",
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.message === "Invalid email or password") {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const tokens = await refreshUserToken(refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, getCookieOptions());
    return res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error) {
    if (error.message === "No refresh token") {
      return res.status(401).json({ message: "Authentication failed: " + error.message });
    }
    if (error.message === "User not found") {
      return res.status(401).json({ message: "Authentication failed: " + error.message });
    }
    if (error.message === "Invalid or expired refresh token") {
      return res.status(403).json({ message: "Authentication failed: " + error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await findByIdWithoutPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
