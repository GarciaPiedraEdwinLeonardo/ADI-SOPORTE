import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdErrorOutline,
  MdArrowForward,
} from 'react-icons/md'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) {
      newErrors.email = 'El correo es obligatorio'
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Email inválido'
    } else if (form.email.length < 8 || form.email.length > 200) {
      newErrors.email = 'El email debe tener entre 8 y 200 caracteres'
    }

    // Password
    if (!form.password.trim()) {
      newErrors.password = 'La contraseña es requerida'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    // Limpiar error del campo al escribir
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
    if (error) setError('')
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      const data = await authService.login(form.email, form.password)
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    navigate('/forgot-password')
  }

  return (
    <motion.div
      className={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        <motion.div
          className={styles.brandSection}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className={styles.brandBackground}>
            <div className={styles.blobLarge} />
            <div className={styles.blobSmall} />
          </div>

          <div className={styles.brandContent}>
            <motion.div
              className={styles.logoWrapper}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              <img src="logo.png" alt="Logo ADI" className={styles.logoImage} />
            </motion.div>

            <motion.div
              className={styles.brandText}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h1 className={styles.brandTitle}>
                Soporte <span>ADI</span>
              </h1>
              <p className={styles.brandSubtitle}>Administrador de Incidencias</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className={styles.formSection}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <motion.div
            className={styles.formWrapper}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Iniciar sesión</h2>
              <p className={styles.formSubtitle}>
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={`${styles.fieldGroup} ${focusedField === 'email' ? styles.fieldFocused : ''}`}>
                <label className={styles.label}>
                  Correo electrónico
                </label>
                <div className={styles.inputContainer}>
                  <MdEmail className={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    placeholder="usuario@adi.mx"
                    autoComplete="email"
                    className={styles.input}
                  />
                </div>
                {errors.email && (
                  <span className={styles.fieldErrorMsg}>
                    <MdErrorOutline /> {errors.email}
                  </span>
                )}
              </div>

              <div className={`${styles.fieldGroup} ${focusedField === 'password' ? styles.fieldFocused : ''}`}>
                <label className={styles.label}>
                  Contraseña
                </label>
                <div className={styles.inputContainer}>
                  <MdLock className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePassword}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.fieldErrorMsg}>
                    <MdErrorOutline /> {errors.password}
                  </span>
                )}
              </div>

              <div className={styles.formOptions}>
                <a
                  href="/forgot-password"
                  onClick={handleForgotPassword}
                  className={styles.forgotPassword}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {error && (
                <motion.div
                  className={styles.errorAlert}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MdErrorOutline className={styles.errorIcon} />
                  <span className={styles.errorMessage}>{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className={styles.loadingState}>
                    <span className={styles.spinner} />
                    Verificando...
                  </span>
                ) : (
                  <span className={styles.buttonContent}>
                    Ingresar al sistema
                    <MdArrowForward className={styles.buttonIcon} />
                  </span>
                )}
              </motion.button>
            </form>

            <div className={styles.formFooter}>
              <p className={styles.versionInfo}>ADI v1.0 · Sistema de Incidencias</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
