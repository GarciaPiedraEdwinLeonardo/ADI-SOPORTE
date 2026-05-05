import { body, validationResult } from 'express-validator'
import { createTicket } from './tickets.queries.js'

export const createTicketValidation = [
  body('adi_user_id').isInt({ min: 1 }).withMessage('adi_user_id es requerido'),
  body('adi_rol_id').isInt({ min: 1 }).withMessage('adi_rol_id es requerido'),
  body('area_id').isInt({ min: 1 }).withMessage('area_id es requerido'),
  body('error_type_id').isInt({ min: 1 }).withMessage('error_type_id es requerido'),
  body('description')
    .trim()
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ max: 250 }).withMessage('La descripción no puede superar 250 caracteres'),
  body('evidence_url')
    .optional({ nullable: true })
    .isURL().withMessage('evidence_url debe ser una URL válida'),
]

export const postTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, errors: errors.array() })
    }

    const { adi_user_id, adi_rol_id, area_id, error_type_id, description, evidence_url } = req.body

    const ticket = await createTicket({
      adi_user_id,
      adi_rol_id,
      area_id,
      error_type_id,
      description,
      evidence_url
    })

    res.status(201).json({ ok: true, data: ticket })
  } catch (err) {
    next(err)
  }
}