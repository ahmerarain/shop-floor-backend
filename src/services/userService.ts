import bcrypt from "bcryptjs";
import { getDatabase } from "../database/init";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  PaginatedUsersResult,
} from "../types/user";
import { sendUserCredentials } from "./emailService";

// Helper function to convert User to UserResponse (excludes password)
function userToResponse(user: User): UserResponse {
  const { password, ...userResponse } = user;
  // Convert SQLite integer boolean to actual boolean
  return {
    ...userResponse,
    is_active: Boolean(userResponse.is_active),
  } as UserResponse;
}

// Create a new user
export async function createUser(userData: CreateUserRequest): Promise<{
  success: boolean;
  user?: UserResponse;
  error?: string;
}> {
  try {
    const db = getDatabase();

    // Check if user with email already exists
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(userData.email);
    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Insert user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = db
      .prepare(insertQuery)
      .run(
        userData.first_name,
        userData.last_name,
        userData.email,
        hashedPassword,
        userData.is_active !== undefined ? (userData.is_active ? 1 : 0) : 1
      );

    // Get the created user
    const newUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(result.lastInsertRowid) as any;

    // Send email with credentials if requested
    if (userData.send_email) {
      await sendUserCredentials({
        email: userData.email,
        password: userData.password, // Send original password, not hashed
        first_name: userData.first_name,
        last_name: userData.last_name,
      });
    }

    return {
      success: true,
      user: userToResponse(newUser),
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: "Failed to create user",
    };
  }
}

// Get all users with pagination
export function getUsers(
  search?: string,
  page: number = 1,
  limit: number = 100
): PaginatedUsersResult {
  try {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM users";
    let params: any[] = [];

    if (search) {
      query += " WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?";
      const searchTerm = `%${search}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params) as any[];

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM users";
    let countParams: any[] = [];

    if (search) {
      countQuery +=
        " WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?";
      const searchTerm = `%${search}%`;
      countParams = [searchTerm, searchTerm, searchTerm];
    }

    const total = db.prepare(countQuery).get(...countParams) as {
      total: number;
    };

    return {
      data: rows.map(userToResponse),
      total: total.total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Failed to get users");
  }
}

// Get user by ID
export function getUserById(id: number): UserResponse | null {
  try {
    const db = getDatabase();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;

    if (!user) {
      return null;
    }

    return userToResponse(user);
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw new Error("Failed to get user");
  }
}

// Get user by email
export function getUserByEmail(email: string): User | null {
  try {
    const db = getDatabase();
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as any;
    return user;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error("Failed to get user");
  }
}

// Update user
export function updateUser(
  id: number,
  userData: UpdateUserRequest
): {
  success: boolean;
  user?: UserResponse;
  error?: string;
} {
  try {
    const db = getDatabase();

    // Check if user exists
    const existingUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as any;
    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if email is being changed and if it already exists
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = db
        .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
        .get(userData.email, id);
      if (emailExists) {
        return {
          success: false,
          error: "Email already exists",
        };
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (userData.first_name !== undefined) {
      updateFields.push("first_name = ?");
      updateValues.push(userData.first_name);
    }
    if (userData.last_name !== undefined) {
      updateFields.push("last_name = ?");
      updateValues.push(userData.last_name);
    }
    if (userData.email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(userData.email);
    }
    if (userData.is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(userData.is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return {
        success: false,
        error: "No fields to update",
      };
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(id);

    const updateQuery = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    const result = db.prepare(updateQuery).run(...updateValues);

    if (result.changes === 0) {
      return {
        success: false,
        error: "No changes made",
      };
    }

    // Get updated user
    const updatedUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as any;

    return {
      success: true,
      user: userToResponse(updatedUser),
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: "Failed to update user",
    };
  }
}

// Delete user
export function deleteUser(id: number): {
  success: boolean;
  error?: string;
} {
  try {
    const db = getDatabase();

    // Check if user exists
    const existingUser = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(id);
    if (!existingUser) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Delete user (cascade will handle password_reset_tokens)
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);

    if (result.changes === 0) {
      return {
        success: false,
        error: "Failed to delete user",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: "Failed to delete user",
    };
  }
}

// Verify password
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

// Update user password
export async function updateUserPassword(
  id: number,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const db = getDatabase();

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const result = db
      .prepare(
        "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(hashedPassword, id);

    if (result.changes === 0) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      error: "Failed to update password",
    };
  }
}
