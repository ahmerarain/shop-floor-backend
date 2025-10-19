import {
  executeModifyQuery,
  executeSelectQuery,
  executeCountQuery,
} from "../utils/database";

export interface AuditLogEntry {
  id?: number;
  timestamp?: string;
  user_id: number | null;
  user_name?: string; // Populated from users table
  user_email?: string; // Populated from users table
  action: "CREATE" | "UPDATE" | "DELETE" | "BULK_DELETE" | "CLEAR_ALL";
  row_id?: number;
  diff?: string;
  created_at?: string;
}

export interface AuditLogResult {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Log an audit entry for CRUD operations
 */
export function logAuditEntry(
  entry: Omit<
    AuditLogEntry,
    "id" | "timestamp" | "created_at" | "user_name" | "user_email"
  >
): void {
  try {
    const query = `
      INSERT INTO audit_log (user_id, action, row_id, diff)
      VALUES (?, ?, ?, ?)
    `;

    executeModifyQuery(query, [
      entry.user_id,
      entry.action,
      entry.row_id || null,
      entry.diff || null,
    ]);
  } catch (error) {
    console.error("Failed to log audit entry:", error);
    // Don't throw error to avoid breaking main operations
  }
}

/**
 * Get audit log entries with pagination and user information
 * @param page Page number (1-based)
 * @param limit Number of entries per page
 * @param action Optional action filter
 * @param rowId Optional row ID filter
 * @param userId Optional user ID for role-based filtering
 * @param userRole Optional user role for access control
 */
export function getAuditLogs(
  page: number = 1,
  limit: number = 100,
  action?: string,
  rowId?: number,
  userId?: number,
  userRole?: "user" | "admin"
): AuditLogResult {
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      al.*,
      u.first_name || ' ' || u.last_name as user_name,
      u.email as user_email
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
  `;
  let params: any[] = [];
  const conditions: string[] = [];

  if (action) {
    conditions.push("al.action = ?");
    params.push(action);
  }

  if (rowId) {
    conditions.push("al.row_id = ?");
    params.push(rowId);
  }

  // Role-based filtering: if user is not admin, only show their own audit logs
  if (userId && userRole && userRole !== "admin") {
    conditions.push("al.user_id = ?");
    params.push(userId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY al.timestamp DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const data = executeSelectQuery(query, params);

  // Get total count
  let countQuery = "SELECT COUNT(*) as total FROM audit_log al";
  let countParams: any[] = [];

  if (conditions.length > 0) {
    countQuery += " WHERE " + conditions.join(" AND ");
    countParams = params.slice(0, -2); // Remove limit and offset
  }

  const total = executeCountQuery(countQuery, countParams);

  return {
    data,
    total,
    page,
    limit,
  };
}

/**
 * Create a diff string for update operations
 */
export function createDiffString(oldData: any, newData: any): string {
  const changes: string[] = [];

  const fields = [
    "part_mark",
    "assembly_mark",
    "material",
    "thickness",
    "quantity",
    "length",
    "width",
    "height",
    "weight",
    "notes",
  ];

  for (const field of fields) {
    const oldValue = oldData[field];
    const newValue = newData[field];

    // Normalize values for comparison
    const normalizedOldValue = normalizeValue(oldValue);
    const normalizedNewValue = normalizeValue(newValue);

    // Only include in diff if values are actually different
    if (normalizedOldValue !== normalizedNewValue) {
      // Additional check: if both are numbers, compare with small tolerance for floating point
      if (
        typeof normalizedOldValue === "number" &&
        typeof normalizedNewValue === "number"
      ) {
        const tolerance = 0.0001;
        if (Math.abs(normalizedOldValue - normalizedNewValue) > tolerance) {
          changes.push(`${field}: "${oldValue}" → "${newValue}"`);
        }
      } else {
        changes.push(`${field}: "${oldValue}" → "${newValue}"`);
      }
    }
  }

  return changes.length > 0 ? changes.join(", ") : "No changes";
}

/**
 * Normalize values for comparison to handle type differences
 */
function normalizeValue(value: any): string | number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Convert to string and trim whitespace
  const stringValue = String(value).trim();

  // Try to parse as number for numeric comparison
  const numValue = parseFloat(stringValue);
  if (!isNaN(numValue) && isFinite(numValue)) {
    return numValue;
  }

  return stringValue;
}

/**
 * Log bulk operations (like bulk delete)
 */
export function logBulkOperation(
  action: "BULK_DELETE" | "CLEAR_ALL",
  rowIds: number[],
  userId: number
): void {
  try {
    const diff =
      action === "BULK_DELETE"
        ? `Deleted ${rowIds.length} records: [${rowIds.join(", ")}]`
        : "Cleared all records from database";

    logAuditEntry({
      user_id: userId,
      action,
      diff,
    });
  } catch (error) {
    console.error("Failed to log bulk operation:", error);
  }
}
