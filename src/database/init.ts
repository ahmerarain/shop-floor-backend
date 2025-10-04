import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(__dirname, "../data/csv_data.db");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database | null = null;

export function initDatabase(): void {
  try {
    // Create or open database file
    db = new Database(dbPath);

    // Enable WAL mode for better performance
    db.pragma("journal_mode = WAL");

    // Create the main data table
    db.exec(`
      CREATE TABLE IF NOT EXISTS csv_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        part_mark TEXT NOT NULL,
        assembly_mark TEXT NOT NULL,
        material TEXT NOT NULL,
        thickness TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        length REAL,
        width REAL,
        height REAL,
        weight REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_part_mark ON csv_data(part_mark)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_assembly_mark ON csv_data(assembly_mark)
    `);

    // Create audit_log table for tracking CRUD operations
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user TEXT NOT NULL DEFAULT 'system',
        action TEXT NOT NULL,
        row_id INTEGER,
        diff TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for audit_log performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_row_id ON audit_log(row_id)
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

// Function to close database connection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log("Database connection closed");
  }
}

// Function to get database instance
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export { db };
