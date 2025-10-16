import { Request, Response } from "express";
import {
  loginUser,
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../services/authService";
import {
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "../types/user";

// Login user
export async function loginHandler(req: Request, res: Response): Promise<void> {
  try {
    const loginData: LoginRequest = req.body;
    const result = await loginUser(loginData);

    if (result.success) {
      res.json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
}

// Forgot password - send reset link
export async function forgotPasswordHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const forgotData: ForgotPasswordRequest = req.body;
    const result = await forgotPassword(forgotData);

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process password reset request",
    });
  }
}

// Reset password with token
export async function resetPasswordHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const resetData: ResetPasswordRequest = req.body;
    const result = await resetPassword(resetData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
}

// Update password (for authenticated users)
export async function updatePasswordHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const passwordData: UpdatePasswordRequest = req.body;
    const result = await updatePassword(userId, passwordData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update password",
    });
  }
}

// Get current user profile
export function getProfileHandler(req: Request, res: Response): void {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    // Import here to avoid circular dependency
    const { getUserById } = require("../services/userService");
    const user = getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
}
