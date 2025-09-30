import request from "supertest";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { csvRoutes } from "../src/routes/csvRoutes";
import { initDatabase, closeDatabase } from "../src/database/init";

// Create test app
const app = express();
app.use(express.json());
app.use("/api/csv", csvRoutes);

describe("CSV Upload Integration", () => {
  beforeAll(() => {
    // Initialize test database
    initDatabase();
  });

  afterAll(() => {
    // Clean up database
    closeDatabase();
  });

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

  it("should upload and process a valid CSV file", async () => {
    // Create a test CSV file
    const testCsvContent = `Part Mark,Assembly Mark,Material,Thickness,Quantity,Length,Width,Height,Weight,Notes
PART001,ASSY001,Steel,5mm,10,100,50,25,2.5,Test part 1
PART002,ASSY001,Aluminum,3mm,5,80,40,20,1.2,Test part 2`;

    const testFilePath = path.join(process.cwd(), "test-upload.csv");
    fs.writeFileSync(testFilePath, testCsvContent);

    try {
      const response = await request(app)
        .post("/api/csv/upload")
        .attach("csvFile", testFilePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.validRows).toBe(2);
      expect(response.body.invalidRows).toBe(0);
      expect(response.body.hasErrorFile).toBe(false);
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  it("should reject a CSV file with validation errors", async () => {
    // Create a test CSV file with errors
    const testCsvContent = `Part Mark,Assembly Mark,Material,Thickness,Quantity,Length,Width,Height,Weight,Notes
PART001,ASSY001,Steel,5mm,10,100,50,25,2.5,Valid row
,ASSY002,Aluminum,3mm,5,80,40,20,1.2,Missing part mark
PART003,,Steel,8mm,2,150,75,30,4.8,Missing assembly mark`;

    const testFilePath = path.join(process.cwd(), "test-upload-errors.csv");
    fs.writeFileSync(testFilePath, testCsvContent);

    try {
      const response = await request(app)
        .post("/api/csv/upload")
        .attach("csvFile", testFilePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.validRows).toBe(1);
      expect(response.body.invalidRows).toBe(2);
      expect(response.body.hasErrorFile).toBe(true);
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

      expect(response.body.error).toContain("File validation failed");
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

  it("should retrieve uploaded data", async () => {
    // First upload some data
    const testCsvContent = `Part Mark,Assembly Mark,Material,Thickness,Quantity,Length,Width,Height,Weight,Notes
PART001,ASSY001,Steel,5mm,10,100,50,25,2.5,Test part for retrieval`;

    const testFilePath = path.join(process.cwd(), "test-upload-retrieve.csv");
    fs.writeFileSync(testFilePath, testCsvContent);

    try {
      // Upload the file
      await request(app)
        .post("/api/csv/upload")
        .attach("csvFile", testFilePath)
        .expect(200);

      // Retrieve the data
      const response = await request(app).get("/api/csv/data").expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].part_mark).toBe("PART001");
      expect(response.body.data[0].assembly_mark).toBe("ASSY001");
      expect(response.body.data[0].material).toBe("Steel");
      expect(response.body.total).toBe(1);
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });
});
