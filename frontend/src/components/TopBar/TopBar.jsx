// src/components/TopBar/TopBar.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  MdPerson,
  MdLogout,
  MdKeyboardArrowDown,
  MdLock,
} from 'react-icons/md'
import ChangePasswordModal from './ChangePasswordModal'
import Toast from '../ui/Toast'
import styles from './TopBar.module.css'

const ROLE_LABELS = { 1: 'Administrador', 2: 'Técnico', 3: 'Operador' }

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const dropdownRef = useRef(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleChangePassword = () => {
    setDropdownOpen(false)
    setShowModal(true)
  }

  const handlePasswordChanged = () => {
    setToast({ msg: 'Contraseña actualizada con éxito', type: 'success' })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <header className={styles.topbar}>
      {/* Marca */}
      <div className={styles.brand}>
        <div className={styles.brandText}>
          <span className={styles.brandName}>ADI Soporte</span>
          <span className={styles.brandSub}>Sistema de Incidencias</span>
        </div>
      </div>

      {/* Acciones de usuario */}
      <div className={styles.userArea} ref={dropdownRef}>
        <button
          className={styles.userBtn}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Menú de usuario"
          aria-expanded={dropdownOpen}
        >
          {/* Avatar */}
          <div className={styles.avatar}>
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>

          {/* Info */}
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.name} {user?.apat}
            </span>
            <span className={styles.userRole}>
              {ROLE_LABELS[user?.role] ?? 'Usuario'}
            </span>
          </div>

          {/* Chevron */}
          <MdKeyboardArrowDown
            className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className={styles.dropdown}>
            {/* Cabecera del dropdown */}
            <div className={styles.dropdownHeader}>
              <div className={styles.dropdownAvatar}>
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className={styles.dropdownName}>
                  {user?.name} {user?.apat}
                </p>
                <p className={styles.dropdownEmail}>{user?.email}</p>
              </div>
            </div>

            <div className={styles.dropdownDivider} />

            {/* Opciones */}
            <button className={styles.dropdownItem} onClick={handleChangePassword}>
              <MdLock className={styles.dropdownItemIcon} />
              Cambiar contraseña
            </button>

            <div className={styles.dropdownDivider} />

            <button
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={handleLogout}
            >
              <MdLogout className={styles.dropdownItemIcon} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ChangePasswordModal 
          onClose={() => setShowModal(false)} 
          onSaved={handlePasswordChanged} 
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} />
      )}
    </header>
  )
}