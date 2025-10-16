import { Router } from "express";
import {
  createUserHandler,
  getUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../middleware/validation";

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// POST /api/users - Create a new user
router.post("/", validateCreateUser, createUserHandler);

// GET /api/users - Get all users with pagination and search
router.get("/", getUsersHandler);

// GET /api/users/:id - Get user by ID
router.get("/:id", getUserByIdHandler);

// PUT /api/users/:id - Update user
router.put("/:id", validateUpdateUser, updateUserHandler);

// DELETE /api/users/:id - Delete user
router.delete("/:id", deleteUserHandler);

export { router as userRoutes };
