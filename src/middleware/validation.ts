import { Request, Response, NextFunction } from "express";
import {
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "../types/user";

// Validation helper function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate create user request
export function validateCreateUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { first_name, last_name, email, password, is_active, send_email } =
    req.body as CreateUserRequest;
  const errors: string[] = [];

  // Required fields
  if (!first_name || first_name.trim().length === 0) {
    errors.push("First name is required");
  }

  if (!last_name || last_name.trim().length === 0) {
    errors.push("Last name is required");
  }

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!validateEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!password || password.trim().length === 0) {
    errors.push("Password is required");
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  // Optional fields validation
  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  if (send_email !== undefined && typeof send_email !== "boolean") {
    errors.push("send_email must be a boolean");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
    return;
  }

  next();
}

// Validate update user request
export function validateUpdateUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { first_name, last_name, email, is_active } =
    req.body as UpdateUserRequest;
  const errors: string[] = [];

  // At least one field must be provided
  if (
    first_name === undefined &&
    last_name === undefined &&
    email === undefined &&
    is_active === undefined
  ) {
    errors.push("At least one field must be provided for update");
  }

  // Validate provided fields
  if (first_name !== undefined && first_name.trim().length === 0) {
    errors.push("First name cannot be empty");
  }

  if (last_name !== undefined && last_name.trim().length === 0) {
    errors.push("Last name cannot be empty");
  }

  if (email !== undefined) {
    if (email.trim().length === 0) {
      errors.push("Email cannot be empty");
    } else if (!validateEmail(email)) {
      errors.push("Invalid email format");
    }
  }

  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
    return;
  }

  next();
}

// Validate login request
export function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { email, password } = req.body as LoginRequest;
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!validateEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!password || password.trim().length === 0) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
    return;
  }

  next();
}

// Validate forgot password request
export function validateForgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { email } = req.body as ForgotPasswordRequest;
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!validateEmail(email)) {
    errors.push("Invalid email format");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
    return;
  }

  next();
}

// Validate reset password request
export function validateResetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { token, new_password } = req.body as ResetPasswordRequest;
  const errors: string[] = [];

  if (!token || token.trim().length === 0) {
    errors.push("Reset token is required");
  }

  if (!new_password || new_password.trim().length === 0) {
    errors.push("New password is required");
  } else {
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
    return;
  }

  next();
}

// Validate update password request
export function validateUpdatePassword(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { current_password, new_password } = req.body as UpdatePasswordRequest;
  const errors: string[] = [];

  if (!current_password || current_password.trim().length === 0) {
    errors.push("Current password is required");
  }

  if (!new_password || new_password.trim().length === 0) {
    errors.push("New password is required");
  } else {
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (current_password === new_password) {
    errors.push("New password must be different from current password");
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors,
    });
    return;
  }

  next();
}
