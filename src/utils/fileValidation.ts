import { Request, Response, NextFunction } from "express";
import path from "path";

// File size limits
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_FILE_SIZE_MB: 10,
} as const;

// Allowed MIME types for CSV files
export const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/csv",
  "text/plain", // Some systems report CSV as text/plain
  "application/vnd.ms-excel", // Excel CSV
] as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = [".csv"] as const;

// Characters that could be used for formula injection
export const FORMULA_INJECTION_CHARS = [
  "=",
  "+",
  "-",
  "@",
  "\t",
  "\r",
] as const;

/**
 * Validates uploaded file for security and size constraints
 */
export function validateUploadedFile(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.file) {
    res.status(400).json({
      error: "No file uploaded",
      code: "NO_FILE",
    });
    return;
  }

  const file = req.file;
  const errors: string[] = [];

  // Check file size
  if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
    errors.push(
      `File size exceeds ${FILE_SIZE_LIMITS.MAX_FILE_SIZE_MB}MB limit`
    );
  }

  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension as any)) {
    errors.push(
      `File extension '${fileExtension}' is not allowed. Only CSV files are accepted.`
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    errors.push(
      `File type '${file.mimetype}' is not allowed. Only CSV files are accepted.`
    );
  }

  // Check for suspicious file names
  if (
    file.originalname.includes("..") ||
    file.originalname.includes("/") ||
    file.originalname.includes("\\")
  ) {
    errors.push("File name contains invalid characters");
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: "File validation failed",
      details: errors,
      code: "FILE_VALIDATION_FAILED",
    });
    return;
  }

  next();
}

/**
 * Sanitizes data to prevent CSV formula injection
 * Prefixes potentially dangerous values with a single quote
 */
export function sanitizeForCsvInjection(data: any): any {
  if (typeof data === "string") {
    // Check if the string starts with any formula injection characters
    const trimmedData = data.trim();
    if (
      trimmedData.length > 0 &&
      FORMULA_INJECTION_CHARS.includes(trimmedData[0] as any)
    ) {
      return `'${data}`;
    }
  }
  return data;
}

/**
 * Sanitizes an entire row of data for CSV export
 */
export function sanitizeRowForCsv(
  row: Record<string, any>
): Record<string, any> {
  const sanitizedRow: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    sanitizedRow[key] = sanitizeForCsvInjection(value);
  }

  return sanitizedRow;
}

/**
 * Validates CSV content for potential security issues
 */
export function validateCsvContent(content: string): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for potential formula injection patterns
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 0) {
      // Check for common formula injection patterns
      if (
        FORMULA_INJECTION_CHARS.some((char) => trimmedLine.startsWith(char))
      ) {
        warnings.push(
          `Line ${
            index + 1
          }: Potential formula injection detected - "${trimmedLine.substring(
            0,
            20
          )}..."`
        );
      }

      // Check for suspicious patterns
      if (
        trimmedLine.includes("=cmd|") ||
        trimmedLine.includes("=powershell|")
      ) {
        warnings.push(
          `Line ${index + 1}: Suspicious command injection pattern detected`
        );
      }
    }
  });

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
