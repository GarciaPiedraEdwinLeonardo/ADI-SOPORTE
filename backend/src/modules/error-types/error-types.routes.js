import { Router } from 'express'
import { getErrorTypes } from './error-types.controller.js'

const router = Router()

// GET /api/error-types/area/:area_id
router.get('/area/:area_id', getErrorTypes)

export default router