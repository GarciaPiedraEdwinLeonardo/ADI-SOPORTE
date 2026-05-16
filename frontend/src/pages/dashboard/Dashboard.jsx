import { useState, useEffect } from 'react'
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
import { ticketsService } from '../../services/ticketsService'

export default function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState('hoy')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ticketsService.getAll()
      .then(res => setTickets(res.data ?? []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

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

  const now = new Date()
  const filteredTickets = tickets.filter(t => {
    if (selectedPeriod === 'hoy') {
      return new Date(t.created_at).toDateString() === now.toDateString()
    } else if (selectedPeriod === 'semana') {
      const diffTime = Math.abs(now - new Date(t.created_at))
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    } else if (selectedPeriod === 'mes') {
      const diffTime = Math.abs(now - new Date(t.created_at))
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 30
    }
    return true
  })

  const abiertos = filteredTickets.filter(t => [1, 2, 4].includes(t.status?.id))
  const enProceso = filteredTickets.filter(t => t.status?.id === 2 || t.status?.id === 4)
  const resueltos = filteredTickets.filter(t => t.status?.id === 3)
  const criticos = filteredTickets.filter(t => t.priority?.id === 4 && [1, 2, 4].includes(t.status?.id))

  const KPI_DATA = [
    {
      label: 'Tickets abiertos',
      value: abiertos.length,
      sub: '',
      trend: 'up',
      color: '#84CC16',
      bg: '#ECFCCB',
      icon: MdConfirmationNumber,
      barWidth: '48%',
    },
    {
      label: 'En proceso',
      value: enProceso.length,
      sub: '',
      trend: 'up',
      color: '#F59E0B',
      bg: '#FEF3C7',
      icon: MdPending,
      barWidth: '22%',
    },
    {
      label: 'Resueltos',
      value: resueltos.length,
      sub: '',
      trend: 'up',
      color: '#16A34A',
      bg: '#DCFCE7',
      icon: MdCheckCircle,
      barWidth: '90%',
    },
    {
      label: 'Críticos abiertos',
      value: criticos.length,
      sub: '',
      trend: 'down',
      color: '#DC2626',
      bg: '#FEE2E2',
      icon: MdWarning,
      barWidth: '4%',
    },
  ]

  // ── Cálculos para QUICK_STATS reales ──
  const resolvedTickets = filteredTickets.filter(t => t.status?.id === 3)
  const metSla = resolvedTickets.filter(t => t.sla_deadline && new Date(t.updated_at) <= new Date(t.sla_deadline))
  const slaPercentage = resolvedTickets.length > 0 ? Math.round((metSla.length / resolvedTickets.length) * 100) : 100
  
  let avgHours = 0
  if (resolvedTickets.length > 0) {
    const totalMs = resolvedTickets.reduce((sum, t) => sum + (new Date(t.updated_at) - new Date(t.created_at)), 0)
    avgHours = (totalMs / resolvedTickets.length / (1000 * 60 * 60)).toFixed(1)
  }

  const activeTechsCount = new Set(filteredTickets.filter(t => t.assigned_to).map(t => t.assigned_to)).size

  const REAL_QUICK_STATS = [
    { label: 'Tiempo promedio', value: loading ? '...' : `${avgHours}h`, icon: MdSpeed, color: '#84CC16', bg: '#ECFCCB' },
    { label: 'Técnicos con tickets', value: loading ? '...' : activeTechsCount, icon: MdPeople, color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'SLA cumplido', value: loading ? '...' : `${slaPercentage}%`, icon: MdCheckCircle, color: '#16A34A', bg: '#DCFCE7' },
  ]

  const RECENT_TICKETS = [...filteredTickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(t => {
      const isPendiente = t.status?.id === 1;
      const isAsignado = t.status?.id === 2;
      const isResuelto = t.status?.id === 3;
      const isRevision = t.status?.id === 4;

      return {
        id: `#TK-${t.id.toString().padStart(3, '0')}`,
        rawId: t.id,
        area: t.areas?.name ?? 'General',
        tipo: t.error_types?.name ?? 'Otros',
        estado: t.status?.name ?? 'Desconocido',
        estadoColor: isPendiente ? '#B45309' : isAsignado ? '#0369A1' : isResuelto ? '#15803D' : isRevision ? '#6D28D9' : '#B91C1C',
        estadoBg: isPendiente ? '#FEF3C7' : isAsignado ? '#E0F2FE' : isResuelto ? '#DCFCE7' : isRevision ? '#EDE9FE' : '#FEE2E2',
        tiempo: new Date(t.created_at).toLocaleDateString(),
      }
    })

  const proximosVencer = filteredTickets
    .filter(t => t.status?.id === 2 && t.sla_deadline)
    .sort((a, b) => new Date(a.sla_deadline) - new Date(b.sla_deadline))
    .slice(0, 2)

  const sinAsignar = filteredTickets
    .filter(t => t.status?.id === 1)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 2)

  const handleTicketClick = (id) => {
    if (user?.role === 1) navigate(`/tickets/admin/${id}`)
    else navigate(`/tickets/tecnico/${id}`)
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
            </div>
          </header>

          {/* Quick Stats */}
          <section className={styles.quickStats}>
            {REAL_QUICK_STATS.map((stat) => {
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
                      {loading ? '...' : k.value}
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
                  <button className={styles.btnIcon} title="Actualizar" onClick={() => {
                    setLoading(true)
                    ticketsService.getAll().then(res => setTickets(res.data ?? [])).finally(() => setLoading(false))
                  }}>
                    <MdRefresh size={18} />
                  </button>
                  <button className={styles.btnGhost} onClick={() => navigate(user?.role === 1 ? '/tickets/admin' : '/tickets/tecnico')}>
                    Ver todos
                    <MdArrowForward size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.activityList}>
                {loading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando actividad...</div>
                ) : RECENT_TICKETS.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay tickets recientes</div>
                ) : (
                  RECENT_TICKETS.map((t) => (
                    <div key={t.rawId} className={styles.activityRow} onClick={() => handleTicketClick(t.rawId)} style={{ cursor: 'pointer' }}>
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
                        <MdArrowForward size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Panel rápido derecho */}
            <aside className={styles.quickPanel}>
              {/* Próximos a vencer */}
              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>⚠️ Próximos a vencer SLA</h4>
                <div className={styles.panelList}>
                  {loading ? (
                    <div className={styles.panelItem} style={{ justifyContent: 'center', color: '#64748b' }}>Cargando...</div>
                  ) : proximosVencer.length === 0 ? (
                    <div className={styles.panelItem} style={{ justifyContent: 'center', color: '#16A34A' }}>¡Todo en orden!</div>
                  ) : (
                    proximosVencer.map(t => {
                      const diffMs = new Date(t.sla_deadline) - new Date()
                      const totalMin = Math.floor(diffMs / 60000)
                      let timeStr = ''
                      let badgeStyle = { background: '#FEF3C7', color: '#F59E0B' }
                      
                      if (totalMin <= 0) {
                        timeStr = 'Vencido'
                        badgeStyle = { background: '#FEE2E2', color: '#DC2626' }
                      } else {
                        const h = Math.floor(totalMin / 60)
                        const m = totalMin % 60
                        timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`
                        if (totalMin < 60) badgeStyle = { background: '#FEE2E2', color: '#DC2626' }
                      }

                      return (
                        <div key={t.id} className={styles.panelItem} onClick={() => handleTicketClick(t.id)} style={{ cursor: 'pointer' }}>
                          <div className={styles.panelItemLeft}>
                            <span className={styles.panelItemId}>#TK-{t.id.toString().padStart(3, '0')}</span>
                            <span className={styles.panelItemDesc}>{t.error_types?.name}</span>
                          </div>
                          <span className={styles.panelItemBadge} style={badgeStyle}>
                            {timeStr}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Tickets sin asignar */}
              {user?.role === 1 && (
                <div className={styles.panelCard}>
                  <h4 className={styles.panelTitle}>📋 Sin asignar</h4>
                  <div className={styles.panelList}>
                    {loading ? (
                      <div className={styles.panelItem} style={{ justifyContent: 'center', color: '#64748b' }}>Cargando...</div>
                    ) : sinAsignar.length === 0 ? (
                      <div className={styles.panelItem} style={{ justifyContent: 'center', color: '#64748b' }}>No hay tickets pendientes</div>
                    ) : (
                      sinAsignar.map(t => (
                        <div key={t.id} className={styles.panelItem}>
                          <div className={styles.panelItemLeft}>
                            <span className={styles.panelItemId}>#TK-{t.id.toString().padStart(3, '0')}</span>
                            <span className={styles.panelItemDesc}>{t.error_types?.name}</span>
                          </div>
                          <button className={styles.btnAssign} onClick={() => handleTicketClick(t.id)}>Ver</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
