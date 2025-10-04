import { Request, Response } from "express";
import { getCsvDataById, getAllCsvData } from "../services/csvService";
import {
  generateSingleLabel,
  generateBulkLabels,
} from "../services/labelService";
import fs from "fs";
import path from "path";

/**
 * Generate label for a single record by ID
 */
export async function generateLabelById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Record ID is required" });
      return;
    }

    // Get the record data
    const record = getCsvDataById(parseInt(id));

    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }

    // Generate label
    const result = await generateSingleLabel(record);

    if (!result.success) {
      res
        .status(500)
        .json({ error: result.error || "Failed to generate label" });
      return;
    }

    // Send ZPL content as text
    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="label_${id}.zpl"`
    );
    res.send(result.zplContent);
  } catch (error) {
    console.error("Error generating label by ID:", error);
    res.status(500).json({ error: "Failed to generate label" });
  }
}

/**
 * Generate PDF label for a single record by ID
 */
export async function generatePDFLabelById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Record ID is required" });
      return;
    }

    // Get the record data
    const record = getCsvDataById(parseInt(id));

    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }

    // Generate label
    const result = await generateSingleLabel(record);

    if (!result.success) {
      res
        .status(500)
        .json({ error: result.error || "Failed to generate label" });
      return;
    }

    // Send PDF file
    if (result.pdfPath && fs.existsSync(result.pdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="label_${id}.pdf"`
      );
      res.sendFile(path.resolve(result.pdfPath));
    } else {
      res.status(500).json({ error: "PDF file not generated" });
    }
  } catch (error) {
    console.error("Error generating PDF label by ID:", error);
    res.status(500).json({ error: "Failed to generate PDF label" });
  }
}

/**
 * Generate labels for multiple records (bulk)
 */
export async function generateBulkLabelsEndpoint(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "Array of record IDs is required" });
      return;
    }

    // Get all records data
    const allRecords = getAllCsvData();
    const selectedRecords = allRecords.filter(
      (record) => record.id && ids.includes(record.id)
    );

    if (selectedRecords.length === 0) {
      res.status(404).json({ error: "No valid records found" });
      return;
    }

    // Generate bulk labels
    const result = await generateBulkLabels(selectedRecords);

    if (!result.success) {
      res.status(500).json({
        error: "Failed to generate bulk labels",
        details: result.errors,
      });
      return;
    }

    // Create a zip file or return individual file paths
    res.json({
      success: true,
      message: `Generated ${result.zplFiles?.length || 0} ZPL files and ${
        result.pdfFiles?.length || 0
      } PDF files`,
      zplFiles: result.zplFiles,
      pdfFiles: result.pdfFiles,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Error generating bulk labels:", error);
    res.status(500).json({ error: "Failed to generate bulk labels" });
  }
}

/**
 * Download ZPL file for a single record
 */
export async function downloadZPLFile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Record ID is required" });
      return;
    }

    // Get the record data
    const record = getCsvDataById(parseInt(id));

    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }

    // Generate label
    const result = await generateSingleLabel(record);

    if (!result.success) {
      res
        .status(500)
        .json({ error: result.error || "Failed to generate label" });
      return;
    }

    // Send ZPL content as downloadable file
    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="label_${id}.zpl"`
    );
    res.send(result.zplContent);
  } catch (error) {
    console.error("Error downloading ZPL file:", error);
    res.status(500).json({ error: "Failed to download ZPL file" });
  }
}

/**
 * Download PDF file for a single record
 */
export async function downloadPDFFile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Record ID is required" });
      return;
    }

    // Get the record data
    const record = getCsvDataById(parseInt(id));

    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }

    // Generate label
    const result = await generateSingleLabel(record);

    if (!result.success) {
      res
        .status(500)
        .json({ error: result.error || "Failed to generate label" });
      return;
    }

    // Send PDF file
    if (result.pdfPath && fs.existsSync(result.pdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="label_${id}.pdf"`
      );
      res.sendFile(path.resolve(result.pdfPath));
    } else {
      res.status(500).json({ error: "PDF file not generated" });
    }
  } catch (error) {
    console.error("Error downloading PDF file:", error);
    res.status(500).json({ error: "Failed to download PDF file" });
  }
}
