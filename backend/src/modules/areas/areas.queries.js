import supabase from '../../config/db.js'

export const getAllAreas = async () => {
  const { data, error } = await supabase
    .from('areas')
    .select('id, name, description, created_at')
    .order('id', { ascending: true })

  if (error) throw error
  return data
}