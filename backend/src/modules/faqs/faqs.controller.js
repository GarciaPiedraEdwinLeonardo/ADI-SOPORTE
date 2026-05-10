import { getAllFaqs, getFaqsByArea, createFaq, updateFaq, deleteFaq } from './faqs.queries.js'

export const getFaqs = async (req, res, next) => {
  try {
    const data = await getAllFaqs()
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

export const getFaqsByAreaId = async (req, res, next) => {
  try {
    const { area_id } = req.params

    if (isNaN(area_id)) {
      return res.status(400).json({ ok: false, error: 'area_id debe ser un número' })
    }

    const data = await getFaqsByArea(area_id)

    if (!data.length) {
      return res.status(404).json({ ok: false, error: 'No se encontraron FAQs para esta área' })
    }

    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

export const postFaq = async (req, res, next) => {
  try {
    const { area_id, question, answer } = req.body
    const created_by = req.user.id

    if (!area_id || !question || !answer) {
      return res.status(400).json({ ok: false, error: 'area_id, question y answer son requeridos' })
    }

    if (question.length < 10 || question.length > 80) {
      return res.status(400).json({ ok: false, error: 'La pregunta debe tener entre 10 y 80 caracteres' })
    }

    if (answer.length < 30 || answer.length > 400) {
      return res.status(400).json({ ok: false, error: 'La respuesta debe tener entre 30 y 400 caracteres' })
    }

    const data = await createFaq({ area_id, question, answer, created_by })
    res.status(201).json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

export const putFaq = async (req, res, next) => {
  try {
    const { id } = req.params
    const { area_id, question, answer } = req.body

    if (isNaN(id)) {
      return res.status(400).json({ ok: false, error: 'id debe ser un número' })
    }

    if (!area_id && !question && !answer) {
      return res.status(400).json({ ok: false, error: 'Debes enviar al menos un campo para actualizar' })
    }

    if (question !== undefined && (question.length < 10 || question.length > 80)) {
      return res.status(400).json({ ok: false, error: 'La pregunta debe tener entre 10 y 80 caracteres' })
    }

    if (answer !== undefined && (answer.length < 30 || answer.length > 400)) {
      return res.status(400).json({ ok: false, error: 'La respuesta debe tener entre 30 y 400 caracteres' })
    }

    const data = await updateFaq(id, { area_id, question, answer })

    if (!data) {
      return res.status(404).json({ ok: false, error: 'FAQ no encontrada' })
    }

    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

export const deleteFaqById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (isNaN(id)) {
      return res.status(400).json({ ok: false, error: 'id debe ser un número' })
    }

    await deleteFaq(id)
    res.json({ ok: true, message: 'FAQ eliminada correctamente' })
  } catch (err) {
    next(err)
  }
}