import { Request, Response } from "express";
import {
  generateInvalidRowsCSV,
  generateEditedRowsCSV,
} from "../services/exceptionService";

/**
 * Export invalid rows CSV
 */
export function exportInvalidRows(req: Request, res: Response): void {
  try {
    const result = generateInvalidRowsCSV();

    if (!result.success) {
      res
        .status(500)
        .json({ error: result.error || "Failed to generate invalid rows CSV" });
      return;
    }

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Add BOM for proper UTF-8 encoding in Excel and send content
    res.send("\uFEFF" + result.csvContent);
  } catch (error) {
    console.error("Error exporting invalid rows:", error);
    res.status(500).json({ error: "Failed to export invalid rows" });
  }
}

/**
 * Export edited rows CSV
 */
export function exportEditedRows(req: Request, res: Response): void {
  try {
    const result = generateEditedRowsCSV();

    if (!result.success) {
      res
        .status(500)
        .json({ error: result.error || "Failed to generate edited rows CSV" });
      return;
    }

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Add BOM for proper UTF-8 encoding in Excel and send content
    res.send("\uFEFF" + result.csvContent);
  } catch (error) {
    console.error("Error exporting edited rows:", error);
    res.status(500).json({ error: "Failed to export edited rows" });
  }
}

/**
 * Get invalid rows count
 */
export function getInvalidRowsCount(req: Request, res: Response): void {
  try {
    const { getInvalidRows } = require("../services/exceptionService");
    const invalidRows = getInvalidRows();

    res.json({
      success: true,
      count: invalidRows.length,
    });
  } catch (error) {
    console.error("Error getting invalid rows count:", error);
    res.status(500).json({ error: "Failed to get invalid rows count" });
  }
}

/**
 * Get edited rows count
 */
export function getEditedRowsCount(req: Request, res: Response): void {
  try {
    const { getEditedRows } = require("../services/exceptionService");
    const editedRows = getEditedRows();

    res.json({
      success: true,
      count: editedRows.length,
    });
  } catch (error) {
    console.error("Error getting edited rows count:", error);
    res.status(500).json({ error: "Failed to get edited rows count" });
  }
}
