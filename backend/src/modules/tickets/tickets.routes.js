import { Router } from "express";
import {
  postTicket,
  createTicketValidation,
  getUserTickets,
  getUserTicketDetail,
  getTickets,
  getTicket
} from "./tickets.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /api/tickets
router.post("/", createTicketValidation, postTicket);

// GET /api/tickets/user/:adi_user_id
router.get("/user/:adi_user_id", getUserTickets);

// GET /api/tickets/user/:adi_user_id/:ticket_id
router.get("/user/:adi_user_id/:ticket_id", getUserTicketDetail);

router.get("/", authenticate, getTickets);
router.get("/:id", authenticate, getTicket);

export default router;
