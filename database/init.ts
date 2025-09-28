import initSqlJs from "sql.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../data/csv_data.db");

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: any = null;

export async function initDatabase() {
  try {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    let data: Uint8Array | undefined;
    if (fs.existsSync(dbPath)) {
      data = new Uint8Array(fs.readFileSync(dbPath));
    }

    db = new SQL.Database(data);

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

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

// Function to save database to file
export function saveDatabase() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

export { db };
