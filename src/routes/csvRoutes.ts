import express from "express";
import multer from "multer";
import {
  uploadCsv,
  getData,
  updateData,
  exportCsv,
  downloadErrorCsv,
  checkErrorFile,
  deleteData,
  clearAllData,
  deleteById,
} from "../controllers/csvController";
import { getAuditLogsEndpoint } from "../controllers/auditController";
import {
  exportInvalidRows,
  exportEditedRows,
  getInvalidRowsCount,
  getEditedRowsCount,
} from "../controllers/exceptionController";
import { validateUploadedFile } from "../utils/fileValidation";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload and process CSV with file validation (requires authentication)
router.post(
  "/upload",
  authenticateToken,
  upload.single("csvFile"),
  validateUploadedFile,
  uploadCsv
);

// Get all data with pagination and search (requires authentication)
router.get("/data", authenticateToken, getData);

// Update row (requires authentication)
router.put("/data/:id", authenticateToken, updateData);

// Export CSV (requires authentication)
router.get("/export", authenticateToken, exportCsv);

// Download error CSV (requires authentication)
router.get("/error", authenticateToken, downloadErrorCsv);

// Check if error file exists (requires authentication)
router.get("/error/check", authenticateToken, checkErrorFile);

// Delete specific records by IDs (requires authentication)
router.delete("/data", authenticateToken, deleteData);
router.delete("/:id", authenticateToken, deleteById);

// Clear all data from database (requires authentication)
router.delete("/data/clear", authenticateToken, clearAllData);

// Get audit logs (requires authentication)
router.get("/audit", authenticateToken, getAuditLogsEndpoint);

// Exception exports
router.get("/exceptions/invalid", exportInvalidRows);
router.get("/exceptions/edited", exportEditedRows);
router.get("/exceptions/invalid/count", getInvalidRowsCount);
router.get("/exceptions/edited/count", getEditedRowsCount);

export { router as csvRoutes };
