import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import {
  processCsvFile,
  getCsvData,
  updateCsvData,
  getAllCsvData,
  deleteCsvData,
  clearAllCsvData,
} from "../services/csvService";
import { exportDataCsv, cleanupFile } from "../utils/csv";

// Upload and process CSV
export async function uploadCsv(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const result = await processCsvFile(req.file.path, req.file.originalname);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (result.success) {
      res.json({
        success: true,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        hasErrorFile: result.hasErrorFile,
      });
    } else {
      res
        .status(500)
        .json({ error: result.error || "Failed to process CSV file" });
    }
  } catch (error) {
    console.error("Error processing CSV:", error);
    res.status(500).json({ error: "Failed to process CSV file" });
  }
}

// Get all data with pagination and search
export function getData(req: Request, res: Response): void {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const result = getCsvData(search as string, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
}

// Update row
export function updateData(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = updateCsvData(id, updateData);

    if (result.success) {
      res.json({ success: true, changes: result.changes });
    } else {
      res.status(500).json({ error: result.error || "Failed to update row" });
    }
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update row" });
  }
}

// Export CSV
export async function exportCsv(req: Request, res: Response): Promise<void> {
  try {
    const rows = getAllCsvData();
    const csvPath = await exportDataCsv(rows);

    res.download(csvPath, "export.csv", (err) => {
      if (err) {
        console.error("Download error:", err);
      }
      // Clean up file after download
      cleanupFile(csvPath);
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
}

// Download error CSV
export function downloadErrorCsv(req: Request, res: Response): void {
  try {
    const errorCsvPath = path.join(process.cwd(), "error.csv");

    // Check if error file exists
    if (!fs.existsSync(errorCsvPath)) {
      res.status(404).json({ error: "No error file found" });
      return;
    }

    res.download(errorCsvPath, "error.csv", (err) => {
      if (err) {
        console.error("Error file download error:", err);
        res.status(500).json({ error: "Failed to download error file" });
      }
    });
  } catch (error) {
    console.error("Download error CSV error:", error);
    res.status(500).json({ error: "Failed to download error file" });
  }
}

// Check if error file exists
export function checkErrorFile(req: Request, res: Response): void {
  try {
    const errorCsvPath = path.join(process.cwd(), "error.csv");
    const exists = fs.existsSync(errorCsvPath);

    res.json({
      hasErrorFile: exists,
      message: exists
        ? "Error file available for download"
        : "No error file found",
    });
  } catch (error) {
    console.error("Check error file error:", error);
    res.status(500).json({ error: "Failed to check error file" });
  }
}

// Delete specific records by IDs
export function deleteData(req: Request, res: Response): void {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res
        .status(400)
        .json({ error: "IDs array is required and cannot be empty" });
      return;
    }

    // Validate that all IDs are numbers
    const numericIds = ids.map((id) => Number(id));
    if (numericIds.some((id) => isNaN(id))) {
      res.status(400).json({ error: "All IDs must be valid numbers" });
      return;
    }

    const result = deleteCsvData(numericIds);

    if (result.success) {
      res.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `Successfully deleted ${result.deletedCount} record(s)`,
      });
    } else {
      res
        .status(500)
        .json({ error: result.error || "Failed to delete records" });
    }
  } catch (error) {
    console.error("Delete data error:", error);
    res.status(500).json({ error: "Failed to delete records" });
  }
}

export function deleteById(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "ID is required and cannot be empty" });
      return;
    }

    // Validate that all IDs are numbers
    if (isNaN(Number(id))) {
      res.status(400).json({ error: "ID must be a valid number" });
      return;
    }

    const result = deleteCsvData([Number(id)]);

    if (result.success) {
      res.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `Successfully deleted ${result.deletedCount} record(s)`,
      });
    } else {
      res
        .status(500)
        .json({ error: result.error || "Failed to delete records" });
    }
  } catch (error) {
    console.error("Delete data error:", error);
    res.status(500).json({ error: "Failed to delete records" });
  }
}
// Clear all data from database
export function clearAllData(req: Request, res: Response): void {
  try {
    const result = clearAllCsvData();

    if (result.success) {
      res.json({
        success: true,
        message: "All data has been cleared from the database",
      });
    } else {
      res
        .status(500)
        .json({ error: result.error || "Failed to clear database" });
    }
  } catch (error) {
    console.error("Clear all data error:", error);
    res.status(500).json({ error: "Failed to clear database" });
  }
}
