import { Router } from 'express'
import { getFaqs, getFaqsByAreaId, getAreas } from './faqs.controller.js'

const router = Router()

// GET /api/faqs
router.get('/', getFaqs)

// GET /api/faqs/area/:area_id
router.get('/area/:area_id', getFaqsByAreaId)

// GET /api/areas
router.get('/areas', getAreas)

export default router