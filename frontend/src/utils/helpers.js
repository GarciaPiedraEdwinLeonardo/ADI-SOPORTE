// src/utils/helpers.js

/**
 * Formatea una fecha ISO a formato legible en español (México).
 * @param {string|null} iso
 * @returns {string}
 */
export const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Devuelve el saludo según la hora del día.
 * @returns {'Buenos días' | 'Buenas tardes' | 'Buenas noches'}
 */
export const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}
