import { Request, Response } from "express";
import { getAuditLogs } from "../services/auditService";
import { getDatabase } from "../database/init";

/**
 * Get audit logs with pagination and optional filtering
 * Role-based access: admins see all logs, users see only their own
 */
export function getAuditLogsEndpoint(req: Request, res: Response): void {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const action = req.query.action as string;
    const rowId = req.query.rowId
      ? parseInt(req.query.rowId as string)
      : undefined;

    // Get user information from the authenticated request
    const userId = req.user?.userId;
    let userRole: "user" | "admin" = "user";

    if (userId) {
      const db = getDatabase();
      const user = db
        .prepare("SELECT role FROM users WHERE id = ?")
        .get(userId) as { role: string };
      if (user) {
        userRole = user.role as "user" | "admin";
      }
    }

    const result = getAuditLogs(page, limit, action, rowId, userId, userRole);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error("Error getting audit logs:", error);
    res.status(500).json({ error: "Failed to get audit logs" });
  }
}
