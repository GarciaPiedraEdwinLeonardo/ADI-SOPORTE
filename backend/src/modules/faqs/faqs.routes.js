import { Router } from 'express'
import { getFaqs, getFaqsByAreaId } from './faqs.controller.js'

const router = Router()

// GET /api/faqs
router.get('/', getFaqs)

// GET /api/faqs/area/:area_id
router.get('/area/:area_id', getFaqsByAreaId)


export default router