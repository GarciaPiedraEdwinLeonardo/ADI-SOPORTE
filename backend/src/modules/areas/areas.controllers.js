import { getAllAreas } from './areas.queries.js'

export const getAreas = async (req, res, next) => {
  try {
    const data = await getAllAreas()
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}