import { useState } from 'react'
import {
    MdClose,
    MdCancel,
    MdShield,
    MdVisibility,
    MdVisibilityOff,
    MdLockOutline
} from 'react-icons/md'
import { authService } from '../../services/authService'
import { VALIDATION_RULES } from '../../utils/validators'
import styles from './ChangePasswordModal.module.css'

export default function ChangePasswordModal({ onClose, onSaved }) {
    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    })
    
    // Visibilidad independiente por campo
    const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })
    
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState({})

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }))
        if (fieldErrors[key]) {
            setFieldErrors((prev) => ({ ...prev, [key]: null }))
        }
    }

    const toggleShow = (key) => {
        setShowPwd((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSubmit = async () => {
        const errors = {}
        if (!form.current_password) errors.current_password = 'La contraseña actual es obligatoria'
        
        const newPwdError = VALIDATION_RULES.password.validate(form.new_password, false)
        if (newPwdError) {
            errors.new_password = newPwdError
        }
        
        if (!form.confirm_password) errors.confirm_password = 'Debes confirmar la contraseña'
        else if (form.new_password !== form.confirm_password) errors.confirm_password = 'Las contraseñas no coinciden'

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        setError(null)
        setLoading(true)
        try {
            await authService.changePassword(form)
            onSaved()
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
                            <MdLockOutline size={20} />
                        </div>
                        <div>
                            <h2 className={styles.modalTitle}>Cambiar contraseña</h2>
                            <p className={styles.modalSub}>Ingresa tu contraseña actual y la nueva</p>
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

                    <Field label="Contraseña actual" error={fieldErrors.current_password}>
                        <InputIcon icon={<MdShield />} right={
                            <button type="button" className={styles.eyeBtn}
                                onClick={() => toggleShow('current')} tabIndex={-1}>
                                {showPwd.current ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                            </button>
                        }>
                            <input className={`${styles.input} ${fieldErrors.current_password ? styles.inputError : ''}`}
                                type={showPwd.current ? 'text' : 'password'}
                                placeholder="Tu contraseña actual"
                                maxLength={20}
                                value={form.current_password} onChange={set('current_password')} />
                        </InputIcon>
                    </Field>

                    <Field label="Nueva contraseña" error={fieldErrors.new_password}>
                        <InputIcon icon={<MdShield />} right={
                            <button type="button" className={styles.eyeBtn}
                                onClick={() => toggleShow('new')} tabIndex={-1}>
                                {showPwd.new ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                            </button>
                        }>
                            <input className={`${styles.input} ${fieldErrors.new_password ? styles.inputError : ''}`}
                                type={showPwd.new ? 'text' : 'password'}
                                placeholder="Mínimo 8 caracteres"
                                maxLength={20}
                                value={form.new_password} onChange={set('new_password')} />
                        </InputIcon>
                    </Field>

                    <Field label="Confirmar nueva contraseña" error={fieldErrors.confirm_password}>
                        <InputIcon icon={<MdShield />} right={
                            <button type="button" className={styles.eyeBtn}
                                onClick={() => toggleShow('confirm')} tabIndex={-1}>
                                {showPwd.confirm ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                            </button>
                        }>
                            <input className={`${styles.input} ${fieldErrors.confirm_password ? styles.inputError : ''}`}
                                type={showPwd.confirm ? 'text' : 'password'}
                                placeholder="Repite la nueva contraseña"
                                maxLength={20}
                                value={form.confirm_password} onChange={set('confirm_password')} />
                        </InputIcon>
                    </Field>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button className={styles.btnSave} onClick={handleSubmit} disabled={loading}>
                        {loading ? <span className={styles.spinner} /> : 'Actualizar contraseña'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, children, error }) {
    return (
        <div className={styles.fieldGroup}>
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
