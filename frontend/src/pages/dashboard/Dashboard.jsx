import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MdAdd,
  MdConfirmationNumber,
  MdPending,
  MdCheckCircle,
  MdWarning,
  MdTrendingUp,
  MdTrendingDown,
  MdRefresh,
  MdFilterList,
  MdMoreVert,
  MdArrowForward,
  MdTimeline,
  MdSpeed,
  MdPeople,
} from 'react-icons/md'
import Sidebar from '../../components/Sidebar/Sidebar'
import TopBar from '../../components/TopBar/TopBar'
import styles from './Dashboard.module.css'

const KPI_DATA = [
  {
    label: 'Tickets abiertos',
    value: '24',
    sub: '+3 hoy',
    trend: 'up',
    color: '#84CC16',
    bg: '#ECFCCB',
    icon: MdConfirmationNumber,
    barWidth: '48%',
  },
  {
    label: 'En proceso',
    value: '11',
    sub: '5 con alerta',
    trend: 'up',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: MdPending,
    barWidth: '22%',
  },
  {
    label: 'Resueltos (mes)',
    value: '138',
    sub: '98% SLA',
    trend: 'up',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: MdCheckCircle,
    barWidth: '90%',
  },
  {
    label: 'Críticos abiertos',
    value: '2',
    sub: 'Atención req.',
    trend: 'down',
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
    tiempo: 'Hace 10 min',
  },
  {
    id: '#TK-040',
    area: 'Cómputo',
    tipo: 'Equipo lento',
    estado: 'En proceso',
    estadoColor: '#0284C7',
    estadoBg: '#E0F2FE',
    tiempo: 'Hace 25 min',
  },
  {
    id: '#TK-039',
    area: 'Impresión',
    tipo: 'Sin tóner',
    estado: 'Resuelto',
    estadoColor: '#16A34A',
    estadoBg: '#DCFCE7',
    tiempo: 'Hace 1 hora',
  },
  {
    id: '#TK-038',
    area: 'Software',
    tipo: 'Error login',
    estado: 'Pendiente',
    estadoColor: '#F59E0B',
    estadoBg: '#FEF3C7',
    tiempo: 'Hace 2 horas',
  },
  {
    id: '#TK-037',
    area: 'Hardware',
    tipo: 'Pantalla rota',
    estado: 'Resuelto',
    estadoColor: '#16A34A',
    estadoBg: '#DCFCE7',
    tiempo: 'Hace 3 horas',
  },
]

const QUICK_STATS = [
  { label: 'Tiempo promedio', value: '2.5h', icon: MdSpeed, color: '#84CC16', bg: '#ECFCCB' },
  { label: 'Técnicos activos', value: '8', icon: MdPeople, color: '#3B82F6', bg: '#DBEAFE' },
  { label: 'SLA cumplido', value: '98%', icon: MdCheckCircle, color: '#16A34A', bg: '#DCFCE7' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState('hoy')

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className={styles.root}>
      <Sidebar activePath={location.pathname} />
      
      <div className={styles.rightPane}>
        <TopBar />
        
        <main className={styles.main}>
          {/* Header principal */}
          <header className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.greeting}>
                <span className={styles.greetingText}>{greeting()},</span>
                <h1 className={styles.pageTitle}>
                  {user?.name} {user?.apat}
                </h1>
              </div>
              <p className={styles.pageSubtitle}>
                {today} · Resumen del sistema
              </p>
            </div>
            
            <div className={styles.headerRight}>
              <div className={styles.periodSelector}>
                {['hoy', 'semana', 'mes'].map((period) => (
                  <button
                    key={period}
                    className={`${styles.periodBtn} ${selectedPeriod === period ? styles.periodBtnActive : ''}`}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              
              <button className={styles.btnPrimary} onClick={() => navigate('/tickets/nuevo')}>
                <MdAdd size={18} />
                Nuevo ticket
              </button>
            </div>
          </header>

          {/* Quick Stats */}
          <section className={styles.quickStats}>
            {QUICK_STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className={styles.quickStatCard}>
                  <div className={styles.quickStatIcon} style={{ background: stat.bg, color: stat.color }}>
                    <Icon size={20} />
                  </div>
                  <div className={styles.quickStatInfo}>
                    <span className={styles.quickStatValue}>{stat.value}</span>
                    <span className={styles.quickStatLabel}>{stat.label}</span>
                  </div>
                </div>
              )
            })}
          </section>

          {/* KPI Cards */}
          <section className={styles.kpiGrid}>
            {KPI_DATA.map((k) => {
              const Icon = k.icon
              return (
                <div key={k.label} className={styles.kpiCard}>
                  <div className={styles.kpiHeader}>
                    <div className={styles.kpiIconWrapper} style={{ background: k.bg, color: k.color }}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.kpiTrend}>
                      {k.trend === 'up' ? (
                        <MdTrendingUp size={14} color="#16A34A" />
                      ) : (
                        <MdTrendingDown size={14} color="#DC2626" />
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.kpiBody}>
                    <span className={styles.kpiValue} style={{ color: k.color }}>
                      {k.value}
                    </span>
                    <span className={styles.kpiLabel}>{k.label}</span>
                  </div>
                  
                  <div className={styles.kpiFooter}>
                    <span className={styles.kpiSub} style={{ color: k.color }}>
                      {k.sub}
                    </span>
                    <div className={styles.kpiBar} style={{ background: k.bg }}>
                      <div
                        className={styles.kpiBarFill}
                        style={{ background: k.color, width: k.barWidth }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          {/* Tablas: Actividad reciente + Resumen rápido */}
          <div className={styles.contentGrid}>
            {/* Actividad reciente */}
            <section className={styles.activitySection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <MdTimeline className={styles.sectionIcon} />
                  <h3 className={styles.sectionTitle}>Actividad reciente</h3>
                </div>
                <div className={styles.sectionActions}>
                  <button className={styles.btnIcon} title="Filtrar">
                    <MdFilterList size={18} />
                  </button>
                  <button className={styles.btnIcon} title="Actualizar">
                    <MdRefresh size={18} />
                  </button>
                  <button className={styles.btnGhost} onClick={() => navigate('/tickets')}>
                    Ver todos
                    <MdArrowForward size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.activityList}>
                {RECENT_TICKETS.map((t) => (
                  <div key={t.id} className={styles.activityRow}>
                    <div className={styles.ticketMain}>
                      <span className={styles.ticketId}>{t.id}</span>
                      <div className={styles.ticketInfo}>
                        <span className={styles.ticketArea}>{t.area}</span>
                        <span className={styles.ticketDot}>·</span>
                        <span className={styles.ticketTipo}>{t.tipo}</span>
                      </div>
                    </div>
                    <div className={styles.ticketMeta}>
                      <span
                        className={styles.estadoBadge}
                        style={{ color: t.estadoColor, background: t.estadoBg }}
                      >
                        {t.estado}
                      </span>
                      <span className={styles.ticketTime}>{t.tiempo}</span>
                    </div>
                    <button className={styles.btnMore}>
                      <MdMoreVert size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Panel rápido derecho */}
            <aside className={styles.quickPanel}>
              {/* Próximos a vencer */}
              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>⚠️ Próximos a vencer SLA</h4>
                <div className={styles.panelList}>
                  <div className={styles.panelItem}>
                    <div className={styles.panelItemLeft}>
                      <span className={styles.panelItemId}>#TK-041</span>
                      <span className={styles.panelItemDesc}>Sin conexión - Redes</span>
                    </div>
                    <span className={styles.panelItemBadge} style={{ background: '#FEE2E2', color: '#DC2626' }}>
                      30 min
                    </span>
                  </div>
                  <div className={styles.panelItem}>
                    <div className={styles.panelItemLeft}>
                      <span className={styles.panelItemId}>#TK-042</span>
                      <span className={styles.panelItemDesc}>Impresora atascada</span>
                    </div>
                    <span className={styles.panelItemBadge} style={{ background: '#FEF3C7', color: '#F59E0B' }}>
                      1.5h
                    </span>
                  </div>
                </div>
              </div>

              {/* Tickets sin asignar */}
              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>📋 Sin asignar</h4>
                <div className={styles.panelList}>
                  <div className={styles.panelItem}>
                    <div className={styles.panelItemLeft}>
                      <span className={styles.panelItemId}>#TK-045</span>
                      <span className={styles.panelItemDesc}>Monitor parpadea</span>
                    </div>
                    <button className={styles.btnAssign}>Asignar</button>
                  </div>
                  <div className={styles.panelItem}>
                    <div className={styles.panelItemLeft}>
                      <span className={styles.panelItemId}>#TK-046</span>
                      <span className={styles.panelItemDesc}>Software no inicia</span>
                    </div>
                    <button className={styles.btnAssign}>Asignar</button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
