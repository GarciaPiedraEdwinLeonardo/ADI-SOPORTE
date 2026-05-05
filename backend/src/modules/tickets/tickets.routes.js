import { Router } from 'express'
import { postTicket, createTicketValidation } from './tickets.controller.js'

const router = Router()

// POST /api/tickets
router.post('/', createTicketValidation, postTicket)

export default router