import { Request, Response } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../services/userService";
import { CreateUserRequest, UpdateUserRequest } from "../types/user";

// Create a new user
export async function createUserHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userData: CreateUserRequest = req.body;
    const result = await createUser(userData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: result.user,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

// Get all users with pagination and search
export function getUsersHandler(req: Request, res: Response): void {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const result = getUsers(search as string, Number(page), Number(limit));

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get users",
    });
  }
}

// Get user by ID
export function getUserByIdHandler(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    const user = getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
}

// Update user
export function updateUserHandler(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    const userData: UpdateUserRequest = req.body;
    const result = updateUser(userId, userData);

    if (result.success) {
      res.json({
        success: true,
        message: "User updated successfully",
        user: result.user,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
}

// Delete user
export function deleteUserHandler(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
      return;
    }

    const result = deleteUser(userId);

    if (result.success) {
      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
}
