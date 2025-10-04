import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { CsvData } from "./csvService";

export interface LabelData {
  assemblyMark: string;
  partMark: string;
  material: string;
  thickness: string;
  quantity: number;
}

export interface LabelResult {
  success: boolean;
  zplContent?: string;
  pdfPath?: string;
  error?: string;
}

export interface BulkLabelResult {
  success: boolean;
  zplFiles?: string[];
  pdfFiles?: string[];
  errors?: string[];
  error?: string;
}

/**
 * Generate ZPL label content for a single record
 */
export function generateZPLLabel(data: LabelData): string {
  const { assemblyMark, partMark, material, thickness, quantity } = data;

  // ZPL template for 4x2 inch label (400x200 dots at 203 DPI) - Professional style
  const zpl = `^XA
^FX Top section with company header and borders
^CF0,20
^FO20,20^FDASSEMBLY MARK^FS
^CF0,18
^FO20,45^FD${assemblyMark}^FS
^FO20,70^GB360,2,2^FS

^FX Part information section
^CF0,20
^FO20,80^FDPART MARK^FS
^CF0,18
^FO20,105^FD${partMark}^FS
^FO20,130^GB360,2,2^FS

^FX Material and specifications section
^CF0,20
^FO20,140^FDMATERIAL^FS
^CF0,18
^FO20,165^FD${material}^FS
^FO20,190^GB360,2,2^FS

^FX Bottom section with thickness and quantity
^CF0,20
^FO20,200^FDTHICKNESS^FS
^CF0,18
^FO20,225^FD${thickness}^FS
^CF0,20
^FO200,200^FDQUANTITY^FS
^CF0,18
^FO200,225^FD${quantity}^FS

^FX Outer border
^FO15,15^GB370,220,3^FS

^XZ`;

  return zpl;
}

/**
 * Generate PDF label for a single record
 */
export function generatePDFLabel(
  data: LabelData,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a 4x2 inch label (288x144 points at 72 DPI)
      const doc = new PDFDocument({
        size: [288, 144], // 4" x 2" label size in points
        margins: { top: 0, bottom: 0, left: 0, right: 0 }, // No margins for label
        autoFirstPage: true, // Let it create the first page automatically
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Set background color (white)
      doc.rect(0, 0, 288, 144).fill("#ffffff");

      // Draw outer border
      doc.rect(2, 2, 284, 140).stroke("#000000");

      // Assembly Mark section
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("ASSEMBLY MARK", 8, 8);
      doc.font("Helvetica").fontSize(11).text(data.assemblyMark, 8, 20);

      // Draw separator line
      doc.moveTo(8, 30).lineTo(280, 30).stroke("#000000");

      // Part Mark section
      doc.font("Helvetica-Bold").fontSize(9).text("PART MARK", 8, 38);
      doc.font("Helvetica").fontSize(11).text(data.partMark, 8, 50);

      // Draw separator line
      doc.moveTo(8, 60).lineTo(280, 60).stroke("#000000");

      // Material section
      doc.font("Helvetica-Bold").fontSize(9).text("MATERIAL", 8, 68);
      doc.font("Helvetica").fontSize(11).text(data.material, 8, 80);

      // Draw separator line
      doc.moveTo(8, 90).lineTo(280, 90).stroke("#000000");

      // Thickness and Quantity side by side
      doc.font("Helvetica-Bold").fontSize(9).text("THICKNESS", 8, 98);
      doc.font("Helvetica").fontSize(11).text(data.thickness, 8, 110);

      doc.font("Helvetica-Bold").fontSize(9).text("QUANTITY", 150, 98);
      doc
        .font("Helvetica")
        .fontSize(11)
        .text(data.quantity.toString(), 150, 110);

      doc.end();

      stream.on("finish", () => {
        resolve();
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate label for a single CSV record
 */
export async function generateSingleLabel(
  csvData: CsvData,
  outputDir: string = "./uploads/labels"
): Promise<LabelResult> {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const labelData: LabelData = {
      assemblyMark: csvData.assembly_mark,
      partMark: csvData.part_mark,
      material: csvData.material,
      thickness: csvData.thickness,
      quantity: csvData.quantity || 1,
    };

    // Generate ZPL content
    const zplContent = generateZPLLabel(labelData);

    // Generate PDF file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const pdfFileName = `label_${csvData.id || "unknown"}_${timestamp}.pdf`;
    const pdfPath = path.join(outputDir, pdfFileName);

    await generatePDFLabel(labelData, pdfPath);

    return {
      success: true,
      zplContent,
      pdfPath,
    };
  } catch (error) {
    console.error("Error generating single label:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate labels for multiple CSV records (bulk)
 */
export async function generateBulkLabels(
  csvDataArray: CsvData[],
  outputDir: string = "./uploads/labels"
): Promise<BulkLabelResult> {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const zplFiles: string[] = [];
    const pdfFiles: string[] = [];
    const errors: string[] = [];

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    for (let i = 0; i < csvDataArray.length; i++) {
      const csvData = csvDataArray[i];

      try {
        const labelData: LabelData = {
          assemblyMark: csvData.assembly_mark,
          partMark: csvData.part_mark,
          material: csvData.material,
          thickness: csvData.thickness,
          quantity: csvData.quantity || 1,
        };

        // Generate ZPL content
        const zplContent = generateZPLLabel(labelData);
        const zplFileName = `label_${csvData.id || i}_${timestamp}.zpl`;
        const zplPath = path.join(outputDir, zplFileName);

        fs.writeFileSync(zplPath, zplContent);
        zplFiles.push(zplPath);

        // Generate PDF file
        const pdfFileName = `label_${csvData.id || i}_${timestamp}.pdf`;
        const pdfPath = path.join(outputDir, pdfFileName);

        await generatePDFLabel(labelData, pdfPath);
        pdfFiles.push(pdfPath);
      } catch (error) {
        const errorMsg = `Error processing record ${csvData.id || i}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      zplFiles,
      pdfFiles,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error generating bulk labels:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Convert CSV data to label data format
 */
export function csvDataToLabelData(csvData: CsvData): LabelData {
  return {
    assemblyMark: csvData.assembly_mark,
    partMark: csvData.part_mark,
    material: csvData.material,
    thickness: csvData.thickness,
    quantity: csvData.quantity || 1,
  };
}
