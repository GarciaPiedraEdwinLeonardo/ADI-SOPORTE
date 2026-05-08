// src/components/Sidebar/Sidebar.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  MdHome,
  MdPeople,
  MdConfirmationNumber,
  MdQuestionAnswer,
  MdChevronLeft,
  MdChevronRight,
  MdMenu,
  MdClose,
  MdLogout,
} from 'react-icons/md'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'Inicio', icon: MdHome, path: '/dashboard' },
  { label: 'Técnicos', icon: MdPeople, path: '/tecnicos', adminOnly: true },
  { label: 'Tickets', icon: MdConfirmationNumber, path: '/tickets/admin', adminOnly: true },
  { label: 'Tickets', icon: MdConfirmationNumber, path: '/tickets/tecnico', techOnly: true },
  { label: 'FAQs', icon: MdQuestionAnswer, path: '/faqs', adminOnly: true },
]

export default function Sidebar({ activePath = '/dashboard' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const isAdmin = user?.role === 1
  const isTech  = user?.role === 2

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin
    if (item.techOnly)  return isTech
    return true
  })

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) {
        setMobileOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cerrar mobile al navegar
  const handleNavigate = (path) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && mobileOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Botón hamburguesa (solo móvil) */}
      {isMobile && (
        <button 
          className={styles.hamburger}
          onClick={toggleMobile}
          aria-label="Abrir menú"
        >
          {mobileOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
        </button>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          ${styles.sidebar} 
          ${open ? styles.open : styles.closed}
          ${isMobile ? styles.mobile : ''}
          ${isMobile && mobileOpen ? styles.mobileOpen : ''}
        `}
      >
        {/* Header / Logo */}
        <div className={styles.header}>
          <div className={styles.logoArea}>
            {/* ESPACIO CIRCULAR PARA EL LOGO */}
            <div className={styles.logoCircle}>
                <img src="logo.png" alt="Logo ADI" className={styles.logoImg} />
            </div>
            {open && <span className={styles.logoText}>ADI</span>}
          </div>
          
          {/* Botón toggle solo en desktop */}
          {!isMobile && (
            <button
              className={styles.toggleBtn}
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Colapsar menú' : 'Expandir menú'}
            >
              {open ? <MdChevronLeft /> : <MdChevronRight />}
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav className={styles.nav}>
          {visibleItems.map((item) => {
            const isActive = activePath === item.path
            const Icon = item.icon
            return (
              <button
                key={`${item.label}-${item.path}`}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={!open && !isMobile ? item.label : undefined}
              >
                <Icon className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`} />
                {open && (
                  <span className={`${styles.navLabel} ${isActive ? styles.navLabelActive : ''}`}>
                    {item.label}
                  </span>
                )}
                {isActive && open && <span className={styles.activeDot} />}
              </button>
            )
          })}
        </nav>

        {/* Footer con usuario y logout */}
        <div className={styles.footer}>
          <div className={styles.user}>
            <div className={styles.avatar}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {open && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name} {user?.apat}</span>
                <span className={styles.userRole}>
                  {user?.role === 1 ? 'Administrador' : user?.role === 2 ? 'Técnico' : 'Operador'}
                </span>
              </div>
            )}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
            <MdLogout />
          </button>
        </div>
      </aside>
    </>
  )
}