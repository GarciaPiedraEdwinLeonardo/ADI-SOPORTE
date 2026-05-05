import supabase from '../../config/db.js'

export const createTicket = async ({ 
  adi_user_id, 
  adi_rol_id, 
  area_id, 
  error_type_id, 
  description, 
  evidence_url 
}) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([{
      adi_user_id,
      adi_rol_id,
      area_id,
      error_type_id,
      description,
      evidence_url: evidence_url ?? null,
      status_id: 1,       // Pendiente por defecto
      priority_id: 2,     // Media por defecto
      reopened_count: 0,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return data
}