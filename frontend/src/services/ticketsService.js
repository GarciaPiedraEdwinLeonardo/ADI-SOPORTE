// src/services/ticketsService.js
import api from './api'

export const ticketsService = {
  /**
   * GET /api/tickets
   * Admin → todos | Técnico → solo los suyos
   */
  getAll: async () => {
    const { data } = await api.get('/tickets')
    if (!data.ok) throw new Error(data.error || 'Error al obtener los tickets')
    return data // { ok, total, data: [] }
  },

  /**
   * POST /api/tickets
   * Crea un nuevo ticket. La evidence_url debe ser la URL de Cloudinary
   * obtenida previamente con uploadToCloudinary().
   * @param {{ description: string, area_id: number, error_type_id: number, evidence_url?: string }} payload
   */
  create: async (payload) => {
    const { data } = await api.post('/tickets', payload)
    if (!data.ok) throw new Error(data.error || 'Error al crear el ticket')
    return data // { ok, data: {} }
  },


  /**
   * GET /api/tickets/technicians
   * Lista técnicos activos (solo admin, para el select de asignación)
   */
  getTechnicians: async () => {
    const { data } = await api.get('/tickets/technicians')
    if (!data.ok) throw new Error(data.error || 'Error al obtener los técnicos')
    return data // { ok, total, data: [] }
  },

  /**
   * GET /api/tickets/:id
   * Admin → cualquiera | Técnico → solo el suyo
   */
  getById: async (id) => {
    const { data } = await api.get(`/tickets/${id}`)
    if (!data.ok) throw new Error(data.error || 'Error al obtener el ticket')
    return data // { ok, data: {} }
  },

  /**
   * PATCH /api/tickets/:id/assign
   * Asigna prioridad + técnico, calcula SLA (solo admin)
   * @param {number} id
   * @param {{ priority_id: number, assigned_to: number }} payload
   */
  assign: async (id, { priority_id, assigned_to }) => {
    const { data } = await api.patch(`/tickets/${id}/assign`, { priority_id, assigned_to })
    if (!data.ok) throw new Error(data.error || 'Error al asignar el ticket')
    return data // { ok, data: {} }
  },

  /**
   * PATCH /api/tickets/:id/resolve
   * Técnico resuelve con nota
   * @param {number} id
   * @param {{ resolution_note: string }} payload
   */
  resolve: async (id, { resolution_note }) => {
    const { data } = await api.patch(`/tickets/${id}/resolve`, { resolution_note })
    if (!data.ok) throw new Error(data.error || 'Error al resolver el ticket')
    return data // { ok, data: {} }
  },

  /**
   * PATCH /api/tickets/:id/review
   * Admin aprueba la resolución → status Resuelto (3)
   */
  review: async (id) => {
    const { data } = await api.patch(`/tickets/${id}/review`)
    if (!data.ok) throw new Error(data.error || 'Error al aprobar la resolución')
    return data // { ok, data: {} }
  },

  /**
   * PATCH /api/tickets/:id/reopen
   * Admin rechaza y reabre con motivo
   * @param {number} id
   * @param {{ reopen_reason: string }} payload
   */
  reopen: async (id, { reopen_reason }) => {
    const { data } = await api.patch(`/tickets/${id}/reopen`, { reopen_reason })
    if (!data.ok) throw new Error(data.error || 'Error al reabrir el ticket')
    return data // { ok, data: {} }
  },

  /**
   * PATCH /api/tickets/:id/dismiss
   * Admin desestima el ticket
   * @param {number} id
   * @param {{ dismiss_reason: string }} payload
   */
  dismiss: async (id, { dismiss_reason }) => {
    const { data } = await api.patch(`/tickets/${id}/dismiss`, { dismiss_reason })
    if (!data.ok) throw new Error(data.error || 'Error al desestimar el ticket')
    return data // { ok, data: {} }
  },

  /**
   * GET /api/tickets/:id/comments
   * Admin + técnico asignado
   */
  getComments: async (id) => {
    const { data } = await api.get(`/tickets/${id}/comments`)
    if (!data.ok) throw new Error(data.error || 'Error al obtener los comentarios')
    return data // { ok, total, data: [] }
  },

  /**
   * POST /api/tickets/:id/comments
   * Admin + técnico asignado
   * @param {number} id
   * @param {{ message: string }} payload
   */
  postComment: async (id, { message }) => {
    const { data } = await api.post(`/tickets/${id}/comments`, { message })
    if (!data.ok) throw new Error(data.error || 'Error al enviar el comentario')
    return data // { ok, data: {} }
  },

  /**
   * GET /api/tickets/:id/history
   * Admin + técnico asignado
   */
  getHistory: async (id) => {
    const { data } = await api.get(`/tickets/${id}/history`)
    if (!data.ok) throw new Error(data.error || 'Error al obtener el historial')
    return data // { ok, total, data: [] }
  },
}