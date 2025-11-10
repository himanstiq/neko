import User from "../models/User.js";
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwt.js";
import logger from "../utils/logger.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info("User registered successfully", { userId: user._id, username });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is inactive" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info("User logged in successfully", {
      userId: user._id,
      username: user.username,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error("Login error", { error: error.message });
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error("Get me error", { error: error.message });
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error", { error: error.message });
    res
      .status(401)
      .json({ message: "Invalid refresh token", error: error.message });
  }
};
