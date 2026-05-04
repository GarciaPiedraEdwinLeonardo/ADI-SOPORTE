import { getAllFaqs, getFaqsByArea, getAllAreas } from './faqs.queries.js'

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

export const getAreas = async (req, res, next) => {
  try {
    const data = await getAllAreas()
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}