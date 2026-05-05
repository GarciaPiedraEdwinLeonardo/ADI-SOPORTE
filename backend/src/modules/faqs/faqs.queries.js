import supabase from '../../config/db.js'

// GET todas las FAQs con su área
export const getAllFaqs = async () => {
  const { data, error } = await supabase
    .from('faqs')
    .select(`
      id,
      question,
      answer,
      created_at,
      areas (
        id,
        name,
        description
      )
    `)
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

// GET FAQs filtradas por area_id
export const getFaqsByArea = async (area_id) => {
  const { data, error } = await supabase
    .from('faqs')
    .select(`
      id,
      question,
      answer,
      created_at,
      areas (
        id,
        name,
        description
      )
    `)
    .eq('area_id', area_id)
    .order('id', { ascending: true })

  if (error) throw error
  return data
}

