import bcrypt from "bcryptjs";
import { initDatabase, getDatabase } from "../database/init";

async function createDefaultUser() {
  try {
    // Initialize database first
    initDatabase();
    const db = getDatabase();

    // Check if any users already exist
    const existingUsers = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    if (existingUsers.count > 0) {
      console.log(
        "Users already exist in the database. Skipping default user creation."
      );
      return;
    }

    // Default admin user credentials
    const defaultUser = {
      first_name: "Admin",
      last_name: "User",
      email: "admin@shopfloor.com",
      password: "Admin123!",
      is_active: true,
    };

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(defaultUser.password, saltRounds);

    // Insert default user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = db
      .prepare(insertQuery)
      .run(
        defaultUser.first_name,
        defaultUser.last_name,
        defaultUser.email,
        hashedPassword,
        defaultUser.is_active ? 1 : 0
      );

    console.log("✅ Default admin user created successfully!");
    console.log("📧 Email:", defaultUser.email);
    console.log("🔑 Password:", defaultUser.password);
    console.log("⚠️  Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error creating default user:", error);
  }
}

// Run the script
createDefaultUser();
