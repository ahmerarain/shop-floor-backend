import path from "path";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";
import { FIELD_MAPPING } from "./validation.js";

// Export error CSV with invalid rows
export async function exportErrorCsv(invalidRows: any[]): Promise<void> {
  if (invalidRows.length === 0) return;

  const errorCsvPath = path.join(process.cwd(), "error.csv");
  const csvWriter = createObjectCsvWriter({
    path: errorCsvPath,
    header: [
      { id: "rowNumber", title: "Row Number" },
      { id: FIELD_MAPPING.part_mark[0], title: FIELD_MAPPING.part_mark[0] },
      {
        id: FIELD_MAPPING.assembly_mark[0],
        title: FIELD_MAPPING.assembly_mark[0],
      },
      { id: FIELD_MAPPING.material[0], title: FIELD_MAPPING.material[0] },
      { id: FIELD_MAPPING.thickness[0], title: FIELD_MAPPING.thickness[0] },
      { id: "errors", title: "Errors" },
    ],
  });

  await csvWriter.writeRecords(invalidRows);
}

// Export data CSV
export async function exportDataCsv(rows: any[]): Promise<string> {
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

  await csvWriter.writeRecords(rows);
  return csvPath;
}

// Clean up file after download
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error cleaning up file:", error);
  }
}
