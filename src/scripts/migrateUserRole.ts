import { initDatabase, getDatabase } from "../database/init";

async function migrateUserRole() {
  try {
    console.log("🔄 Starting user role migration...");

    // Initialize database
    initDatabase();
    const db = getDatabase();

    // Check if role column exists
    const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasRoleColumn = tableInfo.some((col) => col.name === "role");

    if (!hasRoleColumn) {
      console.log("📝 Adding role column to users table...");

      // Add role column with default value 'user'
      db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");

      // Update existing users to have 'user' role (this should already be set by DEFAULT)
      db.exec("UPDATE users SET role = 'user' WHERE role IS NULL");

      // Set the first user (admin) to have admin role
      const adminUser = db
        .prepare("SELECT id FROM users WHERE email = 'admin@shopfloor.com'")
        .get() as { id: number };
      if (adminUser) {
        db.exec(`UPDATE users SET role = 'admin' WHERE id = ${adminUser.id}`);
        console.log(`✅ Set admin user (ID: ${adminUser.id}) to admin role`);
      } else {
        // If no admin user exists, set the first user to admin
        const firstUser = db
          .prepare("SELECT id FROM users ORDER BY id LIMIT 1")
          .get() as { id: number };
        if (firstUser) {
          db.exec(`UPDATE users SET role = 'admin' WHERE id = ${firstUser.id}`);
          console.log(`✅ Set first user (ID: ${firstUser.id}) to admin role`);
        }
      }

      console.log("✅ User role migration completed successfully!");
    } else {
      console.log("✅ Role column already exists in users table");
    }
  } catch (error) {
    console.error("❌ Error during user role migration:", error);
  }
}

// Run the migration
migrateUserRole();
