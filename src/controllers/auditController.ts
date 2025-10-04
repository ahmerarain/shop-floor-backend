import { Request, Response } from "express";
import { getAuditLogs } from "../services/auditService";

/**
 * Get audit logs with pagination and optional filtering
 */
export function getAuditLogsEndpoint(req: Request, res: Response): void {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const action = req.query.action as string;
    const rowId = req.query.rowId
      ? parseInt(req.query.rowId as string)
      : undefined;

    const result = getAuditLogs(page, limit, action, rowId);

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
