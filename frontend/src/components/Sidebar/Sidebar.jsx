// src/components/Sidebar/Sidebar.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  MdDashboard,
  MdConfirmationNumber,
  MdQuestionAnswer,
  MdBusiness,
  MdPeople,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md'
import { RiShieldCheckLine } from 'react-icons/ri'
import styles from './Sidebar.module.css'

const ROLE_LABELS = { 1: 'Administrador', 2: 'Técnico', 3: 'Operador' }

const NAV_ITEMS = [
  { label: 'Dashboard', icon: MdDashboard,          path: '/dashboard', adminOnly: false },
  { label: 'Tickets',   icon: MdConfirmationNumber, path: '/tickets',   adminOnly: false },
  { label: 'FAQs',      icon: MdQuestionAnswer,     path: '/faqs',      adminOnly: false },
  { label: 'Áreas',     icon: MdBusiness,           path: '/areas',     adminOnly: false },
  { label: 'Usuarios',  icon: MdPeople,             path: '/usuarios',  adminOnly: true  },
]

export default function Sidebar({ activePath = '/dashboard' }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [open, setOpen]  = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 1
  )

  return (
    <aside
      className={styles.sidebar}
      style={{ width: open ? '240px' : '64px' }}
    >
      {/* Header / Logo */}
      <div className={styles.header}>
        <div className={styles.logoMark}>
          <RiShieldCheckLine className={styles.logoIcon} />
          <span className={`${styles.logoText} ${!open ? styles.logoTextHidden : ''}`}>
            ADI
          </span>
        </div>
        <button
          className={styles.toggleBtn}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <MdChevronLeft /> : <MdChevronRight />}
        </button>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {visibleItems.map((item) => {
          const isActive = activePath === item.path
          const Icon     = item.icon
          return (
            <button
              key={item.label}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => navigate(item.path)}
              title={!open ? item.label : undefined}
            >
              <span className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}>
                <Icon />
              </span>
              <span
                className={`
                  ${styles.navLabel}
                  ${isActive ? styles.navLabelActive : ''}
                  ${!open   ? styles.navLabelHidden : ''}
                `}
              >
                {item.label}
              </span>
              {isActive && open && <span className={styles.navDot} />}
            </button>
          )
        })}
      </nav>

      {/* Footer / User */}
      <div className={styles.footer}>
        <div className={styles.userChip}>
          <div className={styles.avatar}>
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className={`${styles.userInfo} ${!open ? styles.userInfoHidden : ''}`}>
            <span className={styles.userName}>
              {user?.name} {user?.apat}
            </span>
            <span className={styles.userRole}>
              {ROLE_LABELS[user?.role] ?? 'Usuario'}
            </span>
          </div>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <MdLogout />
        </button>
      </div>
    </aside>
  )
}