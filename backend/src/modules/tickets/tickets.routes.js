import { Router } from "express";
import {
  postTicket,
  createTicketValidation,
  getTickets,
  getUserTickets,
  getTicket,
  getTechnicians,
  patchAssignTicket,
  assignTicketValidation,
  patchResolveTicket,
  resolveTicketValidation,
  patchMarkInReview,
  patchReopenTicket,
  reopenTicketValidation,
  getComments,
  postComment,
  commentValidation,
  getHistory,
  patchDismissTicket,
  dismissTicketValidation,
} from "./tickets.controller.js";
import { authenticate, isAdmin } from "../../middlewares/auth.middleware.js";


const router = Router();

// ─── PÚBLICAS (sistema ADI) ───────────────────────────────────────────────────

// POST   /api/tickets                        Crear ticket desde ADI
router.post("/", createTicketValidation, postTicket);

// GET    /api/tickets/user/:adi_user_id      Tickets de un usuario ADI
router.get("/user/:adi_user_id", getUserTickets);

// ─── PROTEGIDAS (admin + técnico) ────────────────────────────────────────────

// GET    /api/tickets/technicians            Lista técnicos activos (admin)
router.get("/technicians", authenticate, isAdmin, getTechnicians);

// GET    /api/tickets                        Admin → todos | Técnico → suyos
router.get("/", authenticate, getTickets);

// GET    /api/tickets/:id                    Detalle (admin cualquiera, técnico solo el suyo)
router.get("/:id", authenticate, getTicket);

// ─── ACCIONES DE CICLO DE VIDA ────────────────────────────────────────────────

// PATCH  /api/tickets/:id/assign             Asignar prioridad + técnico (admin)
router.patch("/:id/assign", authenticate, isAdmin, assignTicketValidation, patchAssignTicket);

// PATCH  /api/tickets/:id/resolve            Resolver con nota (técnico asignado)
router.patch("/:id/resolve", authenticate, resolveTicketValidation, patchResolveTicket);

// PATCH  /api/tickets/:id/review             Marcar En Revisión (admin)
router.patch("/:id/review", authenticate, isAdmin, patchMarkInReview);

// PATCH  /api/tickets/:id/reopen             Reabrir y reasignar (admin)
router.patch("/:id/reopen", authenticate, isAdmin, reopenTicketValidation, patchReopenTicket);

// ─── DESESTIMAR ─────────────────────────────────────────────────────────────

// PATCH  /api/tickets/:id/dismiss            Admin desestima el ticket
router.patch("/:id/dismiss", authenticate, isAdmin, dismissTicketValidation, patchDismissTicket);

// ─── COMENTARIOS ──────────────────────────────────────────────────────────────

// GET    /api/tickets/:id/comments           Leer comentarios (admin + técnico asignado)
router.get("/:id/comments", authenticate, getComments);

// POST   /api/tickets/:id/comments           Agregar comentario (admin + técnico asignado)
router.post("/:id/comments", authenticate, commentValidation, postComment);

// ─── HISTORIAL / AUDITORÍA ───────────────────────────────────────────────────

// GET    /api/tickets/:id/history            Ver historial de cambios (admin + técnico asignado)
router.get("/:id/history", authenticate, getHistory);

export default router;