import api from "./api";

export const authService = {
  /**
   * POST /api/auth/login
   * Returns { token, user }
   */
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (!data.ok) throw new Error(data.error || "Error al iniciar sesión");
    return data;
  },

  /**
   * POST /api/auth/logout (stateless — just clears client side)
   */
  logout: async () => {
    await api.post("/auth/logout");
  },

  /**
   * PUT /api/auth/change-password
   */
  changePassword: async ({
    current_password,
    new_password,
    confirm_password,
  }) => {
    const { data } = await api.put("/auth/change-password", {
      current_password,
      new_password,
      confirm_password,
    });
    if (!data.ok)
      throw new Error(data.error || "Error al cambiar la contraseña");
    return data;
  },

  /**
   * PUT /api/auth/users/:id  (admin only)
   */
  updateUser: async (id, fields) => {
    const { data } = await api.put(`/auth/users/${id}`, fields);
    if (!data.ok)
      throw new Error(data.error || "Error al actualizar el usuario");
    return data;
  },

  /**
   * POST /api/auth/register  (admin only)
   */
  register: async (userData) => {
    const { data } = await api.post("/auth/register", userData);
    if (!data.ok) throw new Error(data.error || "Error al crear el usuario");
    return data;
  },

  /**
   * POST /api/auth/forgot-password
   * Siempre resuelve (el backend no revela si el email existe).
   */
  forgotPassword: async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    if (!data.ok) throw new Error(data.error || "Error al enviar el correo");
    return data;
  },

  /**
   * POST /api/auth/reset-password
   * @param {{ token: string, new_password: string, confirm_password: string }} payload
   */
  resetPassword: async ({ token, new_password, confirm_password }) => {
    const { data } = await api.post("/auth/reset-password", {
      token,
      new_password,
      confirm_password,
    });
    if (!data.ok)
      throw new Error(data.error || "Error al restablecer la contraseña");
    return data;
  },

  validateResetToken: async (token) => {
    const { data } = await api.get(`/auth/validate-reset-token?token=${token}`);
    if (!data.ok) throw new Error(data.error);
    return data;
  },
};
