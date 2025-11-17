import express from "express";
import {
  initiateGitHubLogin,
  handleGitHubCallback,
  getCurrentUser,
  logout
} from "../controllers/auth.controller.js";

const router = express.Router();

// Initiate GitHub OAuth flow
router.get("/github", initiateGitHubLogin);

// GitHub OAuth callback
router.get("/github/callback", handleGitHubCallback);

// Get current user
router.get("/me", getCurrentUser);

// Logout
router.post("/logout", logout);

export default router;
