import { Router } from "express";
import {
  postTicket,
  createTicketValidation,
  getUserTickets,
  getUserTicketDetail,
} from "./tickets.controller.js";

const router = Router();

// POST /api/tickets
router.post("/", createTicketValidation, postTicket);

// GET /api/tickets/user/:adi_user_id
router.get("/user/:adi_user_id", getUserTickets);

// GET /api/tickets/user/:adi_user_id/:ticket_id
router.get("/user/:adi_user_id/:ticket_id", getUserTicketDetail);

export default router;
