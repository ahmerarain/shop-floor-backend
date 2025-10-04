import { Router } from "express";
import {
  generateLabelById,
  generatePDFLabelById,
  generateBulkLabelsEndpoint,
  downloadZPLFile,
  downloadPDFFile,
} from "../controllers/labelController";

const router = Router();

// Generate ZPL label for single record
router.get("/:id/zpl", generateLabelById);

// Generate PDF label for single record
router.get("/:id/pdf", generatePDFLabelById);

// Download ZPL file for single record
router.get("/:id/download/zpl", downloadZPLFile);

// Download PDF file for single record
router.get("/:id/download/pdf", downloadPDFFile);

// Generate labels for multiple records (bulk)
router.post("/bulk", generateBulkLabelsEndpoint);

export default router;
