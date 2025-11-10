import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/health", (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  };

  res.status(200).json(health);
});

export default router;
