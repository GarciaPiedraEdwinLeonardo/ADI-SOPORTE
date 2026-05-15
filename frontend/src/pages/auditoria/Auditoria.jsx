// src/pages/auditoria/Auditoria.jsx
import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
    MdHistory,
    MdSearch,
    MdClose,
    MdWarning,
    MdRefresh,
    MdConfirmationNumber,
    MdSwapHoriz,
    MdPriorityHigh,
    MdPerson,
    MdNote,
    MdRedo,
    MdInfoOutline,
} from 'react-icons/md'
import Sidebar from '../../components/Sidebar/Sidebar'
import TopBar from '../../components/TopBar/TopBar'
import { ticketsService } from '../../services/ticketsService'
import styles from './Auditoria.module.css'

// ── Colores por status ────────────────────────────────────────────────────────
const STATUS_STYLE = {
    1: { label: 'Pendiente', color: '#B45309', bg: '#FEF3C7', dot: '#F59E0B' },
    2: { label: 'Asignado', color: '#0369A1', bg: '#E0F2FE', dot: '#0284C7' },
    3: { label: 'Resuelto', color: '#15803D', bg: '#DCFCE7', dot: '#16A34A' },
    4: { label: 'En Revisión', color: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDateTime(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function getHistoryMeta(entry, technicians = []) {
    switch (entry.field_changed) {
        case 'status_id':
            return {
                icon: MdSwapHoriz,
                color: '#0369A1',
                bg: '#E0F2FE',
                label: 'Cambio de estado',
                desc: `De "${entry.old_value ?? '—'}" → "${entry.new_value}"`,
            }
        case 'priority_id':
            return {
                icon: MdPriorityHigh,
                color: '#C2410C',
                bg: '#FFF7ED',
                label: 'Cambio de prioridad',
                desc: `De "${entry.old_value ?? '—'}" → "${entry.new_value}"`,
            }
        case 'assigned_to': {
            const tech = technicians.find(t => t.id === Number(entry.new_value))
            const techName = tech ? `${tech.name} ${tech.apat ?? ''}`.trim() : `técnico #${entry.new_value}`
            return {
                icon: MdPerson,
                color: '#6D28D9',
                bg: '#EDE9FE',
                label: 'Técnico asignado',
                desc: `Asignado a ${techName}`,
            }
        }
        case 'resolution_note':
            return {
                icon: MdNote,
                color: '#15803D',
                bg: '#DCFCE7',
                label: 'Nota de resolución',
                desc: entry.new_value ?? '—',
            }
        case 'reopen_reason':
            return {
                icon: MdRedo,
                color: '#B45309',
                bg: '#FEF3C7',
                label: 'Motivo de reapertura',
                desc: entry.new_value ?? '—',
            }
        case 'reopened_count':
            return {
                icon: MdRedo,
                color: '#B45309',
                bg: '#FEF3C7',
                label: 'Reapertura',
                desc: `Ticket reabierto por vez #${entry.new_value}`,
            }
        default:
            return {
                icon: MdInfoOutline,
                color: '#475569',
                bg: '#F1F5F9',
                label: entry.field_changed,
                desc: entry.new_value ?? '—',
            }
    }
}

// ── Fila de ticket ────────────────────────────────────────────────────────────
function TicketRow({ ticket, isSelected, onClick }) {
    const s = STATUS_STYLE[ticket.status?.id] ?? STATUS_STYLE[1]
    return (
        <button
            className={`${styles.ticketRow} ${isSelected ? styles.ticketRowSelected : ''}`}
            onClick={onClick}
        >
            <div className={styles.ticketRowTop}>
                <span className={styles.ticketRowBadge} style={{ color: s.color, background: s.bg }}>
                    <span className={styles.ticketRowDot} style={{ background: s.dot }} />
                    {s.label}
                </span>
            </div>
            <p className={styles.ticketRowDesc}>{ticket.description}</p>
            <span className={styles.ticketRowArea}>{ticket.areas?.name ?? '—'}</span>
        </button>
    )
}

// ── Timeline de historial ─────────────────────────────────────────────────────
function HistoryTimeline({ ticketId, technicians }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        ticketsService.getHistory(ticketId)
            .then(res => setHistory(res.data ?? []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [ticketId])

    if (loading) return (
        <div className={styles.timelineSkeleton}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={styles.timelineSkeletonItem}>
                    <div className={styles.timelineSkeletonDot} />
                    <div className={styles.timelineSkeletonBody}>
                        <div className={styles.timelineSkeletonLine} style={{ width: '45%' }} />
                        <div className={styles.timelineSkeletonLine} style={{ width: '70%' }} />
                        <div className={styles.timelineSkeletonLine} style={{ width: '35%' }} />
                    </div>
                </div>
            ))}
        </div>
    )

    if (error) return (
        <div className={styles.alertError}>
            <MdWarning size={15} /> {error}
        </div>
    )

    if (history.length === 0) return (
        <div className={styles.emptySmall}>
            <MdHistory size={28} />
            <p>Sin cambios registrados para este ticket.</p>
        </div>
    )

    return (
        <div className={styles.timeline}>
            {history.map((entry, i) => {
                const meta = getHistoryMeta(entry, technicians)
                const Icon = meta.icon
                const isLast = i === history.length - 1
                const initials = [entry.support_users?.name?.[0], entry.support_users?.apat?.[0]]
                    .filter(Boolean).join('').toUpperCase() || '?'

                return (
                    <div key={entry.id} className={styles.timelineItem}>
                        <div className={styles.timelineTrack}>
                            <div className={styles.timelineIconWrap}
                                style={{ background: meta.bg, color: meta.color }}>
                                <Icon size={14} />
                            </div>
                            {!isLast && <div className={styles.timelineConnector} />}
                        </div>

                        <div className={`${styles.timelineContent} ${isLast ? '' : styles.timelineContentBorder}`}>
                            <div className={styles.timelineTop}>
                                <span className={styles.timelineLabel} style={{ color: meta.color }}>
                                    {meta.label}
                                </span>
                                <span className={styles.timelineTime}>{formatDateTime(entry.created_at)}</span>
                            </div>
                            <p className={styles.timelineDesc}>{meta.desc}</p>
                            <div className={styles.timelineAuthorRow}>
                                <div className={styles.timelineAvatar}>{initials}</div>
                                <span className={styles.timelineAuthor}>
                                    {entry.support_users?.name} {entry.support_users?.apat ?? ''}
                                </span>
                                <span className={styles.timelineAuthorRole}>
                                    {entry.support_users?.role === 1 ? 'Administrador' : 'Técnico'}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Auditoria() {
    const location = useLocation()

    const [tickets, setTickets] = useState([])
    const [loadingTickets, setLoadingTickets] = useState(true)
    const [errorTickets, setErrorTickets] = useState(null)
    const [search, setSearch] = useState('')
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [technicians, setTechnicians] = useState([])

    // Cargar técnicos para resolver nombres en el historial
    useEffect(() => {
        ticketsService.getTechnicians()
            .then(res => setTechnicians(res.data ?? []))
            .catch(() => {}) // Silencioso
    }, [])

    const fetchTickets = useCallback(async () => {
        setLoadingTickets(true)
        setErrorTickets(null)
        try {
            const res = await ticketsService.getAll()
            setTickets(res.data ?? [])
        } catch (err) {
            setErrorTickets(err.message)
        } finally {
            setLoadingTickets(false)
        }
    }, [])

    useEffect(() => { fetchTickets() }, [fetchTickets])

    const filtered = tickets.filter(t => {
        const q = search.toLowerCase()
        if (!q) return true
        return (
            String(t.id).includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.areas?.name?.toLowerCase().includes(q) ||
            t.status?.name?.toLowerCase().includes(q)
        )
    })

    return (
        <div className={styles.root}>
            <Sidebar activePath={location.pathname} />

            <div className={styles.rightPane}>
                <TopBar />

                <main className={styles.main}>

                    {/* ── Page header ── */}
                    <header className={styles.pageHeader}>
                        <div className={styles.titleRow}>
                            <div className={styles.titleIcon}>
                                <MdHistory size={22} />
                            </div>
                            <div>
                                <h1 className={styles.pageTitle}>Auditoría</h1>
                                <p className={styles.pageSubtitle}>Historial de cambios por ticket</p>
                            </div>
                        </div>
                        <button
                            className={styles.btnRefresh}
                            onClick={fetchTickets}
                            disabled={loadingTickets}
                            aria-label="Actualizar lista"
                        >
                            <MdRefresh size={18} className={loadingTickets ? styles.spinning : ''} />
                        </button>
                    </header>

                    {/* ── Split panel ── */}
                    <div className={styles.splitPanel}>

                        {/* Panel izquierdo */}
                        <div className={styles.leftPanel}>
                            <div className={styles.searchWrap}>
                                <MdSearch className={styles.searchIcon} size={16} />
                                <input
                                    className={styles.searchInput}
                                    placeholder="Buscar por ID, descripción, área…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button className={styles.searchClear}
                                        onClick={() => setSearch('')} aria-label="Limpiar">
                                        <MdClose size={14} />
                                    </button>
                                )}
                            </div>

                            <p className={styles.listCount}>
                                {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
                            </p>

                            {loadingTickets && (
                                <div className={styles.listSkeleton}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={styles.listSkeletonItem}>
                                            <div className={styles.listSkeletonLine} style={{ width: '30%' }} />
                                            <div className={styles.listSkeletonLine} style={{ width: '85%' }} />
                                            <div className={styles.listSkeletonLine} style={{ width: '45%' }} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loadingTickets && errorTickets && (
                                <div className={styles.alertError}>
                                    <MdWarning size={14} /> {errorTickets}
                                </div>
                            )}

                            {!loadingTickets && !errorTickets && (
                                <div className={styles.ticketList}>
                                    {filtered.length === 0 ? (
                                        <div className={styles.emptySmall}>
                                            <MdConfirmationNumber size={24} />
                                            <p>{search ? 'Sin resultados.' : 'No hay tickets.'}</p>
                                        </div>
                                    ) : (
                                        filtered.map(t => (
                                            <TicketRow
                                                key={t.id}
                                                ticket={t}
                                                isSelected={selectedTicket?.id === t.id}
                                                onClick={() => setSelectedTicket(t)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Panel derecho */}
                        <div className={styles.rightPanel}>
                            {!selectedTicket ? (
                                <div className={styles.emptyPanel}>
                                    <div className={styles.emptyPanelIcon}>
                                        <MdHistory size={36} />
                                    </div>
                                    <h3 className={styles.emptyPanelTitle}>Selecciona un ticket</h3>
                                    <p className={styles.emptyPanelDesc}>
                                        Elige un ticket de la lista para ver su historial completo de cambios.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.historyHeader}>
                                        <div className={styles.historyHeaderLeft}>
                                            <p className={styles.historyTicketDesc}>
                                                {selectedTicket.description}
                                            </p>
                                        </div>
                                        {(() => {
                                            const s = STATUS_STYLE[selectedTicket.status?.id] ?? STATUS_STYLE[1]
                                            return (
                                                <span className={styles.statusBadge}
                                                    style={{ color: s.color, background: s.bg }}>
                                                    <span className={styles.statusDot} style={{ background: s.dot }} />
                                                    {s.label}
                                                </span>
                                            )
                                        })()}
                                    </div>

                                    <div className={styles.timelineWrap}>
                                        <HistoryTimeline ticketId={selectedTicket.id} technicians={technicians} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    )
}