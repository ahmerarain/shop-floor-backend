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
} from "../controllers/csvController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload and process CSV
router.post("/upload", upload.single("csvFile"), uploadCsv);

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

// Clear all data from database
router.delete("/data/clear", clearAllData);

export { router as csvRoutes };
