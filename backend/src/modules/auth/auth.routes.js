import { Router } from "express";
import {
  login,
  loginValidation,
  register,
  createUserValidation,
  logout,
  changePassword,
  changePasswordValidation,
  updateUser,
  updateUserValidation,
  getUsers,
  getUser,
  forgotPassword,
  forgotPasswordValidation,
  resetPassword,
  resetPasswordValidation,
  validateResetToken,
} from "./auth.controller.js";
import { authenticate, isAdmin } from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /api/auth/login
router.post("/login", loginValidation, login);

// POST /api/auth/register — solo admin
router.post("/register", authenticate, isAdmin, createUserValidation, register);

// POST /api/auth/logout — cualquier usuario autenticado
router.post("/logout", authenticate, logout);

// PUT /api/auth/change-password — cualquier usuario autenticado
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  changePassword,
);

// GET /api/auth/users — lista de técnicos (solo admin)
router.get("/users", authenticate, isAdmin, getUsers);

// GET /api/auth/users/:id — detalle de un técnico (solo admin)
router.get("/users/:id", authenticate, isAdmin, getUser);

// PUT /api/auth/users/:id — solo admin
router.put(
  "/users/:id",
  authenticate,
  isAdmin,
  updateUserValidation,
  updateUser,
);

// POST /api/auth/forgot-password — cualquier usuario
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);

// POST /api/auth/reset-password — cualquier usuario con token válido
router.post("/reset-password", resetPasswordValidation, resetPassword);

// GET /api/auth/validate-reset-token  — pública
router.get("/validate-reset-token", validateResetToken);

export default router;
