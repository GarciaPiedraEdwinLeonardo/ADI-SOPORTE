import { useState } from 'react'
import {
    MdAdd,
    MdEdit,
    MdClose,
    MdCancel,
    MdPerson,
    MdBadge,
    MdEmail,
    MdShield,
    MdVisibility,
    MdVisibilityOff
} from 'react-icons/md'
import { tecnicosService } from '../../../services/tecnicosService'
import { EMPTY_FORM, validateUserForm } from '../../../utils/validators'
import styles from './UserModal.module.css'

export default function UserModal({ mode, user, onClose, onSaved }) {
    const isEdit = mode === 'edit'
    const [form, setForm] = useState(
        isEdit
            ? {
                name: user.name ?? '', apat: user.apat ?? '',
                amat: user.amat ?? '', email: user.email ?? '',
                password: '', role: user.role ?? 2,
                is_active: user.is_active ?? true,
            }
            : { ...EMPTY_FORM },
    )
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState({})

    const set = (key) => (e) => {
        const val =
            e.target.type === 'checkbox' ? e.target.checked
                : key === 'role' ? Number(e.target.value)
                    : e.target.value
        setForm((f) => ({ ...f, [key]: val }))
        if (fieldErrors[key]) {
            setFieldErrors((prev) => ({ ...prev, [key]: null }))
        }
    }

    const handleSubmit = async () => {
        const validationErrors = validateUserForm(form, isEdit)
        if (validationErrors) {
            setFieldErrors(validationErrors)
            setError('Por favor, corrige los errores del formulario.')
            return
        }

        setError(null)
        setLoading(true)
        try {
            if (isEdit) {
                const { name, apat, amat, email, role, is_active } = form
                const result = await tecnicosService.update(user.id, { name, apat, amat, email, role, is_active })
                onSaved(result.data, 'edit')
            } else {
                const result = await tecnicosService.create(form)
                onSaved(result.data, 'create')
            }
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitleGroup}>
                        <div className={styles.modalIcon}>
                            {isEdit ? <MdEdit size={18} /> : <MdAdd size={18} />}
                        </div>
                        <div>
                            <h2 className={styles.modalTitle}>
                                {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
                            </h2>
                            <p className={styles.modalSub}>
                                {isEdit ? `ID #${user.id}` : 'Rellena los campos para crear la cuenta'}
                            </p>
                        </div>
                    </div>
                    <button className={styles.modalClose} onClick={onClose}>
                        <MdClose size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.alertError}>
                            <MdCancel size={15} /> {error}
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <Field label="Nombre(s)" error={fieldErrors.name}>
                            <InputIcon icon={<MdPerson />}>
                                <input className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`} type="text" placeholder="Ej. Juan" maxLength={80}
                                    value={form.name} onChange={set('name')} />
                            </InputIcon>
                        </Field>

                        <Field label="Apellido paterno" error={fieldErrors.apat}>
                            <InputIcon icon={<MdBadge />}>
                                <input className={`${styles.input} ${fieldErrors.apat ? styles.inputError : ''}`} type="text" placeholder="Ej. García" maxLength={30}
                                    value={form.apat} onChange={set('apat')} />
                            </InputIcon>
                        </Field>

                        <Field label="Apellido materno" error={fieldErrors.amat}>
                            <InputIcon icon={<MdBadge />}>
                                <input className={`${styles.input} ${fieldErrors.amat ? styles.inputError : ''}`} type="text" placeholder="Ej. López" maxLength={30}
                                    value={form.amat} onChange={set('amat')} />
                            </InputIcon>
                        </Field>

                        <Field label="Correo electrónico" full error={fieldErrors.email}>
                            <InputIcon icon={<MdEmail />}>
                                <input className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`} type="email" placeholder="usuario@empresa.com" maxLength={200}
                                    value={form.email} onChange={set('email')} />
                            </InputIcon>
                        </Field>

                        {!isEdit && (
                            <Field label="Contraseña" full error={fieldErrors.password}>
                                <InputIcon icon={<MdShield />} right={
                                    <button type="button" className={styles.eyeBtn}
                                        onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                                        {showPwd ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                                    </button>
                                }>
                                    <input className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                                        type={showPwd ? 'text' : 'password'}
                                        placeholder="Mín. 8 caracteres, mayúsc. y minúsc."
                                        maxLength={20}
                                        value={form.password} onChange={set('password')} />
                                </InputIcon>
                            </Field>
                        )}

                        <Field label="Rol" error={fieldErrors.role}>
                            <select className={`${styles.select} ${fieldErrors.role ? styles.inputError : ''}`} value={form.role} onChange={set('role')}>
                                <option value={1}>Administrador</option>
                                <option value={2}>Técnico</option>
                            </select>
                        </Field>

                        {isEdit && (
                            <Field label="Estado">
                                <div className={styles.toggleRow}>
                                    <span className={styles.toggleLabel}>
                                        {form.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                </div>
                            </Field>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button className={styles.btnSave} onClick={handleSubmit} disabled={loading}>
                        {loading
                            ? <span className={styles.spinner} />
                            : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, children, full, error }) {
    return (
        <div className={`${styles.fieldGroup} ${full ? styles.fullWidth : ''}`}>
            <label className={styles.label}>{label}</label>
            {children}
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    )
}

function InputIcon({ icon, right, children }) {
    return (
        <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>{icon}</span>
            {children}
            {right && <span className={styles.inputRight}>{right}</span>}
        </div>
    )
}
