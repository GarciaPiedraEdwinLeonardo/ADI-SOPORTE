// src/services/faqsService.js
import api from './api'

export const faqsService = {
  /**
   * GET /api/areas
   * Retorna todas las áreas disponibles (para el select del modal).
   */
  getAreas: async () => {
    const { data } = await api.get('/areas')
    if (!data.ok) throw new Error(data.error || 'Error al obtener las áreas')
    return data // { ok, data: [] }
  },

  /**
   * GET /api/faqs
   * Retorna todas las FAQs.
   */
  getAll: async () => {
    const { data } = await api.get('/faqs')
    if (!data.ok) throw new Error(data.error || 'Error al obtener las FAQs')
    return data // { ok, data: [] }
  },

  /**
   * GET /api/faqs/area/:area_id
   * Retorna las FAQs de un área específica.
   */
  getByArea: async (area_id) => {
    const { data } = await api.get(`/faqs/area/${area_id}`)
    if (!data.ok) throw new Error(data.error || 'Error al obtener las FAQs del área')
    return data // { ok, data: [] }
  },

  /**
   * POST /api/faqs
   * Crea una nueva FAQ (solo admin).
   * @param {{ area_id: number, question: string, answer: string }} payload
   */
  create: async (payload) => {
    const { data } = await api.post('/faqs', payload)
    if (!data.ok) throw new Error(data.error || 'Error al crear la FAQ')
    return data // { ok, data: {} }
  },

  /**
   * PUT /api/faqs/:id
   * Actualiza una FAQ existente (solo admin).
   * @param {number} id
   * @param {{ area_id?: number, question?: string, answer?: string }} fields
   */
  update: async (id, fields) => {
    const { data } = await api.put(`/faqs/${id}`, fields)
    if (!data.ok) throw new Error(data.error || 'Error al actualizar la FAQ')
    return data // { ok, data: {} }
  },

  /**
   * DELETE /api/faqs/:id
   * Elimina una FAQ (solo admin).
   */
  delete: async (id) => {
    const { data } = await api.delete(`/faqs/${id}`)
    if (!data.ok) throw new Error(data.error || 'Error al eliminar la FAQ')
    return data // { ok, message }
  },
}