import jwt from "jsonwebtoken";
import logger from "./logger.js";

export const generateToken = (userId, expiresIn = process.env.JWT_EXPIRE) => {
  try {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.error("Error generating token", { error: error.message });
    throw error;
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error("Error verifying token", { error: error.message });
    throw error;
  }
};

export const generateRefreshToken = (userId) => {
  return generateToken(userId, process.env.JWT_REFRESH_EXPIRE);
};
