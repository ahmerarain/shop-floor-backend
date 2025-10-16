import bcrypt from "bcryptjs";
import { initDatabase, getDatabase } from "../database/init";

interface CreateUserArgs {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive?: boolean;
}

async function createUser(args: CreateUserArgs) {
  try {
    // Initialize database first
    initDatabase();
    const db = getDatabase();

    // Check if user with email already exists
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(args.email);

    if (existingUser) {
      console.log("❌ User with this email already exists:", args.email);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(args.password, saltRounds);

    // Insert user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = db
      .prepare(insertQuery)
      .run(
        args.firstName,
        args.lastName,
        args.email,
        hashedPassword,
        args.isActive !== undefined ? (args.isActive ? 1 : 0) : 1
      );

    console.log("✅ User created successfully!");
    console.log("👤 Name:", `${args.firstName} ${args.lastName}`);
    console.log("📧 Email:", args.email);
    console.log("🔑 Password:", args.password);
    console.log("✅ Active:", args.isActive !== false);
  } catch (error) {
    console.error("❌ Error creating user:", error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log(
    "Usage: npm run create-user <firstName> <lastName> <email> <password> [isActive]"
  );
  console.log(
    "Example: npm run create-user John Doe john@example.com MyPass123! true"
  );
  process.exit(1);
}

const [firstName, lastName, email, password, isActiveStr] = args;
const isActive = isActiveStr ? isActiveStr.toLowerCase() === "true" : true;

createUser({
  firstName,
  lastName,
  email,
  password,
  isActive,
});

