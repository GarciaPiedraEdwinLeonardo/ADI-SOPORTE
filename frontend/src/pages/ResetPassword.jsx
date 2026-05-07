// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdArrowBack,
  MdErrorOutline,
  MdCheckCircleOutline,
  MdSecurity,
  MdCheck,
  MdClose,
} from 'react-icons/md'
import { authService } from '../services/authService'
import styles from './ResetPassword.module.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // ── Estados de validación del token ──────────────────────────────────────
  const [tokenStatus, setTokenStatus] = useState('checking') // 'checking' | 'valid' | 'invalid'
  const [tokenError, setTokenError] = useState('')

  const token = searchParams.get('token')

  // Valida el token al montar — antes de mostrar el formulario
  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true })
      return
    }

    const checkToken = async () => {
      try {
        await authService.validateResetToken(token)
        setTokenStatus('valid')
      } catch (err) {
        setTokenStatus('invalid')
        setTokenError(err.message || 'El enlace no es válido')
      }
    }

    checkToken()
  }, [token, navigate])

  const passwordChecks = {
    length: newPassword.length >= 8 && newPassword.length <= 20,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  }

  const getPasswordStrength = () => {
    const passed = Object.values(passwordChecks).filter(Boolean).length
    if (passed <= 2) return { color: '#ef4444', text: 'Débil' }
    if (passed <= 3) return { color: '#f59e0b', text: 'Media' }
    if (passed <= 4) return { color: '#84cc16', text: 'Fuerte' }
    return { color: '#10b981', text: 'Muy fuerte' }
  }

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (pwd.length > 20) return 'La contraseña no debe exceder 20 caracteres'
    if (!passwordChecks.lowercase) return 'Debe incluir al menos una minúscula'
    if (!passwordChecks.uppercase) return 'Debe incluir al menos una mayúscula'
    if (!passwordChecks.number) return 'Debe incluir al menos un número'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newPassword.trim()) { setError('Ingresa tu nueva contraseña'); return }
    const pwdError = validatePassword(newPassword)
    if (pwdError) { setError(pwdError); return }
    if (!confirmPassword.trim()) { setError('Confirma tu nueva contraseña'); return }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    setError('')

    try {
      await authService.resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = (e) => {
    e.preventDefault()
    setIsVisible(false)
    setTimeout(() => navigate('/login'), 300)
  }

  const strength = getPasswordStrength()

  // ── Panel de marca reutilizable ───────────────────────────────────────────
  const BrandPanel = () => (
    <div className={styles.brandSection}>
      <div className={styles.brandBackground}>
        <div className={styles.blobLarge} />
        <div className={styles.blobSmall} />
      </div>
      <div className={styles.brandContent}>
        <div className={styles.logoWrapper}>
          <img src="logo.png" alt="Logo ADI" className={styles.logoImage} />
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>Soporte <span>ADI</span></h1>
          <p className={styles.brandSubtitle}>Sistema de Incidencias</p>
        </div>
      </div>
    </div>
  )

  // ── Pantalla de carga mientras verifica el token ──────────────────────────
  if (tokenStatus === 'checking') {
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <BrandPanel />
          <div className={styles.formSection}>
            <div className={styles.formWrapper}>
              <div className={styles.checkingState}>
                <span className={styles.spinnerLarge} />
                <p className={styles.checkingText}>Verificando enlace...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Pantalla de token inválido / expirado / ya usado ──────────────────────
  if (tokenStatus === 'invalid') {
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <BrandPanel />
          <div className={styles.formSection}>
            <div className={styles.formWrapper}>
              <div className={`${styles.invalidState} ${styles.fadeIn}`}>
                <div className={styles.invalidIconWrapper}>
                  <MdErrorOutline className={styles.invalidIcon} />
                </div>
                <h3 className={styles.invalidTitle}>Enlace no válido</h3>
                <p className={styles.invalidMessage}>{tokenError}</p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className={styles.submitButton}
                >
                  Solicitar nuevo enlace
                </button>
              </div>
              <div className={styles.formFooter}>
                <p className={styles.versionInfo}>ADI v1.0 · Sistema de Incidencias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario normal (token válido) ──────────────────────────────────────
  return (
    <div className={`${styles.root} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.container}>
        <div className={`${styles.brandSection} ${isVisible ? styles.slideInLeft : ''}`}>
          <div className={styles.brandBackground}>
            <div className={styles.blobLarge} />
            <div className={styles.blobSmall} />
          </div>
          <div className={styles.brandContent}>
            <div className={`${styles.logoWrapper} ${isVisible ? styles.scaleIn : ''}`}>
              <img src="logo.png" alt="Logo ADI" className={styles.logoImage} />
            </div>
            <div className={`${styles.brandText} ${isVisible ? styles.fadeInUp : ''}`}>
              <h1 className={styles.brandTitle}>Soporte <span>ADI</span></h1>
              <p className={styles.brandSubtitle}>Sistema de Incidencias</p>
            </div>
          </div>
        </div>

        <div className={`${styles.formSection} ${isVisible ? styles.slideInRight : ''}`}>
          <div className={`${styles.formWrapper} ${isVisible ? styles.fadeInUp : ''}`}>
            <button onClick={handleBack} className={styles.backButton}>
              <MdArrowBack className={styles.backIcon} />
              Volver al inicio de sesión
            </button>

            <div className={styles.formHeader}>
              <div className={styles.headerIcon}><MdSecurity /></div>
              <h2 className={styles.formTitle}>Nueva contraseña</h2>
              <p className={styles.formSubtitle}>
                Crea una contraseña segura para proteger tu cuenta
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={`${styles.fieldGroup} ${focusedField === 'new' ? styles.fieldFocused : ''}`}>
                  <label className={styles.label}>Nueva contraseña</label>
                  <div className={styles.inputContainer}>
                    <MdLock className={styles.inputIcon} />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (error) setError('') }}
                      onFocus={() => setFocusedField('new')}
                      onBlur={() => setFocusedField('')}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className={styles.input}
                    />
                    <button type="button" className={styles.togglePassword}
                      onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                      {showNew ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className={styles.passwordStrength}>
                      <div className={styles.strengthBar}>
                        <div className={styles.strengthFill} style={{
                          width: `${(Object.values(passwordChecks).filter(Boolean).length / 5) * 100}%`,
                          backgroundColor: strength.color,
                        }} />
                      </div>
                      <span className={styles.strengthText} style={{ color: strength.color }}>
                        {strength.text}
                      </span>
                    </div>
                  )}
                </div>

                <div className={`${styles.fieldGroup} ${focusedField === 'confirm' ? styles.fieldFocused : ''}`}>
                  <label className={styles.label}>Confirmar contraseña</label>
                  <div className={styles.inputContainer}>
                    <MdLock className={styles.inputIcon} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError('') }}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField('')}
                      placeholder="Repite tu nueva contraseña"
                      autoComplete="new-password"
                      className={styles.input}
                    />
                    <button type="button" className={styles.togglePassword}
                      onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                      {showConfirm ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {confirmPassword && newPassword && (
                    <div className={styles.matchIndicator}>
                      {newPassword === confirmPassword
                        ? <span className={styles.matchSuccess}><MdCheck /> Las contraseñas coinciden</span>
                        : <span className={styles.matchError}><MdClose /> Las contraseñas no coinciden</span>
                      }
                    </div>
                  )}
                </div>

                <div className={styles.requirementsBox}>
                  <p className={styles.requirementsTitle}>La contraseña debe incluir:</p>
                  <div className={styles.requirementsGrid}>
                    {[
                      [passwordChecks.length, '8-20 caracteres'],
                      [passwordChecks.lowercase, 'Una minúscula'],
                      [passwordChecks.uppercase, 'Una mayúscula'],
                      [passwordChecks.number, 'Un número'],
                    ].map(([passed, label]) => (
                      <div key={label} className={`${styles.requirement} ${passed ? styles.passed : ''}`}>
                        {passed ? <MdCheck /> : <MdClose />}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className={`${styles.errorAlert} ${styles.slideDown}`}>
                    <MdErrorOutline className={styles.errorIcon} />
                    <span className={styles.errorMessage}>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading} className={styles.submitButton}>
                  {loading ? (
                    <span className={styles.loadingState}>
                      <span className={styles.spinner} />
                      Guardando...
                    </span>
                  ) : 'Guardar nueva contraseña'}
                </button>
              </form>
            ) : (
              <div className={`${styles.successState} ${styles.fadeIn}`}>
                <div className={styles.successIconWrapper}>
                  <MdCheckCircleOutline className={styles.successIcon} />
                </div>
                <h3 className={styles.successTitle}>¡Contraseña actualizada!</h3>
                <p className={styles.successMessage}>
                  Tu contraseña ha sido restablecida correctamente.
                </p>
                <p className={styles.successHint}>
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
                <button onClick={handleBack} className={styles.submitButton}>
                  Ir al inicio de sesión
                </button>
              </div>
            )}

            <div className={styles.formFooter}>
              <p className={styles.versionInfo}>ADI v1.0 · Sistema de Incidencias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}