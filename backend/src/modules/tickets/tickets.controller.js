import { body, validationResult } from "express-validator";
import {
  createTicket,
  getAllTickets,
  getTicketsByTechnician,
  getTicketById,
  getTicketsByUser,
  countTicketsByUserRolPriority,
  getTicketLimit,
  assignTicket,
  resolveTicket,
  markInReview,
  reopenTicket,
  getCommentsByTicket,
  createComment,
  getHistoryByTicket,
  logHistory,
  getPriorityById,
  getAvailableTechnicians,
  getTechnicianById,
  dismissTicket,
} from "./tickets.queries.js";

// ─── STATUS IDs ───────────────────────────────────────────────────────────────
const STATUS = {
  PENDIENTE:   1,
  ASIGNADO:    2,
  RESUELTO:    3,
  EN_REVISION: 4,
  DESESTIMADO: 5,
};

const STATUS_NAMES = {
  1: "Pendiente",
  2: "Asignado",
  3: "Resuelto",
  4: "En Revisión",
  5: "Desestimado",
};

const PRIORITY_NAMES = {
  1: "Baja",
  2: "Media",
  3: "Alta",
  4: "Urgente",
};

// ─── VALIDACIONES ─────────────────────────────────────────────────────────────

export const createTicketValidation = [
  body("adi_user_id").isInt({ min: 1 }).withMessage("adi_user_id es requerido"),
  body("adi_rol_id").isInt({ min: 1 }).withMessage("adi_rol_id es requerido"),
  body("area_id").isInt({ min: 1 }).withMessage("area_id es requerido"),
  body("error_type_id").isInt({ min: 1 }).withMessage("error_type_id es requerido"),
  body("description")
    .trim()
    .notEmpty().withMessage("La descripción es requerida")
    .isLength({ max: 250 }).withMessage("La descripción no puede superar 250 caracteres"),
  body("evidence_url")
    .optional({ nullable: true })
    .isURL().withMessage("evidence_url debe ser una URL válida"),
];

export const assignTicketValidation = [
  body("priority_id")
    .isInt({ min: 1, max: 4 }).withMessage("priority_id debe ser entre 1 y 4"),
  body("assigned_to")
    .isInt({ min: 1 }).withMessage("assigned_to (id del técnico) es requerido"),
];

export const resolveTicketValidation = [
  body("resolution_note")
    .trim()
    .notEmpty().withMessage("La nota de resolución es requerida")
    .isLength({ max: 200 }).withMessage("La nota no puede superar 200 caracteres"),
];

export const reopenTicketValidation = [
  body("reopen_reason")
    .trim()
    .notEmpty().withMessage("El motivo de reapertura es requerido")
    .isLength({ max: 200 }).withMessage("El motivo no puede superar 200 caracteres"),
];

export const commentValidation = [
  body("message")
    .trim()
    .notEmpty().withMessage("El mensaje no puede estar vacío")
    .isLength({ max: 200 }).withMessage("El mensaje no puede superar 200 caracteres"),
];

// ─── CREAR TICKET (público — viene del sistema ADI) ───────────────────────────

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

// ─── LISTAR TICKETS ───────────────────────────────────────────────────────────

/**
 * GET /api/tickets
 * Admin → todos los tickets.
 * Técnico → solo los asignados a él.
 */
export const getTickets = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    const data =
      role === 1
        ? await getAllTickets()
        : await getTicketsByTechnician(id);

    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tickets/user/:adi_user_id
 * Pública — permite al sistema ADI consultar los tickets de un usuario.
 */
export const getUserTickets = async (req, res, next) => {
  try {
    const { adi_user_id } = req.params;

    if (isNaN(adi_user_id)) {
      return res.status(400).json({ ok: false, error: "adi_user_id debe ser un número" });
    }

    const data = await getTicketsByUser(adi_user_id);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tickets/user/:adi_user_id/:id
 * Pública — detalle de ticket para un usuario ADI.
 */
export const getUserTicket = async (req, res, next) => {
  try {
    const { adi_user_id, id: ticket_id } = req.params;

    if (isNaN(adi_user_id) || isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "IDs deben ser números" });
    }

    const data = await getTicketById(ticket_id);
    if (!data || data.adi_user_id !== Number(adi_user_id)) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tickets/:id
 * Admin → cualquier ticket.
 * Técnico → solo el suyo (verificado por assigned_to).
 */
export const getTicket = async (req, res, next) => {
  try {
    const { id: ticket_id } = req.params;
    const { role, id: user_id } = req.user;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const data = await getTicketById(ticket_id);
    if (!data) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (role !== 1 && data.assigned_to !== user_id) {
      return res.status(403).json({ ok: false, error: "No tienes acceso a este ticket" });
    }

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── TÉCNICOS DISPONIBLES (solo admin) ───────────────────────────────────────

/**
 * GET /api/tickets/technicians
 * Lista de técnicos activos para el select de asignación en el frontend.
 */
export const getTechnicians = async (req, res, next) => {
  try {
    const data = await getAvailableTechnicians();
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

// ─── ASIGNAR TICKET (solo admin) ─────────────────────────────────────────────

/**
 * PATCH /api/tickets/:id/assign
 *
 * Reglas:
 * 1. El ticket debe estar en estado Pendiente (1).
 * 2. Verificar tickets_limits: contar todos los tickets (cualquier estado)
 *    del usuario ADI con ese adi_rol_id y priority_id.
 *    Si supera el max_tickets → rechazar.
 *    Si no hay fila en tickets_limits → sin límite, se permite.
 * 3. Calcular sla_deadline = NOW + sla_hours de la prioridad elegida.
 * 4. Registrar historial de: priority_id, assigned_to, status_id.
 *
 * assigned_by = admin que ejecuta la acción (req.user.id).
 * assigned_to = técnico elegido (body).
 */
export const patchAssignTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { id: ticket_id } = req.params;
    const { priority_id, assigned_to } = req.body;
    const assigned_by = req.user.id; // admin que asigna

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    // 1. Obtener ticket
    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (ticket.status.id !== STATUS.PENDIENTE) {
      return res.status(400).json({
        ok: false,
        error: `Solo se pueden asignar tickets Pendientes. Estado actual: "${ticket.status.name}"`,
      });
    }

    // 2b. Verificar que el tecnico existe y esta activo
    const technician = await getTechnicianById(assigned_to);
    if (!technician) {
      return res.status(404).json({
        ok: false,
        error: "El tecnico seleccionado no existe o no esta activo",
      });
    }

    // 2. Verificar límite de prioridad para el rol del usuario ADI
    const maxTickets = await getTicketLimit(ticket.adi_rol_id, priority_id);

    if (maxTickets !== null) {
      const currentCount = await countTicketsByUserRolPriority(
        ticket.adi_user_id,
        ticket.adi_rol_id,
        priority_id
      );

      if (currentCount >= maxTickets) {
        const priorityName = PRIORITY_NAMES[priority_id] ?? `Prioridad ${priority_id}`;
        return res.status(400).json({
          ok: false,
          error: `El usuario alcanzó el límite de ${maxTickets} ticket(s) con prioridad "${priorityName}" permitidos para su rol.`,
        });
      }
    }

    // 3. Obtener sla_hours de la prioridad
    const priority = await getPriorityById(priority_id);

    // 4. Persistir
    const updated = await assignTicket(ticket_id, {
      priority_id,
      assigned_to,
      assigned_by,       // quién asignó
      sla_hours: priority.sla_hours,
    });

    // 5. Historial
    await Promise.all([
      ...(ticket.priority?.id !== priority_id
        ? [logHistory({
            ticket_id,
            changed_by: assigned_by,
            field_changed: "priority_id",
            old_value: ticket.priority?.name ?? null,
            new_value: priority.name,
          })]
        : []
      ),
      ...(ticket.assigned_to !== assigned_to
        ? [logHistory({
            ticket_id,
            changed_by: assigned_by,
            field_changed: "assigned_to",
            old_value: ticket.assigned_to ?? null,
            new_value: assigned_to,
          })]
        : []
      ),
      logHistory({
        ticket_id,
        changed_by: assigned_by,
        field_changed: "status_id",
        old_value: STATUS_NAMES[ticket.status.id],
        new_value: STATUS_NAMES[STATUS.ASIGNADO],
      }),
    ]);

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── RESOLVER TICKET (solo técnico asignado) ──────────────────────────────────

/**
 * PATCH /api/tickets/:id/resolve
 * El técnico escribe la nota y cambia status a Resuelto (3).
 * El admin luego lo revisa con /review.
 */
export const patchResolveTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { id: ticket_id } = req.params;
    const { resolution_note } = req.body;
    const tech_id = req.user.id;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    // Solo el técnico asignado puede resolver
    if (ticket.assigned_to !== tech_id) {
      return res.status(403).json({
        ok: false,
        error: "Solo el técnico asignado puede resolver este ticket",
      });
    }

    if (ticket.status.id !== STATUS.ASIGNADO) {
      return res.status(400).json({
        ok: false,
        error: `Solo se pueden resolver tickets Asignados. Estado actual: "${ticket.status.name}"`,
      });
    }

    const updated = await resolveTicket(ticket_id, resolution_note);

    await Promise.all([
      logHistory({
        ticket_id,
        changed_by: tech_id,
        field_changed: "status_id",
        old_value: STATUS_NAMES[STATUS.ASIGNADO],
        new_value: STATUS_NAMES[STATUS.EN_REVISION],
      }),
      logHistory({
        ticket_id,
        changed_by: tech_id,
        field_changed: "resolution_note",
        old_value: null,
        new_value: resolution_note,
      }),
    ]);

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── MARCAR EN REVISIÓN (solo admin) ─────────────────────────────────────────

/**
 * PATCH /api/tickets/:id/review
 * Admin confirma que revisó la resolución del técnico → status 4.
 * Desde aquí puede reabrir (/reopen) si no está satisfecho.
 */
export const patchMarkInReview = async (req, res, next) => {
  try {
    const { id: ticket_id } = req.params;
    const admin_id = req.user.id;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (ticket.status.id !== STATUS.EN_REVISION) {
      return res.status(400).json({
        ok: false,
        error: `Solo se pueden aprobar tickets En Revision. Estado actual: "${ticket.status.name}"`,
      });
    }

    const updated = await markInReview(ticket_id);

    await logHistory({
      ticket_id,
      changed_by: admin_id,
      field_changed: "status_id",
      old_value: STATUS_NAMES[STATUS.EN_REVISION],
      new_value: STATUS_NAMES[STATUS.RESUELTO],
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── REABRIR TICKET (solo admin) ──────────────────────────────────────────────

/**
 * PATCH /api/tickets/:id/reopen
 * Admin no aprueba la resolución del técnico.
 * - Se mantiene el mismo técnico asignado (assigned_to no cambia)
 * - Se mantiene la misma prioridad (priority_id no cambia)
 * - Se recalcula sla_deadline desde ahora
 * - Se incrementa reopened_count
 * - reopen_reason se guarda como comentario automático en tickets_comments
 *   y como entrada en tickets_history
 */
export const patchReopenTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { id: ticket_id } = req.params;
    const { reopen_reason } = req.body;
    const assigned_by = req.user.id;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (ticket.status.id !== STATUS.EN_REVISION) {
      return res.status(400).json({
        ok: false,
        error: `Solo se pueden reabrir tickets En Revisión. Estado actual: "${ticket.status.name}"`,
      });
    }

    // Reutilizar el mismo técnico y prioridad del ticket
    const assigned_to = ticket.assigned_to;
    const priority_id = ticket.priority.id;
    const sla_hours   = ticket.priority.sla_hours;

    const updated = await reopenTicket(ticket_id, {
      assigned_to,
      assigned_by,
      sla_hours,
      priority_id,
    });

    // Registrar historial y comentario automático en paralelo
    await Promise.all([
      logHistory({
        ticket_id,
        changed_by: assigned_by,
        field_changed: "status_id",
        old_value: STATUS_NAMES[STATUS.EN_REVISION],
        new_value: STATUS_NAMES[STATUS.ASIGNADO],
      }),
      logHistory({
        ticket_id,
        changed_by: assigned_by,
        field_changed: "reopened_count",
        old_value: ticket.reopened_count ?? 0,
        new_value: (ticket.reopened_count ?? 0) + 1,
      }),
      logHistory({
        ticket_id,
        changed_by: assigned_by,
        field_changed: "reopen_reason",
        old_value: null,
        new_value: reopen_reason,
      }),
      // Comentario automático visible en el hilo admin <-> técnico
      createComment({
        ticket_id,
        author_id: assigned_by,
        message: `[Reapertura #${(ticket.reopened_count ?? 0) + 1}] ${reopen_reason}`,
      }),
    ]);

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── COMENTARIOS ──────────────────────────────────────────────────────────────

/**
 * GET /api/tickets/:id/comments
 * Admin y técnico asignado pueden leer.
 */
export const getComments = async (req, res, next) => {
  try {
    const { id: ticket_id } = req.params;
    const { role, id: user_id } = req.user;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (role !== 1 && ticket.assigned_to !== user_id) {
      return res.status(403).json({
        ok: false,
        error: "No tienes acceso a los comentarios de este ticket",
      });
    }

    const data = await getCommentsByTicket(ticket_id);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tickets/:id/comments
 * Admin y técnico asignado pueden comentar.
 */
export const postComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { id: ticket_id } = req.params;
    const { message } = req.body;
    const { role, id: user_id } = req.user;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (role !== 1 && ticket.assigned_to !== user_id) {
      return res.status(403).json({
        ok: false,
        error: "Solo el admin y el técnico asignado pueden comentar en este ticket",
      });
    }

    const data = await createComment({
      ticket_id,
      author_id: user_id,
      message,
    });

    res.status(201).json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── HISTORIAL ────────────────────────────────────────────────────────────────

/**
 * GET /api/tickets/:id/history
 * Admin y técnico asignado pueden ver la auditoría.
 */
export const getHistory = async (req, res, next) => {
  try {
    const { id: ticket_id } = req.params;
    const { role, id: user_id } = req.user;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (role !== 1 && ticket.assigned_to !== user_id) {
      return res.status(403).json({
        ok: false,
        error: "No tienes acceso al historial de este ticket",
      });
    }

    const data = await getHistoryByTicket(ticket_id);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

// ─── DESESTIMAR TICKET (solo admin) ──────────────────────────────────────────

export const dismissTicketValidation = [
  body("dismiss_reason")
    .trim()
    .notEmpty().withMessage("El motivo de desestimación es requerido")
    .isLength({ max: 200 }).withMessage("El motivo no puede superar 200 caracteres"),
];

/**
 * PATCH /api/tickets/:id/dismiss
 * Admin desestima un ticket, indicando el motivo.
 * Solo se puede desestimar desde estado Pendiente (1).
 * El motivo queda guardado en resolution_note y en el historial.
 */
export const patchDismissTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() });
    }

    const { id: ticket_id } = req.params;
    const { dismiss_reason } = req.body;
    const admin_id = req.user.id;

    if (isNaN(ticket_id)) {
      return res.status(400).json({ ok: false, error: "id debe ser un número" });
    }

    const ticket = await getTicketById(ticket_id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket no encontrado" });
    }

    if (ticket.status.id !== STATUS.PENDIENTE) {
      return res.status(400).json({
        ok: false,
        error: `Solo se pueden desestimar tickets Pendientes. Estado actual: "${ticket.status.name}"`,
      });
    }

    const updated = await dismissTicket(ticket_id, dismiss_reason);

    await logHistory({
      ticket_id,
      changed_by: admin_id,
      field_changed: "status_id",
      old_value: STATUS_NAMES[STATUS.PENDIENTE],
      new_value: STATUS_NAMES[STATUS.DESESTIMADO],
    });

    await logHistory({
      ticket_id,
      changed_by: admin_id,
      field_changed: "dismiss_reason",
      old_value: null,
      new_value: dismiss_reason,
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};