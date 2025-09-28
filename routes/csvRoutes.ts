import express from "express";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import { db, saveDatabase } from "../database/init.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const rows = {
  part_mark: ["Part Mark", "PartMark", "Part_Mark"],
  assembly_mark: ["Assembly Mark", "AssemblyMark", "Assembly_Mark"],
  material: ["Material"],
  thickness: ["Thickness"],
  quantity: ["Quantity"],
  length: ["Length"],
  width: ["Width"],
  height: ["Height"],
  weight: ["Weight"],
  notes: ["Notes"],
};

// Validation function for mandatory fields
function validateRow(
  row: any,
  rowIndex: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row[rows["part_mark"][0]] || row[rows["part_mark"][0]].trim() === "") {
    errors.push("PartMark is required");
  }

  if (
    !row[rows["assembly_mark"][0]] ||
    row[rows["assembly_mark"][0]].trim() === ""
  ) {
    errors.push("AssemblyMark is required");
  }

  if (!row[rows["material"][0]] || row[rows["material"][0]].trim() === "") {
    errors.push("Material is required");
  }

  if (!row[rows["thickness"][0]] || row[rows["thickness"][0]].trim() === "") {
    errors.push("Thickness is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Upload and process CSV
router.post("/upload", upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    let rowIndex = 0;

    // Process CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file?.path || "")
        .pipe(csv())
        .on("data", (row) => {
          console.log("row", row);
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
    console.log("validRows", validRows);

    // Save valid rows to database
    if (validRows.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO csv_data (part_mark, assembly_mark, material, thickness, quantity, length, width, height, weight, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      validRows.forEach((row) => {
        stmt.bind([
          row[rows["part_mark"][0]] || null,
          row[rows["assembly_mark"][0]] || null,
          row[rows["material"][0]] || null,
          row[rows["thickness"][0]] || null,
          row[rows["quantity"][0]] || 1,
          row[rows["length"][0]] || null,
          row[rows["width"][0]] || null,
          row[rows["height"][0]] || null,
          row[rows["weight"][0]] || null,
          row[rows["notes"][0]] || null,
        ]);
        stmt.step();
        stmt.reset();
      });

      stmt.free();
      saveDatabase();
    }

    // Export error CSV if there are invalid rows
    if (invalidRows.length > 0) {
      const errorCsvPath = path.join(process.cwd(), "error.csv");
      const csvWriter = createObjectCsvWriter({
        path: errorCsvPath,
        header: [
          { id: "rowNumber", title: "Row Number" },
          { id: rows["part_mark"][0], title: rows["part_mark"][0] },
          { id: rows["assembly_mark"][0], title: rows["assembly_mark"][0] },
          { id: rows["material"][0], title: rows["material"][0] },
          { id: rows["thickness"][0], title: rows["thickness"][0] },
          { id: "errors", title: "Errors" },
        ],
      });

      await csvWriter.writeRecords(invalidRows);
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      hasErrorFile: invalidRows.length > 0,
    });
  } catch (error) {
    console.error("Error processing CSV:", error);
    res.status(500).json({ error: "Failed to process CSV file" });
  }
});

// Get all data
router.get("/data", (req, res) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = "SELECT * FROM csv_data";
    let params: any[] = [];

    if (search) {
      query +=
        " WHERE part_mark LIKE ? OR assembly_mark LIKE ? OR material LIKE ?";
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), offset);

    const stmt = db.prepare(query);
    const rows: any[] = [];

    // Bind parameters if any
    if (params.length > 0) {
      stmt.bind(params);
    }

    // Step through all rows
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM csv_data";
    let countParams: any[] = [];

    if (search) {
      countQuery +=
        " WHERE part_mark LIKE ? OR assembly_mark LIKE ? OR material LIKE ?";
      const searchTerm = `%${search}%`;
      countParams = [searchTerm, searchTerm, searchTerm];
    }

    const countStmt = db.prepare(countQuery);
    let total = 0;

    // Bind parameters if any
    if (countParams.length > 0) {
      countStmt.bind(countParams);
    }

    // Get the count result
    if (countStmt.step()) {
      total = countStmt.get()[0];
    }
    countStmt.free();

    res.json({
      data: rows,
      total: total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Update row
router.put("/data/:id", (req, res) => {
  try {
    const { id } = req.params;
    const {
      part_mark,
      assembly_mark,
      material,
      thickness,
      quantity,
      length,
      width,
      height,
      weight,
      notes,
    } = req.body;

    const query = `
      UPDATE csv_data 
      SET part_mark = ?, assembly_mark = ?, material = ?, thickness = ?, 
          quantity = ?, length = ?, width = ?, height = ?, weight = ?, notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const stmt = db.prepare(query);
    stmt.bind([
      part_mark || null,
      assembly_mark || null,
      material || null,
      thickness || null,
      quantity || 1,
      length || null,
      width || null,
      height || null,
      weight || null,
      notes || null,
      id,
    ]);
    stmt.step();
    const changes = db.getRowsModified();
    stmt.free();

    saveDatabase();

    res.json({ success: true, changes: changes });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update row" });
  }
});

// Export CSV
router.get("/export", (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM csv_data ORDER BY created_at DESC");
    const rows: any[] = [];

    // Step through all rows
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    const csvPath = path.join(process.cwd(), "export.csv");
    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: "part_mark", title: "PartMark" },
        { id: "assembly_mark", title: "AssemblyMark" },
        { id: "material", title: "Material" },
        { id: "thickness", title: "Thickness" },
        { id: "quantity", title: "Quantity" },
        { id: "length", title: "Length" },
        { id: "width", title: "Width" },
        { id: "height", title: "Height" },
        { id: "weight", title: "Weight" },
        { id: "notes", title: "Notes" },
      ],
    });

    csvWriter
      .writeRecords(rows as Record<string, any>[])
      .then(() => {
        res.download(csvPath, "export.csv", (err) => {
          if (err) {
            console.error("Download error:", err);
          }
          // Clean up file after download
          fs.unlinkSync(csvPath);
        });
      })
      .catch((error) => {
        console.error("CSV write error:", error);
        res.status(500).json({ error: "Failed to create export file" });
      });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

export { router as csvRoutes };
