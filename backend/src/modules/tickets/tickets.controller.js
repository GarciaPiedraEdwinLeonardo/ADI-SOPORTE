import { body, validationResult } from "express-validator";
import {
  createTicket,
  getTicketDetailByUser,
  getTicketsByUser,
  getAllTickets,
  getTicketsByTechnician,
  getTicketById,
} from "./tickets.queries.js";

export const createTicketValidation = [
  body("adi_user_id").isInt({ min: 1 }).withMessage("adi_user_id es requerido"),
  body("adi_rol_id").isInt({ min: 1 }).withMessage("adi_rol_id es requerido"),
  body("area_id").isInt({ min: 1 }).withMessage("area_id es requerido"),
  body("error_type_id")
    .isInt({ min: 1 })
    .withMessage("error_type_id es requerido"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isLength({ max: 250 })
    .withMessage("La descripción no puede superar 250 caracteres"),
  body("evidence_url")
    .optional({ nullable: true })
    .isURL()
    .withMessage("evidence_url debe ser una URL válida"),
];

export const postTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const {
      adi_user_id,
      adi_rol_id,
      area_id,
      error_type_id,
      description,
      evidence_url,
    } = req.body;

    const ticket = await createTicket({
      adi_user_id,
      adi_rol_id,
      area_id,
      error_type_id,
      description,
      evidence_url,
    });

    res.status(201).json({ ok: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

export const getUserTickets = async (req, res, next) => {
  try {
    const { adi_user_id } = req.params;

    if (isNaN(adi_user_id)) {
      return res
        .status(400)
        .json({ ok: false, error: "adi_user_id debe ser un número" });
    }

    const data = await getTicketsByUser(adi_user_id);

    if (!data.length) {
      return res
        .status(404)
        .json({
          ok: false,
          error: "No se encontraron tickets para este usuario",
        });
    }

    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const getUserTicketDetail = async (req, res, next) => {
  try {
    const { adi_user_id, ticket_id } = req.params;

    if (isNaN(adi_user_id) || isNaN(ticket_id)) {
      return res
        .status(400)
        .json({ ok: false, error: "Los parámetros deben ser números" });
    }

    const data = await getTicketDetailByUser(ticket_id, adi_user_id);

    if (!data) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

// --- TODOS LOS TICKETS (admin ve todo, técnico solo los suyos) ---
export const getTickets = async (req, res, next) => {
  try {
    const { role, id } = req.user

    const data = role === 1
      ? await getAllTickets()
      : await getTicketsByTechnician(id)

    if (!data.length) {
      return res.status(404).json({ ok: false, error: "No se encontraron tickets" })
    }

    res.json({ ok: true, total: data.length, data })
  } catch (err) {
    next(err)
  }
}

// --- DETALLE DE UN TICKET (admin ve todo, técnico solo los suyos) ---
export const getTicket = async (req, res, next) => {
  try {
    const { id: ticket_id } = req.params
    const { role, id: user_id } = req.user

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" })
    }

    const data = await getTicketById(ticket_id)

    if (!data) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" })
    }

    // Si es técnico, verificar que el ticket le pertenece
    if (role !== 1 && data.assigned_to !== user_id) {
      return res.status(403).json({ ok: false, error: "No tienes acceso a este ticket" })
    }

    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}