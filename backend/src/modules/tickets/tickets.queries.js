import supabase from "../../config/db.js";

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
        status_id: 1, // Pendiente por defecto
        priority_id: 2, // Media por defecto
        reopened_count: 0,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTicketsByUser = async (adi_user_id) => {
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      description,
      evidence_url,
      resolution_note,
      reopened_count,
      created_at,
      updated_at,
      areas (
        id,
        name
      ),
      error_types (
        id,
        name
      ),
      status (
        id,
        name
      ),
      priority (
        id,
        name,
        sla_hours
      )
    `,
    )
    .eq("adi_user_id", adi_user_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getTicketDetailByUser = async (ticket_id, adi_user_id) => {
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      description,
      evidence_url,
      resolution_note,
      reopened_count,
      sla_deadline,
      created_at,
      updated_at,
      areas (
        id,
        name
      ),
      error_types (
        id,
        name
      ),
      status (
        id,
        name
      ),
      priority (
        id,
        name,
        sla_hours
      )
    `,
    )
    .eq("id", ticket_id)
    .eq("adi_user_id", adi_user_id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getAllTickets = async () => {
  const { data, error } = await supabase
    .from("tickets")
    .select(`
      id,
      description,
      evidence_url,
      resolution_note,
      reopened_count,
      sla_deadline,
      created_at,
      updated_at,
      assigned_to,
      areas ( id, name ),
      error_types ( id, name ),
      status ( id, name ),
      priority ( id, name, sla_hours )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const getTicketsByTechnician = async (assigned_to) => {
  const { data, error } = await supabase
    .from("tickets")
    .select(`
      id,
      description,
      evidence_url,
      resolution_note,
      reopened_count,
      sla_deadline,
      created_at,
      updated_at,
      assigned_to,
      areas ( id, name ),
      error_types ( id, name ),
      status ( id, name ),
      priority ( id, name, sla_hours )
    `)
    .eq("assigned_to", Number(assigned_to))
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const getTicketById = async (ticket_id) => {
  const { data, error } = await supabase
    .from("tickets")
    .select(`
      id,
      description,
      evidence_url,
      resolution_note,
      reopened_count,
      sla_deadline,
      created_at,
      updated_at,
      assigned_to,
      areas ( id, name ),
      error_types ( id, name ),
      status ( id, name ),
      priority ( id, name, sla_hours )
    `)
    .eq("id", Number(ticket_id))
    .maybeSingle()

  if (error) throw error
  return data
}