import supabase from '../../config/db.js'

export const getErrorTypesByArea = async (area_id) => {
  const { data, error } = await supabase
    .from('error_types')
    .select('id, name, created_at')
    .eq('area_id', area_id)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}