// src/pages/tickets/admin/TicketsAdmin.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    MdConfirmationNumber,
    MdRefresh,
    MdSearch,
    MdClose,
    MdFilterList,
    MdWarning,
    MdArrowForward,
    MdSchedule,
    MdPerson,
    MdBusiness,
    MdErrorOutline,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md'
import Sidebar from '../../../components/Sidebar/Sidebar'
import TopBar from '../../../components/TopBar/TopBar'
import { ticketsService } from '../../../services/ticketsService'
import styles from './TicketsAdmin.module.css'

const PAGE_SIZE = 9 // tickets por página (3 col × 3 filas)

// ── Colores por status ────────────────────────────────────────────────────────
const STATUS_STYLE = {
    1: { label: 'Pendiente', color: '#B45309', bg: '#FEF3C7', dot: '#F59E0B' },
    2: { label: 'Asignado', color: '#0369A1', bg: '#E0F2FE', dot: '#0284C7' },
    3: { label: 'Resuelto', color: '#15803D', bg: '#DCFCE7', dot: '#16A34A' },
    4: { label: 'En Revisión', color: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },
}

// ── Colores por prioridad ─────────────────────────────────────────────────────
const PRIORITY_STYLE = {
    1: { label: 'Baja', color: '#475569', bg: '#F1F5F9' },
    2: { label: 'Media', color: '#0369A1', bg: '#E0F2FE' },
    3: { label: 'Alta', color: '#C2410C', bg: '#FFF7ED' },
    4: { label: 'Urgente', color: '#DC2626', bg: '#FEE2E2' },
}

// ── Helpers SLA ───────────────────────────────────────────────────────────────
function getSlaInfo(sla_deadline) {
    if (!sla_deadline) return null
    const diff = new Date(sla_deadline) - new Date()
    const totalMin = Math.floor(diff / 60000)
    if (totalMin <= 0) return { label: 'Vencido', color: '#DC2626', bg: '#FEE2E2', expired: true }
    const hours = Math.floor(totalMin / 60)
    const mins = totalMin % 60
    if (hours > 24) return { label: `${Math.floor(hours / 24)}d ${hours % 24}h`, color: '#15803D', bg: '#DCFCE7', expired: false }
    if (hours >= 2) return { label: `${hours}h ${mins}m`, color: '#B45309', bg: '#FEF3C7', expired: false }
    return { label: `${hours}h ${mins}m`, color: '#DC2626', bg: '#FEE2E2', expired: false }
}

function formatDateShort(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Componente TicketCard ─────────────────────────────────────────────────────
function TicketCard({ ticket, techName, onClick }) {
    const status = STATUS_STYLE[ticket.status?.id] ?? STATUS_STYLE[1]
    const priority = PRIORITY_STYLE[ticket.priority?.id] ?? PRIORITY_STYLE[1]
    const sla = getSlaInfo(ticket.sla_deadline)

    return (
        <article className={styles.card} onClick={onClick} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}>

            {/* Franja de color por prioridad (top border) */}
            <div className={styles.cardAccent} style={{ background: priority.color }} />

            {/* Header */}
            <div className={styles.cardHeader}>
                <div className={styles.cardIdRow}>
                    {ticket.reopened_count > 0 && (
                        <span className={styles.reopenedBadge}>
                            ↩ Reabierto ×{ticket.reopened_count}
                        </span>
                    )}
                </div>
                <MdArrowForward className={styles.cardArrow} size={16} />
            </div>

            {/* Descripción */}
            <p className={styles.cardDesc}>{ticket.description}</p>

            {/* Área + tipo error */}
            <div className={styles.cardMeta}>
                <div className={styles.cardMetaItem}>
                    <MdBusiness size={13} />
                    <span>{ticket.areas?.name ?? '—'}</span>
                </div>
                <div className={styles.cardMetaItem}>
                    <MdErrorOutline size={13} />
                    <span>{ticket.error_types?.name ?? '—'}</span>
                </div>
            </div>

            {/* Badges */}
            <div className={styles.cardBadges}>
                <span className={styles.badge}
                    style={{ color: status.color, background: status.bg }}>
                    <span className={styles.badgeDot} style={{ background: status.dot }} />
                    {status.label}
                </span>
                <span className={styles.badge}
                    style={{ color: priority.color, background: priority.bg }}>
                    {priority.label}
                </span>
                {sla && (
                    <span className={styles.badge}
                        style={{ color: sla.color, background: sla.bg }}>
                        <MdSchedule size={11} />
                        {sla.label}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className={styles.cardFooter}>
                <div className={styles.cardFooterItem}>
                    <MdPerson size={13} />
                    <span>
                        {ticket.assigned_to
                            ? (techName ?? `Técnico #${ticket.assigned_to}`)
                            : <em className={styles.unassigned}>Sin asignar</em>}
                    </span>
                </div>
                <span className={styles.cardDate}>{formatDateShort(ticket.created_at)}</span>
            </div>
        </article>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TicketsAdmin() {
    const location = useLocation()
    const navigate = useNavigate()
    const searchRef = useRef(null)

    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [techMap, setTechMap] = useState({}) // { [id]: 'Nombre Apellido' }
    const [page, setPage] = useState(1)

    // Filtros
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterPrio, setFilterPrio] = useState('all')
    const [filterArea, setFilterArea] = useState('all')

    // ── Fetch tickets ──────────────────────────────────────────────────────────
    const fetchTickets = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await ticketsService.getAll()
            setTickets(res.data ?? [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // ── Fetch técnicos (una sola vez) ──────────────────────────────────────────
    useEffect(() => {
        ticketsService.getTechnicians()
            .then(res => {
                const map = {}
                ;(res.data ?? []).forEach(t => {
                    map[t.id] = [t.name, t.apat].filter(Boolean).join(' ')
                })
                setTechMap(map)
            })
            .catch(() => {}) // silencioso: el ID es fallback
    }, [])

    useEffect(() => { fetchTickets() }, [fetchTickets])

    // ── Áreas únicas para el filtro ────────────────────────────────────────────
    const uniqueAreas = Array.from(
        new Map(tickets.map(t => [t.areas?.id, t.areas?.name]).filter(([id]) => id)).values().map
            ? tickets.reduce((acc, t) => {
                if (t.areas?.id && !acc.find(a => a.id === t.areas.id))
                    acc.push({ id: t.areas.id, name: t.areas.name })
                return acc
            }, [])
            : []
    )
    // Más simple:
    const areas = tickets.reduce((acc, t) => {
        if (t.areas?.id && !acc.find(a => a.id === t.areas.id))
            acc.push({ id: t.areas.id, name: t.areas.name })
        return acc
    }, [])

    // ── Filtrado ───────────────────────────────────────────────────────────────
    const filtered = tickets.filter(t => {
        const q = search.toLowerCase()
        const matchSearch = !q ||
            t.description.toLowerCase().includes(q) ||
            String(t.id).includes(q) ||
            t.areas?.name?.toLowerCase().includes(q) ||
            t.error_types?.name?.toLowerCase().includes(q)
        const matchStatus = filterStatus === 'all' || String(t.status?.id) === filterStatus
        const matchPrio = filterPrio === 'all' || String(t.priority?.id) === filterPrio
        const matchArea = filterArea === 'all' || String(t.areas?.id) === filterArea
        return matchSearch && matchStatus && matchPrio && matchArea
    })

    // ── Contadores para el resumen ─────────────────────────────────────────────
    const counts = tickets.reduce((acc, t) => {
        const sid = t.status?.id
        acc[sid] = (acc[sid] ?? 0) + 1
        return acc
    }, {})

    // ── Paginación: resetear página al cambiar filtros ─────────────────────────
    useEffect(() => { setPage(1) }, [search, filterStatus, filterPrio, filterArea])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const hasFilters = search || filterStatus !== 'all' || filterPrio !== 'all' || filterArea !== 'all'

    return (
        <div className={styles.root}>
            <Sidebar activePath={location.pathname} />

            <div className={styles.rightPane}>
                <TopBar />

                <main className={styles.main}>

                    {/* ── Page header ── */}
                    <header className={styles.pageHeader}>
                        <div className={styles.headerLeft}>
                            <div className={styles.titleRow}>
                                <div className={styles.titleIcon}>
                                    <MdConfirmationNumber size={22} />
                                </div>
                                <div>
                                    <h1 className={styles.pageTitle}>Tickets</h1>
                                    <p className={styles.pageSubtitle}>
                                        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} en total
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button className={styles.btnRefresh} onClick={fetchTickets}
                            disabled={loading} aria-label="Actualizar">
                            <MdRefresh size={18} className={loading ? styles.spinning : ''} />
                        </button>
                    </header>

                    {/* ── Summary pills ── */}
                    {!loading && !error && tickets.length > 0 && (
                        <div className={styles.summaryRow}>
                            {Object.entries(STATUS_STYLE).map(([id, s]) => (
                                <button key={id}
                                    className={`${styles.summaryPill} ${filterStatus === id ? styles.summaryPillActive : ''}`}
                                    style={filterStatus === id ? { borderColor: s.dot, background: s.bg, color: s.color } : {}}
                                    onClick={() => setFilterStatus(filterStatus === id ? 'all' : id)}>
                                    <span className={styles.summaryDot} style={{ background: s.dot }} />
                                    {s.label}
                                    <span className={styles.summaryCount}>{counts[id] ?? 0}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Toolbar ── */}
                    <div className={styles.toolbar}>
                        <div className={styles.searchWrap}>
                            <MdSearch className={styles.searchIcon} size={17} />
                            <input ref={searchRef} className={styles.searchInput}
                                placeholder="Buscar por descripción, área, ID…"
                                value={search} onChange={e => setSearch(e.target.value)} />
                            {search && (
                                <button className={styles.searchClear}
                                    onClick={() => { setSearch(''); searchRef.current?.focus() }}
                                    aria-label="Limpiar búsqueda">
                                    <MdClose size={15} />
                                </button>
                            )}
                        </div>

                        <div className={styles.filtersRow}>
                            <div className={styles.filterWrap}>
                                <MdFilterList size={15} className={styles.filterIcon} />
                                <select className={styles.filterSelect}
                                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="all">Todos los estados</option>
                                    {Object.entries(STATUS_STYLE).map(([id, s]) => (
                                        <option key={id} value={id}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.filterWrap}>
                                <select className={styles.filterSelect}
                                    value={filterPrio} onChange={e => setFilterPrio(e.target.value)}>
                                    <option value="all">Toda prioridad</option>
                                    {Object.entries(PRIORITY_STYLE).map(([id, p]) => (
                                        <option key={id} value={id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            {areas.length > 0 && (
                                <div className={styles.filterWrap}>
                                    <select className={styles.filterSelect}
                                        value={filterArea} onChange={e => setFilterArea(e.target.value)}>
                                        <option value="all">Todas las áreas</option>
                                        {areas.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {hasFilters && (
                                <button className={styles.btnClearFilters}
                                    onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPrio('all'); setFilterArea('all') }}>
                                    <MdClose size={14} /> Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Resultados label ── */}
                    {hasFilters && !loading && (
                        <p className={styles.resultsLabel}>
                            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                            {search && <> para "<strong>{search}</strong>"</>}
                        </p>
                    )}

                    {/* ── Estado: cargando ── */}
                    {loading && (
                        <div className={styles.skeletonGrid}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={styles.skeletonCard}>
                                    <div className={styles.skeletonAccent} />
                                    <div className={styles.skeletonBody}>
                                        <div className={styles.skeletonLine} style={{ width: '40%' }} />
                                        <div className={styles.skeletonLine} style={{ width: '85%' }} />
                                        <div className={styles.skeletonLine} style={{ width: '60%' }} />
                                        <div className={styles.skeletonBadges}>
                                            <div className={styles.skeletonBadge} />
                                            <div className={styles.skeletonBadge} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Estado: error ── */}
                    {!loading && error && (
                        <div className={styles.errorState}>
                            <MdWarning size={20} />
                            <div>
                                <p className={styles.errorTitle}>Error al cargar los tickets</p>
                                <p className={styles.errorMsg}>{error}</p>
                            </div>
                            <button className={styles.btnRetry} onClick={fetchTickets}>Reintentar</button>
                        </div>
                    )}

                    {/* ── Estado: vacío ── */}
                    {!loading && !error && filtered.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <MdConfirmationNumber size={30} />
                            </div>
                            <h3 className={styles.emptyTitle}>
                                {hasFilters ? 'Sin resultados' : 'No hay tickets aún'}
                            </h3>
                            <p className={styles.emptyDesc}>
                                {hasFilters
                                    ? 'Prueba con otros filtros o términos de búsqueda.'
                                    : 'Los tickets creados desde el sistema ADI aparecerán aquí.'}
                            </p>
                            {hasFilters && (
                                <button className={styles.btnClearFiltersLg}
                                    onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPrio('all'); setFilterArea('all') }}>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Grid de cards ── */}
                    {!loading && !error && filtered.length > 0 && (
                        <>
                            <div className={styles.grid}>
                                {paginated.map((ticket) => (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        techName={techMap[ticket.assigned_to] ?? null}
                                        onClick={() => navigate(`/tickets/admin/${ticket.id}`)}
                                    />
                                ))}
                            </div>

                            {/* ── Paginación ── */}
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Página anterior"
                                >
                                    <MdChevronLeft size={18} />
                                    Anterior
                                </button>

                                <span className={styles.pageInfo}>
                                    Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                                    <span className={styles.pageSep}>·</span>
                                    {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
                                </span>

                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    aria-label="Página siguiente"
                                >
                                    Siguiente
                                    <MdChevronRight size={18} />
                                </button>
                            </div>
                        </>
                    )}

                </main>
            </div>
        </div>
    )
}