import { Router } from "express";
import {
  createUserHandler,
  getUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/userController";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../middleware/validation";

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// All user management routes require admin access
router.use(requireAdmin);

// POST /api/users - Create a new user (Admin only)
router.post("/", validateCreateUser, createUserHandler);

// GET /api/users - Get all users with pagination and search (Admin only)
router.get("/", getUsersHandler);

// GET /api/users/:id - Get user by ID (Admin only)
router.get("/:id", getUserByIdHandler);

// PUT /api/users/:id - Update user (Admin only)
router.put("/:id", validateUpdateUser, updateUserHandler);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete("/:id", deleteUserHandler);

export { router as userRoutes };
