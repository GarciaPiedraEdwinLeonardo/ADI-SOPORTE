import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MdEmail,
  MdArrowBack,
  MdErrorOutline,
  MdCheckCircleOutline,
} from 'react-icons/md'
import styles from './ForgotPassword.module.css'
import {authService} from '../../services/authService'

export default function ForgotPassword() {
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validación consistente con el backend
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico')
      return
    }
    if (!emailRegex.test(email)) {
      setError('Email inválido')
      return
    }
    if (email.length < 8 || email.length > 200) {
      setError('El email debe tener entre 8 y 200 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Error al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = (e) => {
    e.preventDefault()
    navigate('/login')
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.brandBackground}>
            <div className={styles.blobLarge} />
            <div className={styles.blobSmall} />
          </div>
          
          <div className={styles.brandContent}>
            <motion.div 
              className={styles.logoWrapper}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "backOut" }}
            >
              <img src="logo.png" alt="Logo ADI" className={styles.logoImage} />
            </motion.div>
            
            <motion.div 
              className={styles.brandText}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h1 className={styles.brandTitle}>
                Soporte <span>ADI</span>
              </h1>
              <p className={styles.brandSubtitle}>Sistema de Incidencias</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className={styles.formSection}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div 
            className={styles.formWrapper}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.button 
              onClick={handleBack}
              className={styles.backButton}
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <MdArrowBack className={styles.backIcon} />
              Volver al inicio de sesión
            </motion.button>

            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Recuperar contraseña</h2>
              <p className={styles.formSubtitle}>
                Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={`${styles.fieldGroup} ${focusedField === 'email' ? styles.fieldFocused : ''}`}>
                  <label className={styles.label}>
                    Correo electrónico
                  </label>
                  <div className={styles.inputContainer}>
                    <MdEmail className={styles.inputIcon} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      placeholder="usuario@adi.mx"
                      required
                      autoComplete="email"
                      className={styles.input}
                    />
                  </div>
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
                      Enviando...
                    </span>
                  ) : (
                    'Enviar instrucciones'
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.div 
                className={styles.successState}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div 
                  className={styles.successIcon}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <MdCheckCircleOutline />
                </motion.div>
                <h3 className={styles.successTitle}>¡Correo enviado!</h3>
                <p className={styles.successMessage}>
                  Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>
                </p>
                <p className={styles.successHint}>
                  Si no encuentras el correo, revisa tu carpeta de spam o intenta de nuevo.
                </p>
                <motion.button
                  onClick={handleBack}
                  className={styles.submitButton}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Volver al inicio de sesión
                </motion.button>
              </motion.div>
            )}

            <div className={styles.formFooter}>
              <p className={styles.versionInfo}>ADI v1.0 · Sistema de Incidencias</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
