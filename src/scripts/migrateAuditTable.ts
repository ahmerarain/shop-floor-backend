import { initDatabase, getDatabase } from "../database/init";

async function migrateAuditTable() {
  try {
    // Initialize database first
    initDatabase();
    const db = getDatabase();

    console.log("🔄 Starting audit table migration...");

    // Check if the old 'user' column exists
    const tableInfo = db.prepare("PRAGMA table_info(audit_log)").all() as any[];
    const hasUserColumn = tableInfo.some((col) => col.name === "user");
    const hasUserIdColumn = tableInfo.some((col) => col.name === "user_id");

    if (hasUserColumn && !hasUserIdColumn) {
      console.log("📝 Found old 'user' column, migrating to 'user_id'...");

      // Add user_id column
      db.exec("ALTER TABLE audit_log ADD COLUMN user_id INTEGER");

      // Get the default admin user ID (assuming it's the first user)
      const adminUser = db
        .prepare("SELECT id FROM users WHERE email = 'admin@shopfloor.com'")
        .get() as { id: number };

      if (adminUser) {
        // Update existing records to use admin user ID
        db.exec(
          `UPDATE audit_log SET user_id = ${adminUser.id} WHERE user_id IS NULL`
        );
        console.log(
          `✅ Updated existing audit records to use admin user ID: ${adminUser.id}`
        );
      } else {
        // If no admin user exists, set user_id to 1 (assuming it will be created)
        db.exec("UPDATE audit_log SET user_id = 1 WHERE user_id IS NULL");
        console.log(
          "⚠️  No admin user found, set user_id to 1 for existing records"
        );
      }

      // Drop the old user column
      // Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
      console.log("🔄 Recreating audit_log table...");

      // Create new table with correct structure
      db.exec(`
        CREATE TABLE audit_log_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          row_id INTEGER,
          diff TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      // Copy data from old table to new table
      db.exec(`
        INSERT INTO audit_log_new (id, timestamp, user_id, action, row_id, diff, created_at)
        SELECT id, timestamp, user_id, action, row_id, diff, created_at
        FROM audit_log
      `);

      // Drop old table and rename new table
      db.exec("DROP TABLE audit_log");
      db.exec("ALTER TABLE audit_log_new RENAME TO audit_log");

      // Recreate indexes
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)"
      );
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)"
      );
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_audit_row_id ON audit_log(row_id)"
      );
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id)"
      );

      console.log("✅ Audit table migration completed successfully!");
    } else if (hasUserIdColumn) {
      console.log(
        "✅ Audit table already has user_id column, no migration needed"
      );
    } else {
      console.log(
        "❌ Neither 'user' nor 'user_id' column found in audit_log table"
      );
    }
  } catch (error) {
    console.error("❌ Error during audit table migration:", error);
  }
}

// Run the migration
migrateAuditTable();
