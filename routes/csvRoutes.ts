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
import { validateUploadedFile } from "../utils/fileValidation";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload and process CSV with file validation
router.post(
  "/upload",
  upload.single("csvFile"),
  validateUploadedFile,
  uploadCsv
);

// Get all data with pagination and search
router.get("/data", getData);

// Update row
router.put("/data/:id", updateData);

// Export CSV
router.get("/export", exportCsv);

// Download error CSV
router.get("/error", downloadErrorCsv);

// Check if error file exists
router.get("/error/check", checkErrorFile);

// Delete specific records by IDs

router.delete("/data", deleteData);
router.delete("/:id", deleteById);

// Clear all data from database
router.delete("/data/clear", clearAllData);

export { router as csvRoutes };
