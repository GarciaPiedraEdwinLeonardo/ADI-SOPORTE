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

// POST crear una FAQ
export const createFaq = async ({ area_id, question, answer, created_by }) => {
  const { data, error } = await supabase
    .from('faqs')
    .insert({ area_id, question, answer, created_by })
    .select()
    .single()

  if (error) throw error
  return data
}

// PUT editar una FAQ
export const updateFaq = async (id, { area_id, question, answer }) => {
  const { data, error } = await supabase
    .from('faqs')
    .update({ area_id, question, answer, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// DELETE eliminar una FAQ
export const deleteFaq = async (id) => {
  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id)

  if (error) throw error
}