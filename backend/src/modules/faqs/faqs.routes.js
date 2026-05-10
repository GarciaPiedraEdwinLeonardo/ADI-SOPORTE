import { Router } from 'express'
import { getFaqs, getFaqsByAreaId, postFaq, putFaq, deleteFaqById } from './faqs.controller.js'
import { authenticate, isAdmin } from '../../middlewares/auth.middleware.js'

const router = Router()

// GET /api/faqs
router.get('/', getFaqs)

// GET /api/faqs/area/:area_id
router.get('/area/:area_id', getFaqsByAreaId)

// POST /api/faqs
router.post('/', authenticate, isAdmin, postFaq)

// PUT /api/faqs/:id
router.put('/:id', authenticate, isAdmin, putFaq)

// DELETE /api/faqs/:id
router.delete('/:id', authenticate, isAdmin, deleteFaqById)

export default router