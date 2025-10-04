import { executeSelectQuery, executeModifyQuery } from "../utils/database";
import { CsvData } from "./csvService";
import { createDiffString } from "./auditService";

export interface InvalidRowData extends CsvData {
  // All fields from CsvData plus validation info
}

export interface EditedRowData extends CsvData {
  // All fields from CsvData plus edit tracking
  // Additional fields will be added dynamically for original values
}

export interface ExceptionExportResult {
  success: boolean;
  csvContent?: string;
  filename?: string;
  error?: string;
}

/**
 * Get all invalid rows (is_valid = false)
 */
export function getInvalidRows(): InvalidRowData[] {
  const query = `
    SELECT * FROM csv_data 
    WHERE is_valid = 0 
    ORDER BY id ASC
  `;

  return executeSelectQuery(query);
}

/**
 * Get all edited rows (edited_at IS NOT NULL)
 */
export function getEditedRows(): EditedRowData[] {
  const query = `
    SELECT * FROM csv_data 
    WHERE edited_at IS NOT NULL 
    ORDER BY id ASC
  `;

  return executeSelectQuery(query);
}

/**
 * Get original values for edited fields from audit log
 */
export function getOriginalValuesForEditedRow(rowId: number): Partial<CsvData> {
  try {
    // Get the most recent UPDATE audit entry for this row
    const query = `
      SELECT diff FROM audit_log 
      WHERE row_id = ? AND action = 'UPDATE' 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;

    const result = executeSelectQuery(query, [rowId]);

    if (result.length === 0) {
      return {};
    }

    const diffString = result[0].diff;
    if (!diffString) {
      return {};
    }

    console.log(`Parsing diff for row ${rowId}:`, diffString);

    // Parse the diff string to extract original values
    // Format: "field: \"old_value\" → \"new_value\""
    const originalValues: Partial<CsvData> = {};

    // Split by comma and parse each field change
    const changes = diffString.split(", ");

    for (const change of changes) {
      // More robust regex to handle various formats
      const match = change.match(/^(\w+):\s*"([^"]*)"\s*→\s*"[^"]*"$/);
      if (match) {
        const fieldName = match[1];
        const originalValue = match[2];

        // Map field names to CsvData properties
        switch (fieldName) {
          case "part_mark":
            originalValues.part_mark = originalValue;
            break;
          case "assembly_mark":
            originalValues.assembly_mark = originalValue;
            break;
          case "material":
            originalValues.material = originalValue;
            break;
          case "thickness":
            originalValues.thickness = originalValue;
            break;
          case "quantity":
            const qty = parseInt(originalValue);
            originalValues.quantity = isNaN(qty) ? 0 : qty;
            break;
          case "length":
            const len = parseFloat(originalValue);
            originalValues.length = isNaN(len) ? 0 : len;
            break;
          case "width":
            const w = parseFloat(originalValue);
            originalValues.width = isNaN(w) ? 0 : w;
            break;
          case "height":
            const h = parseFloat(originalValue);
            originalValues.height = isNaN(h) ? 0 : h;
            break;
          case "weight":
            const wt = parseFloat(originalValue);
            originalValues.weight = isNaN(wt) ? 0 : wt;
            break;
          case "notes":
            originalValues.notes = originalValue;
            break;
        }
      }
    }

    console.log(`Extracted original values for row ${rowId}:`, originalValues);
    return originalValues;
  } catch (error) {
    console.error("Error getting original values:", error);
    return {};
  }
}

/**
 * Generate CSV content for invalid rows export
 */
export function generateInvalidRowsCSV(): ExceptionExportResult {
  try {
    const invalidRows = getInvalidRows();

    if (invalidRows.length === 0) {
      // Return CSV with headers only
      const headers = [
        "row_id",
        "source_filename",
        "line_no",
        "uploaded_at",
        "last_validated_at",
        "is_valid",
        "error_codes",
        "error_messages",
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

      return {
        success: true,
        csvContent: headers.join(","),
        filename: "invalid_rows.csv",
      };
    }

    // Generate CSV content
    const headers = [
      "row_id",
      "source_filename",
      "line_no",
      "uploaded_at",
      "last_validated_at",
      "is_valid",
      "error_codes",
      "error_messages",
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

    const csvRows = invalidRows.map((row) => [
      row.id || "",
      escapeCSVField(row.source_filename || ""),
      row.line_no || "",
      row.created_at || "",
      row.last_validated_at || "",
      row.is_valid ? "true" : "false",
      escapeCSVField(row.error_codes || ""),
      escapeCSVField(row.error_messages || ""),
      escapeCSVField(row.part_mark),
      escapeCSVField(row.assembly_mark),
      escapeCSVField(row.material),
      escapeCSVField(row.thickness),
      row.quantity || "",
      row.length || "",
      row.width || "",
      row.height || "",
      row.weight || "",
      escapeCSVField(row.notes || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    return {
      success: true,
      csvContent,
      filename: "invalid_rows.csv",
    };
  } catch (error) {
    console.error("Error generating invalid rows CSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate CSV content for edited rows export
 */
export function generateEditedRowsCSV(): ExceptionExportResult {
  try {
    const editedRows = getEditedRows();

    if (editedRows.length === 0) {
      // Return CSV with headers only
      const headers = [
        "row_id",
        "source_filename",
        "line_no",
        "uploaded_at",
        "last_validated_at",
        "is_valid",
        "error_codes",
        "error_messages",
        "edited_by",
        "edited_at",
        "fields_changed",
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
        "part_mark_original",
        "assembly_mark_original",
        "material_original",
        "thickness_original",
        "quantity_original",
        "length_original",
        "width_original",
        "height_original",
        "weight_original",
        "notes_original",
      ];

      return {
        success: true,
        csvContent: headers.join(","),
        filename: "edited_rows.csv",
      };
    }

    // Generate CSV content with original values
    const headers = [
      "row_id",
      "source_filename",
      "line_no",
      "uploaded_at",
      "last_validated_at",
      "is_valid",
      "error_codes",
      "error_messages",
      "edited_by",
      "edited_at",
      "fields_changed",
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
      "part_mark_original",
      "assembly_mark_original",
      "material_original",
      "thickness_original",
      "quantity_original",
      "length_original",
      "width_original",
      "height_original",
      "weight_original",
      "notes_original",
    ];

    const csvRows = editedRows.map((row) => {
      // Get original values (for now, we'll use empty strings - this needs to be implemented)
      const originalValues = getOriginalValuesForEditedRow(row.id || 0);

      return [
        row.id || "",
        escapeCSVField(row.source_filename || ""),
        row.line_no || "",
        row.created_at || "",
        row.last_validated_at || "",
        row.is_valid ? "true" : "false",
        escapeCSVField(row.error_codes || ""),
        escapeCSVField(row.error_messages || ""),
        escapeCSVField(row.edited_by || ""),
        row.edited_at || "",
        escapeCSVField(row.fields_changed || ""),
        escapeCSVField(row.part_mark),
        escapeCSVField(row.assembly_mark),
        escapeCSVField(row.material),
        escapeCSVField(row.thickness),
        row.quantity || "",
        row.length || "",
        row.width || "",
        row.height || "",
        row.weight || "",
        escapeCSVField(row.notes || ""),
        // Original values
        escapeCSVField(originalValues.part_mark || ""),
        escapeCSVField(originalValues.assembly_mark || ""),
        escapeCSVField(originalValues.material || ""),
        escapeCSVField(originalValues.thickness || ""),
        originalValues.quantity || "",
        originalValues.length || "",
        originalValues.width || "",
        originalValues.height || "",
        originalValues.weight || "",
        escapeCSVField(originalValues.notes || ""),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    return {
      success: true,
      csvContent,
      filename: "edited_rows.csv",
    };
  } catch (error) {
    console.error("Error generating edited rows CSV:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Escape CSV field values
 */
function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Update validation status for a row
 */
export function updateValidationStatus(
  rowId: number,
  isValid: boolean,
  errorCodes?: string,
  errorMessages?: string
): void {
  try {
    const query = `
      UPDATE csv_data 
      SET is_valid = ?, error_codes = ?, error_messages = ?, last_validated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    executeModifyQuery(query, [
      isValid ? 1 : 0,
      errorCodes || null,
      errorMessages || null,
      rowId,
    ]);
  } catch (error) {
    console.error("Error updating validation status:", error);
  }
}

/**
 * Mark row as edited
 */
export function markRowAsEdited(
  rowId: number,
  editedBy: string,
  fieldsChanged: string[]
): void {
  try {
    const query = `
      UPDATE csv_data 
      SET edited_by = ?, edited_at = CURRENT_TIMESTAMP, fields_changed = ?
      WHERE id = ?
    `;

    executeModifyQuery(query, [editedBy, fieldsChanged.join("|"), rowId]);
  } catch (error) {
    console.error("Error marking row as edited:", error);
  }
}
