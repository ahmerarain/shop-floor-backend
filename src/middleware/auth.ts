import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";
import { getDatabase } from "../database/init";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role?: "user" | "admin";
      };
    }
  }
}

// Authentication middleware
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Access token required",
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
    return;
  }

  req.user = decoded;
  next();
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

// Admin-only middleware - requires authentication and admin role
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // First check if user is authenticated
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });
    return;
  }

  try {
    const db = getDatabase();
    const user = db
      .prepare("SELECT role FROM users WHERE id = ?")
      .get(req.user.userId) as { role: string } | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    if (user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: "Admin access required",
      });
      return;
    }

    // Add role to request user object for convenience
    req.user.role = user.role as "admin";
    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify admin access",
    });
  }
}
