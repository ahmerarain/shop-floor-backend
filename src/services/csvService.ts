import fs from "fs";
import csv from "csv-parser";
import {
  executeSelectQuery,
  executeCountQuery,
  executeBatchInsert,
  executeModifyQuery,
} from "../utils/database";
import {
  validateRow,
  getFieldValueSafe,
  FIELD_MAPPING,
} from "../utils/validation";
import { exportErrorCsv } from "../utils/csv";
import {
  logAuditEntry,
  logBulkOperation,
  createDiffString,
} from "./auditService";

export interface ProcessedCsvResult {
  success: boolean;
  validRows: number;
  invalidRows: number;
  hasErrorFile: boolean;
  error?: string;
}

export interface CsvData {
  id?: number;
  part_mark: string;
  assembly_mark: string;
  material: string;
  thickness: string;
  quantity?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResult {
  data: CsvData[];
  total: number;
  page: number;
  limit: number;
}

// Process uploaded CSV file
export async function processCsvFile(
  filePath: string
): Promise<ProcessedCsvResult> {
  try {
    const validRows: any[] = [];
    const invalidRows: any[] = [];
    let rowIndex = 0;

    // Process CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          rowIndex++;
          const validation = validateRow(row, rowIndex);

          if (validation.isValid) {
            validRows.push({
              ...row,
              rowNumber: rowIndex,
            });
          } else {
            invalidRows.push({
              ...row,
              rowNumber: rowIndex,
              errors: validation.errors,
            });
          }
        })
        .on("end", () => {
          resolve();
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    // Save valid rows to database
    if (validRows.length > 0) {
      const insertQuery = `
        INSERT INTO csv_data (part_mark, assembly_mark, material, thickness, quantity, length, width, height, weight, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertData = validRows.map((row) => [
        getFieldValueSafe(row, "part_mark"),
        getFieldValueSafe(row, "assembly_mark"),
        getFieldValueSafe(row, "material"),
        getFieldValueSafe(row, "thickness"),
        getFieldValueSafe(row, "quantity", 1),
        getFieldValueSafe(row, "length"),
        getFieldValueSafe(row, "width"),
        getFieldValueSafe(row, "height"),
        getFieldValueSafe(row, "weight"),
        getFieldValueSafe(row, "notes"),
      ]);

      executeBatchInsert(insertQuery, insertData);

      // Log audit entry for bulk create
      logAuditEntry({
        user: "system",
        action: "CREATE",
        diff: `Bulk created ${validRows.length} records from CSV upload`,
      });
    }

    // Export error CSV if there are invalid rows
    if (invalidRows.length > 0) {
      await exportErrorCsv(invalidRows);
    }

    return {
      success: true,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      hasErrorFile: invalidRows.length > 0,
    };
  } catch (error) {
    console.error("Error processing CSV:", error);
    return {
      success: false,
      validRows: 0,
      invalidRows: 0,
      hasErrorFile: false,
      error: "Failed to process CSV file",
    };
  }
}

// Get paginated data with search
export function getCsvData(
  search?: string,
  page: number = 1,
  limit: number = 100
): PaginatedResult {
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM csv_data";
  let params: any[] = [];

  if (search) {
    query +=
      " WHERE part_mark LIKE ? OR assembly_mark LIKE ? OR material LIKE ?";
    const searchTerm = `%${search}%`;
    params = [searchTerm, searchTerm, searchTerm];
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const rows = executeSelectQuery(query, params);

  // Get total count
  let countQuery = "SELECT COUNT(*) as total FROM csv_data";
  let countParams: any[] = [];

  if (search) {
    countQuery +=
      " WHERE part_mark LIKE ? OR assembly_mark LIKE ? OR material LIKE ?";
    const searchTerm = `%${search}%`;
    countParams = [searchTerm, searchTerm, searchTerm];
  }

  const total = executeCountQuery(countQuery, countParams);

  return {
    data: rows,
    total,
    page,
    limit,
  };
}

// Update CSV data row
export function updateCsvData(
  id: string,
  data: Partial<CsvData>
): { success: boolean; changes: number; error?: string } {
  try {
    // Get the current data for diff
    const currentDataQuery = "SELECT * FROM csv_data WHERE id = ?";
    const currentData = executeSelectQuery(currentDataQuery, [id]);

    if (currentData.length === 0) {
      return { success: false, changes: 0, error: "Record not found" };
    }

    const oldData = currentData[0];

    const query = `
      UPDATE csv_data 
      SET part_mark = ?, assembly_mark = ?, material = ?, thickness = ?, 
          quantity = ?, length = ?, width = ?, height = ?, weight = ?, notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const changes = executeModifyQuery(query, [
      data.part_mark || null,
      data.assembly_mark || null,
      data.material || null,
      data.thickness || null,
      data.quantity || 1,
      data.length || null,
      data.width || null,
      data.height || null,
      data.weight || null,
      data.notes || null,
      id,
    ]);

    if (changes > 0) {
      // Create new data object for diff
      const newData = {
        ...oldData,
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Log audit entry
      logAuditEntry({
        user: "system",
        action: "UPDATE",
        row_id: parseInt(id),
        diff: createDiffString(oldData, newData),
      });
    }

    return { success: true, changes };
  } catch (error) {
    console.error("Update error:", error);
    return { success: false, changes: 0, error: "Failed to update row" };
  }
}

// Get all data for export
export function getAllCsvData(): CsvData[] {
  const query = "SELECT * FROM csv_data ORDER BY created_at DESC";
  return executeSelectQuery(query);
}

// Get single record by ID
export function getCsvDataById(id: number): CsvData | null {
  const query = "SELECT * FROM csv_data WHERE id = ?";
  const results = executeSelectQuery(query, [id]);
  return results.length > 0 ? results[0] : null;
}

// Delete specific records by IDs
export function deleteCsvData(ids: number[]): {
  success: boolean;
  deletedCount: number;
  error?: string;
} {
  try {
    if (ids.length === 0) {
      return { success: false, deletedCount: 0, error: "No IDs provided" };
    }

    // Create placeholders for the IN clause
    const placeholders = ids.map(() => "?").join(",");
    const query = `DELETE FROM csv_data WHERE id IN (${placeholders})`;

    const deletedCount = executeModifyQuery(query, ids);

    if (deletedCount > 0) {
      // Log bulk delete operation
      logBulkOperation("BULK_DELETE", ids, "system");
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      deletedCount: 0,
      error: "Failed to delete records",
    };
  }
}

// Clear all data from database
export function clearAllCsvData(): { success: boolean; error?: string } {
  try {
    const query = "DELETE FROM csv_data";
    executeModifyQuery(query);

    // Log clear all operation
    logBulkOperation("CLEAR_ALL", [], "system");

    return { success: true };
  } catch (error) {
    console.error("Clear database error:", error);
    return { success: false, error: "Failed to clear database" };
  }
}
