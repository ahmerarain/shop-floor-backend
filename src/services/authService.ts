import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../database/init";
import {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  PasswordResetToken,
} from "../types/user";
import {
  getUserByEmail,
  verifyPassword,
  updateUserPassword,
} from "./userService";
import { sendPasswordResetLink } from "./emailService";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const RESET_TOKEN_EXPIRES_HOURS = 1; // 1 hour

// Generate JWT token
function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

// Verify JWT token
export function verifyToken(
  token: string
): { userId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Login user
export async function loginUser(
  loginData: LoginRequest
): Promise<LoginResponse> {
  try {
    const { email, password } = loginData;

    // Get user by email
    const user = getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        message: "Account is deactivated",
      };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password!);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Generate token
    const token = generateToken(user.id!, user.email);

    // Return user data without password
    const { password: _, ...userResponse } = user;

    return {
      success: true,
      token,
      user: userResponse as any,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Login failed",
    };
  }
}

// Forgot password - send reset link
export async function forgotPassword(
  forgotData: ForgotPasswordRequest
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { email } = forgotData;

    // Get user by email
    const user = getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // Check if user is active
    if (!user.is_active) {
      return {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRES_HOURS);

    // Store reset token in database
    const db = getDatabase();
    const insertQuery = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;

    db.prepare(insertQuery).run(user.id, resetToken, expiresAt.toISOString());

    // Generate reset link
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // Send reset email
    const emailSent = await sendPasswordResetLink(
      email,
      resetLink,
      user.first_name
    );

    if (!emailSent) {
      return {
        success: false,
        message: "Failed to send reset email",
      };
    }

    return {
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      message: "Failed to process password reset request",
    };
  }
}

// Reset password with token
export async function resetPassword(resetData: ResetPasswordRequest): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { token, new_password } = resetData;

    // Get reset token from database
    const db = getDatabase();
    const tokenQuery = `
      SELECT prt.*, u.email, u.first_name 
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > datetime('now')
    `;

    const resetToken = db
      .prepare(tokenQuery)
      .get(token) as PasswordResetToken & { email: string; first_name: string };

    if (!resetToken) {
      return {
        success: false,
        message: "Invalid or expired reset token",
      };
    }

    // Update user password
    const updateResult = await updateUserPassword(
      resetToken.user_id,
      new_password
    );
    if (!updateResult.success) {
      return {
        success: false,
        message: "Failed to update password",
      };
    }

    // Mark token as used
    const markUsedQuery =
      "UPDATE password_reset_tokens SET used = 1 WHERE token = ?";
    db.prepare(markUsedQuery).run(token);

    // Clean up expired tokens for this user
    const cleanupQuery =
      'DELETE FROM password_reset_tokens WHERE user_id = ? AND expires_at <= datetime("now")';
    db.prepare(cleanupQuery).run(resetToken.user_id);

    return {
      success: true,
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      message: "Failed to reset password",
    };
  }
}

// Update password (for authenticated users)
export async function updatePassword(
  userId: number,
  passwordData: UpdatePasswordRequest
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { current_password, new_password } = passwordData;

    // Get user
    const user = getUserByEmail(""); // We need to get user by ID, but our function takes email
    // Let's create a helper function for this
    const db = getDatabase();
    const userQuery = "SELECT * FROM users WHERE id = ?";
    const userData = db.prepare(userQuery).get(userId) as any;

    if (!userData) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      current_password,
      userData.password
    );
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: "Current password is incorrect",
      };
    }

    // Update password
    const updateResult = await updateUserPassword(userId, new_password);
    if (!updateResult.success) {
      return {
        success: false,
        message: "Failed to update password",
      };
    }

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Update password error:", error);
    return {
      success: false,
      message: "Failed to update password",
    };
  }
}

// Clean up expired tokens (can be called periodically)
export function cleanupExpiredTokens(): void {
  try {
    const db = getDatabase();
    const cleanupQuery =
      'DELETE FROM password_reset_tokens WHERE expires_at <= datetime("now")';
    const result = db.prepare(cleanupQuery).run();
    console.log(`Cleaned up ${result.changes} expired password reset tokens`);
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
}
