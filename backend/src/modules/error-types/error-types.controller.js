import { getErrorTypesByArea } from './error-types.queries.js'

export const getErrorTypes = async (req, res, next) => {
  try {
    const { area_id } = req.params

    if (isNaN(area_id)) {
      return res.status(400).json({ ok: false, error: 'area_id debe ser un número' })
    }

    const data = await getErrorTypesByArea(area_id)

    if (!data.length) {
      return res.status(404).json({ ok: false, error: 'No se encontraron tipos de error para esta área' })
    }

    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}