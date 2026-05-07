// src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import {
  MdAdd,
  MdConfirmationNumber,
  MdPending,
  MdCheckCircle,
  MdWarning,
} from 'react-icons/md'
import { RiShieldCheckLine } from 'react-icons/ri'
import Sidebar from '../components/Sidebar/Sidebar'
import styles from './Dashboard.module.css'

const ROLE_LABELS = { 1: 'Administrador', 2: 'Técnico', 3: 'Operador' }

const KPI_DATA = [
  {
    label: 'Tickets abiertos',
    value: '24',
    sub: '+3 hoy',
    color: '#84CC16',
    bg: '#ECFCCB',
    icon: MdConfirmationNumber,
    barWidth: '48%',
  },
  {
    label: 'En proceso',
    value: '11',
    sub: '5 con alerta',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: MdPending,
    barWidth: '22%',
  },
  {
    label: 'Resueltos (mes)',
    value: '138',
    sub: '98% SLA',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: MdCheckCircle,
    barWidth: '90%',
  },
  {
    label: 'Críticos abiertos',
    value: '2',
    sub: 'Atención req.',
    color: '#DC2626',
    bg: '#FEE2E2',
    icon: MdWarning,
    barWidth: '4%',
  },
]

const RECENT_TICKETS = [
  {
    id: '#TK-041',
    area: 'Redes',
    tipo: 'Sin conexión',
    estado: 'Pendiente',
    estadoColor: '#F59E0B',
    estadoBg: '#FEF3C7',
  },
  {
    id: '#TK-040',
    area: 'Cómputo',
    tipo: 'Equipo lento',
    estado: 'En proceso',
    estadoColor: '#0284C7',
    estadoBg: '#E0F2FE',
  },
  {
    id: '#TK-039',
    area: 'Impresión',
    tipo: 'Sin tóner',
    estado: 'Resuelto',
    estadoColor: '#16A34A',
    estadoBg: '#DCFCE7',
  },
]

export default function Dashboard() {
  const { user }   = useAuth()
  const location   = useLocation()

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className={styles.root}>

      {/* ── Sidebar ── */}
      <Sidebar activePath={location.pathname} />

      {/* ── Contenido principal ── */}
      <main className={styles.main}>

        {/* Topbar */}
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.pageTitle}>Panel de control</h1>
            <p className={styles.pageSubtitle}>
              Resumen de incidencias · {today}
            </p>
          </div>
          <div className={styles.topbarActions}>
            <button className={styles.btnPrimary}>
              <MdAdd size={16} />
              Nuevo ticket
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <section className={styles.kpiGrid}>
          {KPI_DATA.map((k) => {
            const Icon = k.icon
            return (
              <div key={k.label} className={styles.kpiCard}>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>{k.label}</span>
                  <span
                    className={styles.kpiBadge}
                    style={{ color: k.color, background: k.bg }}
                  >
                    {k.sub}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <p className={styles.kpiValue} style={{ color: k.color }}>
                    {k.value}
                  </p>
                  <div
                    className={styles.kpiIcon}
                    style={{ background: k.bg, color: k.color }}
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <div className={styles.kpiBar} style={{ background: k.bg }}>
                  <div
                    className={styles.kpiBarFill}
                    style={{ background: k.color, width: k.barWidth }}
                  />
                </div>
              </div>
            )
          })}
        </section>

        {/* Banner de bienvenida */}
        <section className={styles.welcomeBanner}>
          <div className={styles.bannerLeft}>
            <span className={styles.bannerTag}>
              <span className={styles.bannerTagDot} />
              Sistema activo
            </span>

            <h2 className={styles.bannerTitle}>
              Bienvenido, {user?.name}
            </h2>

            <p className={styles.bannerDesc}>
              Sesión iniciada correctamente como{' '}
              <strong style={{ color: '#E5E7EB' }}>
                {ROLE_LABELS[user?.role] ?? 'Usuario'}
              </strong>
              . El sistema ADI está operando con normalidad. Usa el menú
              lateral para navegar entre módulos.
            </p>

            <div className={styles.bannerPills}>
              <span className={styles.pill}>✓ Autenticación JWT activa</span>
              <span className={`${styles.pill} ${styles.pillEmail}`}>
                {user?.email}
              </span>
            </div>
          </div>

          <div className={styles.bannerDecor}>
            <RiShieldCheckLine />
          </div>
        </section>

        {/* Actividad reciente */}
        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Actividad reciente</h3>
            <button className={styles.btnGhost}>Ver todos</button>
          </div>

          <div className={styles.activityList}>
            {RECENT_TICKETS.map((t) => (
              <div key={t.id} className={styles.activityRow}>
                <span className={styles.ticketId}>{t.id}</span>
                <span className={styles.ticketArea}>{t.area}</span>
                <span className={styles.ticketTipo}>{t.tipo}</span>
                <span
                  className={styles.estadoBadge}
                  style={{ color: t.estadoColor, background: t.estadoBg }}
                >
                  {t.estado}
                </span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}