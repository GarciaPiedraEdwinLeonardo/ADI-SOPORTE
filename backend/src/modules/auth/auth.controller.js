import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import {
  findUserByEmail,
  createUser,
  updateLastLogin,
  updatePassword,
  updateUserData,
  findUserById,
  getAllUsers,
  getUserById,
  createResetToken,
  findResetToken,
  markTokenUsed,
} from "./auth.queries.js";
import { sendPasswordResetEmail } from "./../../services/email.service.js";
import crypto from "crypto";

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Email inválido")
    .isLength({ min: 8, max: 200 })
    .withMessage("El email debe tener entre 8 y 200 caracteres"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
];

export const createUserValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres"),
  body("apat")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("El apellido paterno debe tener entre 3 y 30 caracteres"),
  body("amat")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("El apellido materno debe tener entre 3 y 30 caracteres"),
  body("email")
    .isEmail()
    .withMessage("Email inválido")
    .isLength({ min: 8, max: 200 })
    .withMessage("El email debe tener entre 8 y 200 caracteres"),
  body("password")
    .isLength({ min: 8, max: 20 })
    .withMessage("La contraseña debe tener entre 8 y 20 caracteres")
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/)
    .withMessage("La contraseña contiene caracteres no permitidos")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe tener al menos una minúscula")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe tener al menos una mayúscula"),
  body("role").isInt({ min: 1 }).withMessage("role es requerido"),
];

// --- LOGIN ---
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, error: "Credenciales inválidas" });
    }

    if (!user.is_active) {
      return res.status(403).json({
        ok: false,
        error: "Cuenta desactivada, contacta al administrador",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ ok: false, error: "Credenciales inválidas" });
    }

    await updateLastLogin(user.id);

    const token = generateToken(user);

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        apat: user.apat,
        amat: user.amat,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// --- CREAR CUENTA (solo admin) ---
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { name, apat, amat, email, password, role } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      name,
      apat,
      amat,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
};

// --- LOGOUT (stateless) ---
export const logout = (req, res) => {
  res.json({
    ok: true,
    message: "Sesión cerrada, elimina el token en el cliente",
  });
};

// --- CAMBIAR CONTRASEÑA (cualquier usuario autenticado) ---
export const changePasswordValidation = [
  body("current_password")
    .notEmpty()
    .withMessage("La contraseña actual es requerida"),
  body("new_password")
    .isLength({ min: 8, max: 20 })
    .withMessage("La contraseña debe tener entre 8 y 20 caracteres")
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/)
    .withMessage("La contraseña contiene caracteres no permitidos")
    .matches(/[a-z]/)
    .withMessage("Debe tener al menos una minúscula")
    .matches(/[A-Z]/)
    .withMessage("Debe tener al menos una mayúscula"),
  body("confirm_password")
    .notEmpty()
    .withMessage("Confirma la nueva contraseña"),
];

export const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { current_password, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      return res
        .status(400)
        .json({ ok: false, error: "Las contraseñas no coinciden" });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, error: "Usuario no encontrado" });
    }

    // Verificar contraseña actual — necesitamos el password del usuario
    const userWithPassword = await findUserByEmail(user.email);
    const passwordMatch = await bcrypt.compare(
      current_password,
      userWithPassword.password,
    );
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ ok: false, error: "La contraseña actual es incorrecta" });
    }

    if (new_password === current_password) {
      return res.status(400).json({
        ok: false,
        error: "La nueva contraseña no puede ser igual a la actual",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await updatePassword(req.user.id, hashedPassword);

    res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    next(err);
  }
};

// --- EDITAR DATOS DE TÉCNICO (solo admin) ---
export const updateUserValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("El nombre debe tener entre 2 y 80 caracteres"),
  body("apat")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("El apellido paterno debe tener entre 3 y 30 caracteres"),
  body("amat")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("El apellido materno debe tener entre 3 y 30 caracteres"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Email inválido")
    .isLength({ min: 8, max: 200 })
    .withMessage("El email debe tener entre 8 y 200 caracteres"),
  body("role")
    .optional()
    .isInt({ min: 1 })
    .withMessage("role debe ser un número válido"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active debe ser true o false"),
];

export const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { id } = req.params;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ ok: false, error: "id debe ser un número" });
    }

    const user = await findUserById(id);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, error: "Usuario no encontrado" });
    }

    // Si viene email nuevo, verificar que no esté en uso
    if (req.body.email && req.body.email !== user.email) {
      const existing = await findUserByEmail(req.body.email);
      if (existing) {
        return res
          .status(409)
          .json({ ok: false, error: "El email ya está registrado" });
      }
    }

    // Solo actualizar los campos que vienen en el body
    const allowedFields = [
      "name",
      "apat",
      "amat",
      "email",
      "role",
      "is_active",
    ];
    const fields = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }

    if (!Object.keys(fields).length) {
      return res
        .status(400)
        .json({ ok: false, error: "No se enviaron campos para actualizar" });
    }

    const updated = await updateUserData(id, fields);

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// --- LISTA DE TÉCNICOS (solo admin) ---
export const getUsers = async (req, res, next) => {
  try {
    const data = await getAllUsers();

    if (!data.length) {
      return res
        .status(404)
        .json({ ok: false, error: "No se encontraron usuarios" });
    }

    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

// --- DETALLE DE UN TÉCNICO (solo admin) ---
export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ ok: false, error: "id debe ser un número" });
    }

    const data = await getUserById(id);

    if (!data) {
      return res
        .status(404)
        .json({ ok: false, error: "Usuario no encontrado" });
    }

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Email inválido")
    .isLength({ min: 8, max: 200 })
    .withMessage("El email debe tener entre 8 y 200 caracteres"),
];

/**
 * POST /api/auth/forgot-password
 * Pública — no requiere autenticación.
 *
 * Siempre responde con el mismo mensaje 200 para no revelar
 * si el email existe o no (protección contra enumeración).
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { email } = req.body;

    // Respuesta genérica — no revelar si el usuario existe
    const genericOk = () =>
      res.json({
        ok: true,
        message:
          "Si el correo está registrado, recibirás las instrucciones en breve.",
      });

    const user = await findUserByEmail(email);
    if (!user || !user.is_active) return genericOk();

    // Token aleatorio de 32 bytes → 64 chars hex
    const token = crypto.randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1 hora

    await createResetToken(user.id, token, expires_at);

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token,
    });

    return genericOk();
  } catch (err) {
    next(err);
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

export const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token requerido"),
  body("new_password")
    .isLength({ min: 8, max: 20 })
    .withMessage("La contraseña debe tener entre 8 y 20 caracteres")
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/)
    .withMessage("La contraseña contiene caracteres no permitidos")
    .matches(/[a-z]/)
    .withMessage("Debe tener al menos una minúscula")
    .matches(/[A-Z]/)
    .withMessage("Debe tener al menos una mayúscula"),
  body("confirm_password")
    .notEmpty()
    .withMessage("Confirma la nueva contraseña"),
];

/**
 * POST /api/auth/reset-password
 * Pública — consume el token generado en forgot-password.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { token, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      return res
        .status(400)
        .json({ ok: false, error: "Las contraseñas no coinciden" });
    }

    const record = await findResetToken(token);

    if (!record) {
      return res.status(400).json({ ok: false, error: "Token inválido" });
    }
    if (record.used) {
      return res
        .status(400)
        .json({ ok: false, error: "El token ya fue utilizado" });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ ok: false, error: "El token ha expirado" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await updatePassword(record.user_id, hashedPassword);
    await markTokenUsed(record.id);

    res.json({ ok: true, message: "Contraseña restablecida correctamente" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/validate-reset-token?token=xxx
 * Pública — solo verifica si el token es válido sin consumirlo.
 */
export const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ ok: false, error: "Token requerido" });
    }

    const record = await findResetToken(token);

    if (!record) {
      return res
        .status(400)
        .json({ ok: false, error: "El enlace es inválido o ya fue utilizado" });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "El enlace ha expirado. Solicita uno nuevo.",
        });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
