import { Router } from "express";
import {
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  updatePasswordHandler,
  getProfileHandler,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import {
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdatePassword,
} from "../middleware/validation";

const router = Router();

// POST /api/auth/login - Login user
router.post("/login", validateLogin, loginHandler);

// POST /api/auth/forgot-password - Send password reset link
router.post("/forgot-password", validateForgotPassword, forgotPasswordHandler);

// POST /api/auth/reset-password - Reset password with token
router.post("/reset-password", validateResetPassword, resetPasswordHandler);

// POST /api/auth/update-password - Update password (requires authentication)
router.post(
  "/update-password",
  authenticateToken,
  validateUpdatePassword,
  updatePasswordHandler
);

// GET /api/auth/profile - Get current user profile
router.get("/profile", authenticateToken, getProfileHandler);

export { router as authRoutes };
