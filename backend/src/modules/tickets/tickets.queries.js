import supabase from "../../config/db.js";

// ─── LECTURA ──────────────────────────────────────────────────────────────────

const TICKET_SELECT = `
  id,
  adi_user_id,
  adi_rol_id,
  description,
  evidence_url,
  resolution_note,
  reopened_count,
  sla_deadline,
  assigned_at,
  created_at,
  updated_at,
  assigned_by,
  assigned_to,
  areas ( id, name ),
  error_types ( id, name ),
  status ( id, name ),
  priority ( id, name, sla_hours )
`;

export const getAllTickets = async () => {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getTicketsByTechnician = async (assigned_to) => {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("assigned_to", Number(assigned_to))
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getTicketById = async (ticket_id) => {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("id", Number(ticket_id))
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Tickets de un usuario ADI (para que el usuario vea sus reportes)
export const getTicketsByUser = async (adi_user_id) => {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .eq("adi_user_id", Number(adi_user_id))
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// ─── CREACIÓN ─────────────────────────────────────────────────────────────────

export const createTicket = async ({
  adi_user_id,
  adi_rol_id,
  area_id,
  error_type_id,
  description,
  evidence_url,
}) => {
  const { data, error } = await supabase
    .from("tickets")
    .insert([
      {
        adi_user_id,
        adi_rol_id,
        area_id,
        error_type_id,
        description,
        evidence_url: evidence_url ?? null,
        status_id: 1,    // Pendiente
        priority_id: 2,  // Media por defecto
        reopened_count: 0,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── VALIDACIÓN DE LÍMITES ────────────────────────────────────────────────────

/**
 * Devuelve cuántos tickets (de todos los estados) tiene un usuario ADI
 * con un rol y prioridad específicos.
 */
export const countTicketsByUserRolPriority = async (adi_user_id, adi_rol_id, priority_id) => {
  const { count, error } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("adi_user_id", Number(adi_user_id))
    .eq("adi_rol_id", Number(adi_rol_id))
    .eq("priority_id", Number(priority_id));

  if (error) throw error;
  return count ?? 0;
};

/**
 * Obtiene el límite máximo de tickets para un rol y prioridad dados.
 * Retorna null si no existe límite configurado.
 */
export const getTicketLimit = async (adi_rol_id, priority_id) => {
  const { data, error } = await supabase
    .from("tickets_limits")
    .select("max_tickets")
    .eq("adi_rol_id", Number(adi_rol_id))
    .eq("priority_id", Number(priority_id))
    .maybeSingle();

  if (error) throw error;
  return data?.max_tickets ?? null;
};

// ─── ASIGNACIÓN (ADMIN) ───────────────────────────────────────────────────────

/**
 * Asigna prioridad, técnico y calcula sla_deadline.
 * sla_hours viene de la tabla priority.
 */
export const assignTicket = async (ticket_id, { priority_id, assigned_to, assigned_by, sla_hours }) => {
  const sla_deadline = new Date(
    Date.now() + sla_hours * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("tickets")
    .update({
      priority_id,
      assigned_to,
      assigned_by,
      assigned_at: new Date().toISOString(),
      sla_deadline,
      status_id: 2, // Asignado
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(ticket_id))
    .select(TICKET_SELECT)
    .single();

  if (error) throw error;
  return data;
};

// ─── RESOLUCIÓN (TÉCNICO) ─────────────────────────────────────────────────────

export const resolveTicket = async (ticket_id, resolution_note) => {
  const { data, error } = await supabase
    .from("tickets")
    .update({
      status_id: 4, // En Revision (el admin decide si aprobar o reabrir)
      resolution_note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(ticket_id))
    .select(TICKET_SELECT)
    .single();

  if (error) throw error;
  return data;
};

// ─── REVISIÓN ADMIN (marcar en revisión / reabrir) ────────────────────────────

export const markInReview = async (ticket_id) => {
  const { data, error } = await supabase
    .from("tickets")
    .update({
      status_id: 3, // Resuelto (admin aprueba)
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(ticket_id))
    .select(TICKET_SELECT)
    .single();

  if (error) throw error;
  return data;
};

export const reopenTicket = async (ticket_id, { assigned_to, assigned_by, sla_hours, priority_id }) => {
  // Obtener el conteo actual de reaperturas
  const { data: current, error: fetchErr } = await supabase
    .from("tickets")
    .select("reopened_count")
    .eq("id", Number(ticket_id))
    .single();

  if (fetchErr) throw fetchErr;

  const sla_deadline = new Date(
    Date.now() + sla_hours * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("tickets")
    .update({
      status_id: 2, // Asignado
      assigned_to,
      assigned_by,
      assigned_at: new Date().toISOString(),
      sla_deadline,
      priority_id,
      resolution_note: null,
      reopened_count: (current.reopened_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", Number(ticket_id))
    .select(TICKET_SELECT)
    .single();

  if (error) throw error;
  return data;
};

// ─── COMENTARIOS ──────────────────────────────────────────────────────────────

export const getCommentsByTicket = async (ticket_id) => {
  const { data, error } = await supabase
    .from("tickets_comments")
    .select(`
      id,
      message,
      created_at,
      support_users (
        id,
        name,
        apat,
        role
      )
    `)
    .eq("ticket_id", Number(ticket_id))
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

export const createComment = async ({ ticket_id, author_id, message }) => {
  const { data, error } = await supabase
    .from("tickets_comments")
    .insert([{ ticket_id, author_id, message, created_at: new Date().toISOString() }])
    .select(`
      id,
      message,
      created_at,
      support_users (
        id,
        name,
        apat,
        role
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

// ─── HISTORIAL ────────────────────────────────────────────────────────────────

export const getHistoryByTicket = async (ticket_id) => {
  const { data, error } = await supabase
    .from("tickets_history")
    .select(`
      id,
      field_changed,
      old_value,
      new_value,
      created_at,
      support_users (
        id,
        name,
        apat,
        role
      )
    `)
    .eq("ticket_id", Number(ticket_id))
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

export const logHistory = async ({ ticket_id, changed_by, field_changed, old_value, new_value }) => {
  const { error } = await supabase
    .from("tickets_history")
    .insert([{
      ticket_id: Number(ticket_id),
      changed_by: Number(changed_by),
      field_changed,
      old_value: old_value !== null && old_value !== undefined ? String(old_value) : null,
      new_value: new_value !== null && new_value !== undefined ? String(new_value) : null,
      created_at: new Date().toISOString(),
    }]);

  if (error) throw error;
};

// ─── PRIORIDAD (para obtener sla_hours al asignar) ───────────────────────────

export const getPriorityById = async (priority_id) => {
  const { data, error } = await supabase
    .from("priority")
    .select("id, name, sla_hours")
    .eq("id", Number(priority_id))
    .single();

  if (error) throw error;
  return data;
};

// ─── TÉCNICOS DISPONIBLES (para el select del admin) ─────────────────────────

export const getAvailableTechnicians = async () => {
  const { data, error } = await supabase
    .from("support_users")
    .select("id, name, apat, amat, role")
    .eq("role", 2)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
};

export const getTechnicianById = async (id) => {
  const { data, error } = await supabase
    .from("support_users")
    .select("id, name, apat, role, is_active")
    .eq("id", Number(id))
    .eq("role", 2)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data; // null si no existe o no es técnico activo
};