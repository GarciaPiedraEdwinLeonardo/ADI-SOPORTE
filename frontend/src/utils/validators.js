// src/utils/validators.js

export const EMPTY_FORM = {
    name: '', apat: '', amat: '',
    email: '', password: '',
    role: 2, is_active: true,
}

export const VALIDATION_RULES = {
    name: {
        required: true,
        minLength: 2,
        maxLength: 80,
        message: 'El nombre debe tener entre 2 y 80 caracteres'
    },
    apat: {
        required: true,
        minLength: 3,
        maxLength: 30,
        message: 'El apellido paterno debe tener entre 3 y 30 caracteres'
    },
    amat: {
        required: false,
        minLength: 3,
        maxLength: 30,
        message: 'El apellido materno debe tener entre 3 y 30 caracteres'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        minLength: 8,
        maxLength: 200,
        message: 'Email inválido o fuera de rango (8-200 caracteres)'
    },
    password: {
        required: (isEdit) => !isEdit,
        validate: (val, isEdit) => {
            if (isEdit && !val) return null
            if (!val) return 'La contraseña es requerida'
            if (val.length < 8 || val.length > 20) return 'La contraseña debe tener entre 8 y 20 caracteres'
            if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/.test(val)) return 'La contraseña contiene caracteres no permitidos'
            if (!/[a-z]/.test(val)) return 'La contraseña debe tener al menos una minúscula'
            if (!/[A-Z]/.test(val)) return 'La contraseña debe tener al menos una mayúscula'
            return null
        }
    },
    role: { required: true, message: 'El rol es obligatorio' }
}

/**
 * Valida el formulario de usuario contra las reglas definidas.
 * @param {object} form
 * @param {boolean} isEdit
 * @returns {object|null} objeto de errores o null si no hay errores
 */
export const validateUserForm = (form, isEdit) => {
    const errors = {}
    for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
        const isRequired = typeof rules.required === 'function' ? rules.required(isEdit) : rules.required
        let value = form[field]
        if (typeof value === 'string') value = value.trim()

        if (rules.validate) {
            const errorMsg = rules.validate(value, isEdit)
            if (errorMsg) errors[field] = errorMsg
            continue
        }

        if (isRequired && (!value || String(value) === '')) {
            errors[field] = 'Este campo es obligatorio'
            continue
        }

        if (value) {
            if (rules.pattern && !rules.pattern.test(value)) {
                errors[field] = rules.message || 'Formato inválido'
                continue
            }
            if (rules.minLength && String(value).length < rules.minLength) {
                errors[field] = rules.message || `Mínimo ${rules.minLength} caracteres`
                continue
            }
            if (rules.maxLength && String(value).length > rules.maxLength) {
                errors[field] = rules.message || `Máximo ${rules.maxLength} caracteres`
                continue
            }
        }
    }
    return Object.keys(errors).length > 0 ? errors : null
}

/** Constantes de roles */
export const ROLE_LABELS = { 1: 'Administrador', 2: 'Técnico' }
export const ROLE_COLORS = {
    1: { color: '#7C3AED', bg: '#EDE9FE' },
    2: { color: '#0284C7', bg: '#E0F2FE' },
}
