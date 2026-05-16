// src/pages/tickets/admin/TicketDetailAdmin.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
    MdArrowBack,
    MdConfirmationNumber,
    MdBusiness,
    MdErrorOutline,
    MdSchedule,
    MdPerson,
    MdWarning,
    MdCheckCircle,
    MdUndo,
    MdSend,
    MdHistory,
    MdChat,
    MdOpenInNew,
    MdRefresh,
    MdAssignment,
    MdExpandMore,
    MdExpandLess,
    MdCancel,
    MdBlock,
} from 'react-icons/md'
import Sidebar from '../../../components/Sidebar/Sidebar'
import TopBar from '../../../components/TopBar/TopBar'
import { ticketsService } from '../../../services/ticketsService'
import { useAuth } from '../../../context/AuthContext'
import styles from './TicketDetailAdmin.module.css'

// ── Helpers visuales ──────────────────────────────────────────────────────────
const STATUS_STYLE = {
    1: { label: 'Pendiente', color: '#B45309', bg: '#FEF3C7', dot: '#F59E0B' },
    2: { label: 'Asignado', color: '#0369A1', bg: '#E0F2FE', dot: '#0284C7' },
    3: { label: 'Resuelto', color: '#15803D', bg: '#DCFCE7', dot: '#16A34A' },
    4: { label: 'En Revisión', color: '#6D28D9', bg: '#EDE9FE', dot: '#8B5CF6' },
    5: { label: 'Desestimado', color: '#B91C1C', bg: '#FEE2E2', dot: '#EF4444' },
}

const PRIORITY_STYLE = {
    1: { label: 'Baja', color: '#475569', bg: '#F1F5F9' },
    2: { label: 'Media', color: '#0369A1', bg: '#E0F2FE' },
    3: { label: 'Alta', color: '#C2410C', bg: '#FFF7ED' },
    4: { label: 'Urgente', color: '#DC2626', bg: '#FEE2E2' },
}

const HISTORY_LABELS = {
    status_id: 'Estado',
    priority_id: 'Prioridad',
    assigned_to: 'Técnico asignado',
    resolution_note: 'Nota de resolución',
    reopen_reason: 'Motivo de reapertura',
    reopened_count: 'Número de reaperturas',
    dismiss_reason: 'Motivo de desestimación',
}

function getSlaInfo(sla_deadline) {
    if (!sla_deadline) return null
    const diff = new Date(sla_deadline) - new Date()
    const totalMin = Math.floor(diff / 60000)
    if (totalMin <= 0) return { label: 'SLA Vencido', color: '#DC2626', bg: '#FEE2E2', expired: true }
    const hours = Math.floor(totalMin / 60)
    const mins = totalMin % 60
    if (hours > 24) return { label: `${Math.floor(hours / 24)}d ${hours % 24}h restantes`, color: '#15803D', bg: '#DCFCE7', expired: false }
    if (hours >= 2) return { label: `${hours}h ${mins}m restantes`, color: '#B45309', bg: '#FEF3C7', expired: false }
    return { label: `${hours}h ${mins}m restantes`, color: '#DC2626', bg: '#FEE2E2', expired: false }
}

function formatDateTime(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function formatDateShort(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric'
    })
}

// ── Badge genérico ────────────────────────────────────────────────────────────
function Badge({ label, color, bg, dot }) {
    return (
        <span className={styles.badge} style={{ color, background: bg }}>
            {dot && <span className={styles.badgeDot} style={{ background: dot }} />}
            {label}
        </span>
    )
}

// ── Sección: Asignar (status 1) ───────────────────────────────────────────────
function AssignSection({ ticket, onSuccess }) {
    const [technicians, setTechnicians] = useState([])
    const [loadingTechs, setLoadingTechs] = useState(true)
    const [form, setForm] = useState({ priority_id: '2', assigned_to: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    // Estados para desestimar
    const [dismissOpen, setDismissOpen] = useState(false)
    const [dismissReason, setDismissReason] = useState('')
    const [loadingDismiss, setLoadingDismiss] = useState(false)

    useEffect(() => {
        ticketsService.getTechnicians()
            .then(res => setTechnicians(res.data ?? []))
            .catch(err => setError(err.message))
            .finally(() => setLoadingTechs(false))
    }, [])

    const handleSubmit = async () => {
        if (!form.assigned_to) { setError('Selecciona un técnico'); return }
        setLoading(true); setError(null)
        try {
            await ticketsService.assign(ticket.id, {
                priority_id: Number(form.priority_id),
                assigned_to: Number(form.assigned_to),
            })
            onSuccess()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDismiss = async () => {
        if (!dismissReason.trim()) { setError('El motivo para desestimar es requerido'); return }
        setLoadingDismiss(true); setError(null)
        try {
            await ticketsService.dismiss(ticket.id, { dismiss_reason: dismissReason.trim() })
            onSuccess()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingDismiss(false)
        }
    }

    return (
        <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
                <MdAssignment size={18} />
                <span>Asignar ticket</span>
            </div>

            {error && <div className={styles.alertError}><MdWarning size={14} /> {error}</div>}

            <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Prioridad</label>
                    <select className={styles.select}
                        value={form.priority_id}
                        onChange={e => setForm(f => ({ ...f, priority_id: e.target.value }))}>
                        <option value="1">Baja</option>
                        <option value="2">Media</option>
                        <option value="3">Alta</option>
                        <option value="4">Urgente</option>
                    </select>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Técnico</label>
                    {loadingTechs
                        ? <div className={styles.selectSkeleton} />
                        : <select className={styles.select}
                            value={form.assigned_to}
                            onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                            <option value="">— Seleccionar técnico —</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} {t.apat}
                                </option>
                            ))}
                        </select>
                    }
                </div>
            </div>

            <div className={styles.reviewActions} style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading || loadingTechs || loadingDismiss} style={{ flex: 1 }}>
                    {loading ? <span className={styles.spinner} /> : 'Asignar ticket'}
                </button>

                <button 
                    className={styles.btnReopenToggle}
                    style={{ flexShrink: 0, padding: '0.65rem 1rem', background: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}
                    onClick={() => setDismissOpen(o => !o)}
                >
                    {dismissOpen ? <MdExpandLess size={16} /> : <MdBlock size={16} />}
                    Desestimar
                </button>
            </div>

            {dismissOpen && (
                <div className={styles.reopenPanel} style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                    <label className={styles.label} style={{ color: '#991B1B' }}>Motivo de desestimación <span className={styles.required}>*</span></label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Describe por qué se desestima este ticket..."
                        maxLength={200}
                        rows={3}
                        value={dismissReason}
                        onChange={e => setDismissReason(e.target.value)}
                        style={{ borderColor: '#FCA5A5' }}
                    />
                    <div className={styles.charCounter} style={{ color: '#DC2626' }}>{dismissReason.length}/200</div>
                    <button className={styles.btnReopen} style={{ background: '#DC2626', borderColor: '#DC2626', color: '#fff' }} onClick={handleDismiss}
                        disabled={loadingDismiss || loading || !dismissReason.trim()}>
                        {loadingDismiss ? <span className={styles.spinner} /> : <><MdCancel size={16} /> Confirmar desestimación</>}
                    </button>
                </div>
            )}
        </div>
    )
}

// ── Sección: Esperando resolución (status 2) ──────────────────────────────────
function WaitingSection({ ticket, techName }) {
    const sla = getSlaInfo(ticket.sla_deadline)
    return (
        <div className={`${styles.actionCard} ${styles.actionCardInfo}`}>
            <div className={styles.actionCardHeader}>
                <MdSchedule size={18} />
                <span>Esperando resolución del técnico</span>
            </div>
            <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Técnico asignado</span>
                    <span className={styles.infoVal}>{techName ?? `Técnico #${ticket.assigned_to}`}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Prioridad</span>
                    <Badge {...(PRIORITY_STYLE[ticket.priority?.id] ?? PRIORITY_STYLE[1])}
                        label={ticket.priority?.name ?? '—'} />
                </div>
                {sla && (
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>SLA</span>
                        <span style={{ color: sla.color, fontWeight: 600, fontSize: '0.85rem' }}>{sla.label}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Sección: Revisar resolución (status 4) ────────────────────────────────────
function ReviewSection({ ticket, onSuccess }) {
    const [reopenOpen, setReopenOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [loadingApprove, setLoadingApprove] = useState(false)
    const [loadingReopen, setLoadingReopen] = useState(false)
    const [error, setError] = useState(null)

    const handleApprove = async () => {
        setLoadingApprove(true); setError(null)
        try {
            await ticketsService.review(ticket.id)
            onSuccess()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingApprove(false)
        }
    }

    const handleReopen = async () => {
        if (!reason.trim()) { setError('El motivo de reapertura es requerido'); return }
        setLoadingReopen(true); setError(null)
        try {
            await ticketsService.reopen(ticket.id, { reopen_reason: reason.trim() })
            onSuccess()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingReopen(false)
        }
    }

    return (
        <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
                <MdCheckCircle size={18} />
                <span>Revisión de resolución</span>
            </div>

            {ticket.resolution_note && (
                <div className={styles.resolutionNote}>
                    <span className={styles.resolutionNoteLabel}>Nota del técnico</span>
                    <p className={styles.resolutionNoteText}>{ticket.resolution_note}</p>
                </div>
            )}

            {error && <div className={styles.alertError}><MdWarning size={14} /> {error}</div>}

            <div className={styles.reviewActions}>
                <button className={styles.btnApprove} onClick={handleApprove} disabled={loadingApprove || loadingReopen}>
                    {loadingApprove ? <span className={styles.spinner} /> : <><MdCheckCircle size={16} /> Aprobar resolución</>}
                </button>

                <button className={styles.btnReopenToggle}
                    onClick={() => setReopenOpen(o => !o)}>
                    {reopenOpen ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
                    Reabrir ticket
                </button>
            </div>

            {reopenOpen && (
                <div className={styles.reopenPanel}>
                    <label className={styles.label}>Motivo de reapertura <span className={styles.required}>*</span></label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Describe por qué se rechaza la resolución…"
                        maxLength={200}
                        rows={3}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                    <div className={styles.charCounter}>{reason.length}/200</div>
                    <button className={styles.btnReopen} onClick={handleReopen}
                        disabled={loadingReopen || loadingApprove || !reason.trim()}>
                        {loadingReopen ? <span className={styles.spinner} /> : <><MdUndo size={16} /> Confirmar reapertura</>}
                    </button>
                </div>
            )}
        </div>
    )
}

// ── Sección: Resuelto (status 3) ──────────────────────────────────────────────
function ResolvedSection({ ticket }) {
    return (
        <div className={`${styles.actionCard} ${styles.actionCardSuccess}`}>
            <div className={styles.actionCardHeader}>
                <MdCheckCircle size={18} />
                <span>Ticket resuelto</span>
            </div>
            {ticket.resolution_note && (
                <div className={styles.resolutionNote}>
                    <span className={styles.resolutionNoteLabel}>Nota de resolución</span>
                    <p className={styles.resolutionNoteText}>{ticket.resolution_note}</p>
                </div>
            )}
        </div>
    )
}

// ── Sección: Desestimado (status 5) ───────────────────────────────────────────
function DismissedSection({ ticket }) {
    return (
        <div className={`${styles.actionCard}`} style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
            <div className={styles.actionCardHeader} style={{ color: '#B91C1C' }}>
                <MdBlock size={18} />
                <span>Ticket desestimado</span>
            </div>
            {ticket.resolution_note && (
                <div className={styles.resolutionNote} style={{ background: '#fff', borderColor: '#FECACA' }}>
                    <span className={styles.resolutionNoteLabel} style={{ color: '#B91C1C' }}>Motivo de desestimación</span>
                    <p className={styles.resolutionNoteText}>{ticket.resolution_note}</p>
                </div>
            )}
        </div>
    )
}

// ── Sección: Comentarios ──────────────────────────────────────────────────────
function CommentsSection({ ticketId, currentUser }) {
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const bottomRef = useRef(null)

    const fetchComments = useCallback(async () => {
        try {
            const res = await ticketsService.getComments(ticketId)
            setComments(res.data ?? [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [ticketId])

    useEffect(() => { fetchComments() }, [fetchComments])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [comments])

    const handleSend = async () => {
        if (!message.trim()) return
        setSending(true); setError(null)
        try {
            await ticketsService.postComment(ticketId, { message: message.trim() })
            setMessage('')
            await fetchComments()
        } catch (err) {
            setError(err.message)
        } finally {
            setSending(false)
        }
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <MdChat size={18} />
                <h2 className={styles.sectionTitle}>Comentarios</h2>
                <span className={styles.sectionCount}>{comments.length}</span>
            </div>

            <div className={styles.chatBox}>
                {loading && (
                    <div className={styles.chatLoading}>
                        {[70, 50, 85].map((w, i) => (
                            <div key={i} className={`${styles.chatSkeletonRow} ${i % 2 === 0 ? styles.chatSkeletonLeft : styles.chatSkeletonRight}`}>
                                <div className={styles.chatSkeletonBubble} style={{ width: `${w}%` }} />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && comments.length === 0 && (
                    <div className={styles.chatEmpty}>No hay comentarios aún. Sé el primero en escribir.</div>
                )}

                {!loading && comments.map(c => {
                    const isMe = c.support_users?.id === currentUser?.id
                    const initials = [c.support_users?.name?.[0], c.support_users?.apat?.[0]]
                        .filter(Boolean).join('').toUpperCase() || '?'
                    return (
                        <div key={c.id}
                            className={`${styles.chatMessage} ${isMe ? styles.chatMessageRight : styles.chatMessageLeft}`}>
                            {!isMe && (
                                <div className={styles.chatAvatar}>{initials}</div>
                            )}
                            <div className={styles.chatBubbleWrap}>
                                <div className={styles.chatMeta}>
                                    <span className={styles.chatAuthor}>
                                        {isMe ? 'Tú' : `${c.support_users?.name} ${c.support_users?.apat ?? ''}`}
                                    </span>
                                    <span className={styles.chatRole}>
                                        {c.support_users?.role === 1 ? 'Admin' : 'Técnico'}
                                    </span>
                                    <span className={styles.chatTime}>{formatDateTime(c.created_at)}</span>
                                </div>
                                <div className={`${styles.chatBubble} ${isMe ? styles.chatBubbleMe : styles.chatBubbleOther}`}>
                                    {c.message}
                                </div>
                            </div>
                            {isMe && (
                                <div className={styles.chatAvatar} style={{ background: 'linear-gradient(135deg,#84cc16,#65a30d)', color: '#fff' }}>
                                    {initials}
                                </div>
                            )}
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {error && <div className={styles.alertError} style={{ marginTop: '0.5rem' }}><MdWarning size={14} /> {error}</div>}

            <div className={styles.chatInput}>
                <textarea
                    className={styles.chatTextarea}
                    placeholder="Escribe un comentario… (Enter para enviar)"
                    maxLength={200}
                    rows={2}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKey}
                />
                <button className={styles.btnSend} onClick={handleSend}
                    disabled={sending || !message.trim()}>
                    {sending ? <span className={styles.spinner} /> : <MdSend size={17} />}
                </button>
            </div>
        </div>
    )
}

// ── Sección: Historial ────────────────────────────────────────────────────────
function HistorySection({ ticketId }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        ticketsService.getHistory(ticketId)
            .then(res => setHistory(res.data ?? []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [ticketId])

    const getDescription = (entry) => {
        switch (entry.field_changed) {
            case 'status_id':
                return `Estado cambiado de "${entry.old_value ?? '—'}" a "${entry.new_value}"`
            case 'priority_id':
                return `Prioridad cambiada de "${entry.old_value ?? '—'}" a "${entry.new_value}"`
            case 'assigned_to':
                return `Asignado al técnico #${entry.new_value}`
            case 'resolution_note':
                return `Nota de resolución agregada`
            case 'reopen_reason':
                return `Motivo de reapertura: ${entry.new_value}`
            case 'reopened_count':
                return `Ticket reabierto (vez #${entry.new_value})`
            case 'dismiss_reason':
                return `Motivo de desestimación: ${entry.new_value}`
            default:
                return `${HISTORY_LABELS[entry.field_changed] ?? entry.field_changed}: ${entry.new_value ?? '—'}`
        }
    }

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <MdHistory size={18} />
                <h2 className={styles.sectionTitle}>Historial de cambios</h2>
                <span className={styles.sectionCount}>{history.length}</span>
            </div>

            {loading && (
                <div className={styles.timelineSkeleton}>
                    {[1, 2, 3].map(i => <div key={i} className={styles.timelineSkeletonItem} />)}
                </div>
            )}

            {error && <div className={styles.alertError}><MdWarning size={14} /> {error}</div>}

            {!loading && !error && history.length === 0 && (
                <div className={styles.emptySmall}>Sin cambios registrados.</div>
            )}

            {!loading && !error && history.length > 0 && (
                <div className={styles.timeline}>
                    {history.map((entry, i) => {
                        const initials = [entry.support_users?.name?.[0], entry.support_users?.apat?.[0]]
                            .filter(Boolean).join('').toUpperCase() || '?'
                        return (
                            <div key={entry.id} className={styles.timelineItem}>
                                <div className={styles.timelineLine}>
                                    <div className={styles.timelineDot} />
                                    {i < history.length - 1 && <div className={styles.timelineConnector} />}
                                </div>
                                <div className={styles.timelineContent}>
                                    <p className={styles.timelineDesc}>{getDescription(entry)}</p>
                                    <div className={styles.timelineMeta}>
                                        <span className={styles.timelineAuthorDot}>{initials}</span>
                                        <span>{entry.support_users?.name} {entry.support_users?.apat}</span>
                                        <span className={styles.timelineSep}>·</span>
                                        <span>{formatDateTime(entry.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TicketDetailAdmin() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [technicians, setTechnicians] = useState([])

    const fetchTicket = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const res = await ticketsService.getById(id)
            setTicket(res.data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [id])

    // Carga la lista de técnicos una sola vez para resolver nombres
    useEffect(() => {
        ticketsService.getTechnicians()
            .then(res => setTechnicians(res.data ?? []))
            .catch(() => {}) // silencioso: el ID es fallback
    }, [])

    useEffect(() => { fetchTicket() }, [fetchTicket])

    /** Devuelve "Nombre Apellido" del técnico, o null si no se encuentra */
    const getTechName = (techId) => {
        if (!techId) return null
        const t = technicians.find(t => t.id === techId)
        if (!t) return null
        return [t.name, t.apat].filter(Boolean).join(' ')
    }

    const status = ticket ? (STATUS_STYLE[ticket.status?.id] ?? STATUS_STYLE[1]) : null
    const priority = ticket ? (PRIORITY_STYLE[ticket.priority?.id] ?? PRIORITY_STYLE[1]) : null
    const sla = ticket ? getSlaInfo(ticket.sla_deadline) : null
    const techName = ticket ? getTechName(ticket.assigned_to) : null

    return (
        <div className={styles.root}>
            <Sidebar activePath={location.pathname} />

            <div className={styles.rightPane}>
                <TopBar />

                <main className={styles.main}>

                    {/* ── Volver ── */}
                    <button className={styles.btnBack} onClick={() => navigate('/tickets/admin')}>
                        <MdArrowBack size={16} /> Volver a tickets
                    </button>

                    {/* ── Estado: cargando ── */}
                    {loading && (
                        <div className={styles.skeletonWrap}>
                            <div className={styles.skeletonHeader} />
                            <div className={styles.skeletonBody}>
                                {[80, 60, 40, 70].map((w, i) => (
                                    <div key={i} className={styles.skeletonLine} style={{ width: `${w}%` }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Estado: error ── */}
                    {!loading && error && (
                        <div className={styles.errorState}>
                            <MdWarning size={20} />
                            <div>
                                <p className={styles.errorTitle}>No se pudo cargar el ticket</p>
                                <p className={styles.errorMsg}>{error}</p>
                            </div>
                            <button className={styles.btnRetry} onClick={fetchTicket}>
                                <MdRefresh size={14} /> Reintentar
                            </button>
                        </div>
                    )}

                    {/* ── Ticket cargado ── */}
                    {!loading && !error && ticket && (
                        <div className={styles.layout}>

                            {/* ── Columna izquierda: Info ── */}
                            <div className={styles.leftCol}>

                                {/* Info card */}
                                <div className={styles.infoCard}>
                                    <div className={styles.infoCardTop}>
                                        <div className={styles.infoCardTitleRow}>
                                            <span className={styles.ticketId}>
                                                <MdConfirmationNumber size={14} />
                                                #{ticket.id}
                                            </span>
                                            {ticket.reopened_count > 0 && (
                                                <span className={styles.reopenedBadge}>
                                                    ↩ Reabierto ×{ticket.reopened_count}
                                                </span>
                                            )}
                                        </div>
                                        <h1 className={styles.ticketDesc}>{ticket.description}</h1>
                                    </div>

                                    <div className={styles.infoGrid2}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>
                                                <MdBusiness size={13} /> Área
                                            </span>
                                            <span className={styles.infoVal}>{ticket.areas?.name ?? '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>
                                                <MdErrorOutline size={13} /> Tipo de error
                                            </span>
                                            <span className={styles.infoVal}>{ticket.error_types?.name ?? '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Creado</span>
                                            <span className={styles.infoVal}>{formatDateShort(ticket.created_at)}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>
                                                <MdPerson size={13} /> Técnico
                                            </span>
                                            <span className={styles.infoVal}>
                                                {ticket.assigned_to
                                                    ? (techName ?? `Técnico #${ticket.assigned_to}`)
                                                    : <em style={{ color: '#94a3b8' }}>Sin asignar</em>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className={styles.badgesRow}>
                                        <Badge
                                            label={status.label}
                                            color={status.color}
                                            bg={status.bg}
                                            dot={status.dot}
                                        />
                                        <Badge
                                            label={priority.label}
                                            color={priority.color}
                                            bg={priority.bg}
                                        />
                                        {sla && (
                                            <span className={styles.badge} style={{ color: sla.color, background: sla.bg }}>
                                                <MdSchedule size={12} /> {sla.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Evidence */}
                                    {ticket.evidence_url && (
                                        <a href={ticket.evidence_url} target="_blank" rel="noopener noreferrer"
                                            className={styles.evidenceLink}>
                                            <MdOpenInNew size={14} />
                                            Ver evidencia adjunta
                                        </a>
                                    )}
                                </div>

                                {/* Acción según status */}
                                {ticket.status?.id === 1 && (
                                    <AssignSection ticket={ticket} onSuccess={fetchTicket} />
                                )}
                                {ticket.status?.id === 2 && (
                                    <WaitingSection ticket={ticket} techName={techName} />
                                )}
                                {ticket.status?.id === 4 && (
                                    <ReviewSection ticket={ticket} onSuccess={fetchTicket} />
                                )}
                                {ticket.status?.id === 3 && (
                                    <ResolvedSection ticket={ticket} />
                                )}
                                {ticket.status?.id === 5 && (
                                    <DismissedSection ticket={ticket} />
                                )}
                            </div>

                            {/* ── Columna derecha: Comentarios + Historial ── */}
                            <div className={styles.rightCol}>
                                <CommentsSection ticketId={ticket.id} currentUser={user} />
                                <HistorySection ticketId={ticket.id} />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}