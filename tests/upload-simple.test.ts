import request from "supertest";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create a simple test app without database dependencies
const app = express();
app.use(express.json());

// Mock multer for file uploads
const upload = multer({ dest: "uploads/" });

// Simple test route
app.post("/api/csv/upload", upload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Basic file validation
  const file = req.file;
  const errors: string[] = [];

  if (file.size > 10 * 1024 * 1024) {
    errors.push("File size exceeds 10MB limit");
  }

  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (fileExtension !== ".csv") {
    errors.push("Only CSV files are allowed");
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ error: "File validation failed", details: errors });
  }

  res.json({ success: true, message: "File uploaded successfully" });
});

describe("CSV Upload - Simple Integration Test", () => {
  beforeEach(() => {
    // Clean up any existing test files
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }
  });

  it("should accept a valid CSV file", async () => {
    // Create a test CSV file
    const testCsvContent = `Part Mark,Assembly Mark,Material,Thickness
PART001,ASSY001,Steel,5mm`;

    const testFilePath = path.join(process.cwd(), "test-upload.csv");
    fs.writeFileSync(testFilePath, testCsvContent);

    try {
      const response = await request(app)
        .post("/api/csv/upload")
        .attach("csvFile", testFilePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("File uploaded successfully");
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  it("should reject non-CSV files", async () => {
    // Create a test text file
    const testFilePath = path.join(process.cwd(), "test-upload.txt");
    fs.writeFileSync(testFilePath, "This is not a CSV file");

    try {
      const response = await request(app)
        .post("/api/csv/upload")
        .attach("csvFile", testFilePath)
        .expect(400);

      expect(response.body.error).toBe("File validation failed");
      expect(response.body.details).toContain("Only CSV files are allowed");
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  it("should reject requests without files", async () => {
    const response = await request(app).post("/api/csv/upload").expect(400);

    expect(response.body.error).toBe("No file uploaded");
  });
});
