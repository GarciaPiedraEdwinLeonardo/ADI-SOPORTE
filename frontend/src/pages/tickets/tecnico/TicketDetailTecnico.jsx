// src/pages/tickets/tecnico/TicketDetailTecnico.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
    MdArrowBack,
    MdConfirmationNumber,
    MdBusiness,
    MdErrorOutline,
    MdSchedule,
    MdWarning,
    MdCheckCircle,
    MdSend,
    MdHistory,
    MdChat,
    MdOpenInNew,
    MdRefresh,
    MdAssignment,
    MdHourglassEmpty,
    MdLock,
    MdThumbUp,
} from 'react-icons/md'
import Sidebar from '../../../components/Sidebar/Sidebar'
import TopBar from '../../../components/TopBar/TopBar'
import { ticketsService } from '../../../services/ticketsService'
import { useAuth } from '../../../context/AuthContext'
import styles from './TicketDetailTecnico.module.css'

// ── Constantes de estilo ──────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSlaInfo(sla_deadline) {
    if (!sla_deadline) return null
    const diff = new Date(sla_deadline) - new Date()
    const totalMin = Math.floor(diff / 60000)

    if (totalMin <= 0) return {
        label: 'SLA Vencido', sublabel: 'Se superó el tiempo límite',
        color: '#DC2626', bg: '#FEE2E2', barColor: '#DC2626', expired: true,
    }

    const hours = Math.floor(totalMin / 60)
    const mins = totalMin % 60

    if (hours < 2) return {
        label: `${hours}h ${mins}m restantes`, sublabel: '¡Atención urgente!',
        color: '#DC2626', bg: '#FEE2E2', barColor: '#DC2626', expired: false,
    }
    if (hours <= 24) return {
        label: `${hours}h ${mins}m restantes`, sublabel: 'Tiempo moderado',
        color: '#B45309', bg: '#FEF3C7', barColor: '#F59E0B', expired: false,
    }

    const days = Math.floor(hours / 24)
    const remH = hours % 24
    return {
        label: `${days}d ${remH}h restantes`, sublabel: 'Tiempo suficiente',
        color: '#15803D', bg: '#DCFCE7', barColor: '#16A34A', expired: false,
    }
}

function formatDateTime(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatDateShort(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg, dot }) {
    return (
        <span className={styles.badge} style={{ color, background: bg }}>
            {dot && <span className={styles.badgeDot} style={{ background: dot }} />}
            {label}
        </span>
    )
}

// ── Acción: Resolver (status 2) ───────────────────────────────────────────────
function ResolveSection({ ticket, onSuccess }) {
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const maxLen = 200

    const handleSubmit = async () => {
        if (!note.trim()) { setError('La nota de resolución es requerida'); return }
        setLoading(true); setError(null)
        try {
            await ticketsService.resolve(ticket.id, { resolution_note: note.trim() })
            onSuccess()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
                <div className={styles.actionCardIcon} style={{ background: '#ECFDF5', color: '#16A34A' }}>
                    <MdAssignment size={18} />
                </div>
                <div>
                    <span className={styles.actionCardTitle}>Marcar como resuelto</span>
                    <p className={styles.actionCardSub}>
                        Describe cómo resolviste el problema. El administrador revisará tu nota.
                    </p>
                </div>
            </div>

            {error && (
                <div className={styles.alertError}>
                    <MdWarning size={14} /> {error}
                </div>
            )}

            <div className={styles.fieldGroup}>
                <label className={styles.label}>
                    Nota de resolución <span className={styles.required}>*</span>
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Describe qué hiciste para resolver el problema…"
                    maxLength={maxLen}
                    rows={4}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                />
                <div className={styles.charRow}>
                    <span className={`${styles.charCount} ${note.length > maxLen * 0.85 ? styles.charCountWarn : ''}`}>
                        {note.length}/{maxLen}
                    </span>
                </div>
            </div>

            <button
                className={styles.btnResolve}
                onClick={handleSubmit}
                disabled={loading || !note.trim()}
            >
                {loading
                    ? <span className={styles.spinner} />
                    : <><MdCheckCircle size={17} /> Marcar como resuelto</>
                }
            </button>
        </div>
    )
}

// ── Estado informativo para status 4 (En Revisión) ───────────────────────────
function InReviewSection({ ticket }) {
    return (
        <div className={`${styles.actionCard} ${styles.actionCardReview}`}>
            <div className={styles.actionCardHeader}>
                <div className={styles.actionCardIcon} style={{ background: '#EDE9FE', color: '#8B5CF6' }}>
                    <MdHourglassEmpty size={18} />
                </div>
                <div>
                    <span className={styles.actionCardTitle}>En revisión</span>
                    <p className={styles.actionCardSub}>
                        El administrador está revisando tu resolución. Recibirás feedback pronto.
                    </p>
                </div>
            </div>
            {ticket.resolution_note && (
                <div className={styles.resolutionNote}>
                    <span className={styles.resolutionNoteLabel}>Tu nota de resolución</span>
                    <p className={styles.resolutionNoteText}>{ticket.resolution_note}</p>
                </div>
            )}
        </div>
    )
}

// ── Estado informativo para status 3 (Resuelto) ───────────────────────────────
function ResolvedSection({ ticket }) {
    return (
        <div className={`${styles.actionCard} ${styles.actionCardSuccess}`}>
            <div className={styles.actionCardHeader}>
                <div className={styles.actionCardIcon} style={{ background: '#DCFCE7', color: '#16A34A' }}>
                    <MdThumbUp size={18} />
                </div>
                <div>
                    <span className={styles.actionCardTitle}>¡Ticket aprobado!</span>
                    <p className={styles.actionCardSub}>
                        El administrador aprobó tu resolución. Ticket cerrado.
                    </p>
                </div>
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

// ── Comentarios ───────────────────────────────────────────────────────────────
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
                        {[60, 80, 50].map((w, i) => (
                            <div key={i}
                                className={`${styles.chatSkeletonRow} ${i % 2 !== 0 ? styles.chatSkeletonRight : styles.chatSkeletonLeft}`}>
                                <div className={styles.chatSkeletonBubble} style={{ width: `${w}%` }} />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && comments.length === 0 && (
                    <div className={styles.chatEmpty}>
                        No hay comentarios aún. Escribe al administrador si necesitas algo.
                    </div>
                )}

                {!loading && comments.map(c => {
                    const isMe = c.support_users?.id === currentUser?.id
                    const initials = [c.support_users?.name?.[0], c.support_users?.apat?.[0]]
                        .filter(Boolean).join('').toUpperCase() || '?'

                    return (
                        <div
                            key={c.id}
                            className={`${styles.chatMessage} ${isMe ? styles.chatMessageRight : styles.chatMessageLeft}`}
                        >
                            {!isMe && (
                                <div className={styles.chatAvatar}>{initials}</div>
                            )}
                            <div className={styles.chatBubbleWrap}>
                                <div className={styles.chatMeta}>
                                    <span className={styles.chatAuthor}>
                                        {isMe ? 'Tú' : `${c.support_users?.name ?? ''} ${c.support_users?.apat ?? ''}`}
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
                                <div
                                    className={styles.chatAvatar}
                                    style={{ background: 'linear-gradient(135deg,#84cc16,#65a30d)', color: '#fff' }}
                                >
                                    {initials}
                                </div>
                            )}
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {error && (
                <div className={styles.alertError} style={{ margin: '0 1rem 0.75rem' }}>
                    <MdWarning size={14} /> {error}
                </div>
            )}

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
                <button
                    className={styles.btnSend}
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    aria-label="Enviar comentario"
                >
                    {sending ? <span className={styles.spinner} /> : <MdSend size={17} />}
                </button>
            </div>
        </div>
    )
}

// ── Historial ─────────────────────────────────────────────────────────────────
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
                return `Prioridad cambiada a "${entry.new_value}"`
            case 'assigned_to':
                return `Asignado al técnico #${entry.new_value}`
            case 'resolution_note':
                return 'Nota de resolución agregada'
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
                <h2 className={styles.sectionTitle}>Historial</h2>
                <span className={styles.sectionCount}>{history.length}</span>
            </div>

            {loading && (
                <div className={styles.timelineSkeleton}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={styles.timelineSkeletonItem} />
                    ))}
                </div>
            )}

            {error && (
                <div className={styles.alertError} style={{ margin: '1rem' }}>
                    <MdWarning size={14} /> {error}
                </div>
            )}

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
export default function TicketDetailTecnico() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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

    useEffect(() => { fetchTicket() }, [fetchTicket])

    const status = ticket ? (STATUS_STYLE[ticket.status?.id] ?? STATUS_STYLE[2]) : null
    const priority = ticket ? (PRIORITY_STYLE[ticket.priority?.id] ?? PRIORITY_STYLE[1]) : null
    const sla = ticket ? getSlaInfo(ticket.sla_deadline) : null

    return (
        <div className={styles.root}>
            <Sidebar activePath={location.pathname} />

            <div className={styles.rightPane}>
                <TopBar />

                <main className={styles.main}>

                    {/* ── Volver ── */}
                    <button className={styles.btnBack} onClick={() => navigate('/tickets/tecnico')}>
                        <MdArrowBack size={16} /> Volver a mis tickets
                    </button>

                    {/* ── Cargando ── */}
                    {loading && (
                        <div className={styles.skeletonWrap}>
                            <div className={styles.skeletonHeader} />
                            <div className={styles.skeletonBody}>
                                {[75, 55, 40, 65].map((w, i) => (
                                    <div key={i} className={styles.skeletonLine} style={{ width: `${w}%` }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Error ── */}
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

                            {/* ── Columna izquierda ── */}
                            <div className={styles.leftCol}>

                                {/* Info card */}
                                <div className={styles.infoCard}>
                                    {/* Tira de color SLA en el top */}
                                    {sla && (
                                        <div
                                            className={styles.slaAccentBar}
                                            style={{ background: sla.barColor }}
                                        />
                                    )}

                                    <div className={styles.infoCardBody}>
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

                                        {/* Datos del ticket */}
                                        <div className={styles.infoGrid}>
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
                                                <span className={styles.infoLabel}>Asignado</span>
                                                <span className={styles.infoVal}>{formatDateShort(ticket.assigned_at)}</span>
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
                                        </div>

                                        {/* Bloque SLA destacado */}
                                        {sla ? (
                                            <div
                                                className={styles.slaBlock}
                                                style={{ background: sla.bg, borderColor: sla.color + '44' }}
                                            >
                                                <MdSchedule size={16} style={{ color: sla.color, flexShrink: 0 }} />
                                                <div className={styles.slaText}>
                                                    <span className={styles.slaLabel} style={{ color: sla.color }}>
                                                        {sla.label}
                                                    </span>
                                                    <span className={styles.slaSub}>{sla.sublabel}</span>
                                                </div>
                                                {sla.expired && (
                                                    <MdWarning
                                                        size={16}
                                                        style={{ color: sla.color, marginLeft: 'auto', flexShrink: 0 }}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className={styles.slaEmpty}>
                                                <MdSchedule size={14} />
                                                <span>Sin SLA asignado</span>
                                            </div>
                                        )}

                                        {/* Evidencia */}
                                        {ticket.evidence_url && (
                                            <a
                                                href={ticket.evidence_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.evidenceLink}
                                            >
                                                <MdOpenInNew size={14} />
                                                Ver evidencia adjunta
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* ── Sección de acción según status ── */}
                                {ticket.status?.id === 2 && (
                                    <ResolveSection ticket={ticket} onSuccess={fetchTicket} />
                                )}
                                {ticket.status?.id === 4 && (
                                    <InReviewSection ticket={ticket} />
                                )}
                                {ticket.status?.id === 3 && (
                                    <ResolvedSection ticket={ticket} />
                                )}

                                {/* Fallback para ticket sin acceso a acción */}
                                {![2, 3, 4].includes(ticket.status?.id) && (
                                    <div className={`${styles.actionCard} ${styles.actionCardLocked}`}>
                                        <div className={styles.actionCardHeader}>
                                            <div className={styles.actionCardIcon} style={{ background: '#F1F5F9', color: '#64748b' }}>
                                                <MdLock size={18} />
                                            </div>
                                            <div>
                                                <span className={styles.actionCardTitle}>Sin acción disponible</span>
                                                <p className={styles.actionCardSub}>
                                                    Este ticket tiene un estado que no requiere acción de tu parte.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
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