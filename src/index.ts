import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { initDatabase, closeDatabase } from "./database/init";
import { csvRoutes } from "./routes/csvRoutes";
import labelRoutes from "./routes/labelRoutes";

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads with size limits
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Check file extension
    const allowedExtensions = [".csv"];
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// Initialize database
initDatabase();

// Error handling for multer file size errors
app.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        details: [`File size exceeds ${10}MB limit`],
        code: "FILE_TOO_LARGE",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files",
        details: ["Only one file is allowed per upload"],
        code: "TOO_MANY_FILES",
      });
    }
  }
  if (error.message === "Only CSV files are allowed") {
    return res.status(400).json({
      error: "Invalid file type",
      details: ["Only CSV files are allowed"],
      code: "INVALID_FILE_TYPE",
    });
  }
  next(error);
});

// Routes
app.use("/api/csv", csvRoutes);
app.use("/api/labels", labelRoutes);

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT. Graceful shutdown...");
  closeDatabase();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Graceful shutdown...");
  closeDatabase();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
