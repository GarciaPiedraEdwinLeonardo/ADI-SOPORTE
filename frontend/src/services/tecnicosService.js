// src/services/tecnicosService.js
import api from "./api";

export const tecnicosService = {
  /**
   * GET /api/auth/users
   * Retorna la lista completa de usuarios (solo admin).
   */
  getAll: async () => {
    const { data } = await api.get("/auth/users");
    if (!data.ok) throw new Error(data.error || "Error al obtener los usuarios");
    return data; // { ok, total, data: [] }
  },

  /**
   * GET /api/auth/users/:id
   * Retorna el detalle de un usuario (solo admin).
   */
  getById: async (id) => {
    const { data } = await api.get(`/auth/users/${id}`);
    if (!data.ok) throw new Error(data.error || "Error al obtener el usuario");
    return data; // { ok, data: {} }
  },

  /**
   * POST /api/auth/register
   * Crea un nuevo usuario (solo admin).
   * @param {{ name, apat, amat, email, password, role }} payload
   */
  create: async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    if (!data.ok) throw new Error(data.error || "Error al crear el usuario");
    return data; // { ok, data: {} }
  },

  /**
   * PUT /api/auth/users/:id
   * Actualiza los datos de un usuario (solo admin).
   * @param {number} id
   * @param {{ name?, apat?, amat?, email?, role?, is_active? }} fields
   */
  update: async (id, fields) => {
    const { data } = await api.put(`/auth/users/${id}`, fields);
    if (!data.ok) throw new Error(data.error || "Error al actualizar el usuario");
    return data; // { ok, data: {} }
  },

  delete: async (id) => {
    const { data } = await api.delete(`/auth/users/${id}`);
    if (!data.ok) throw new Error(data.error || "Error al eliminar el usuario");
    return data;
  },
};