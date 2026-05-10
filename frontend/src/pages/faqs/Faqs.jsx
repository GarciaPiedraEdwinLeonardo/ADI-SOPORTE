// src/pages/faqs/Faqs.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdSearch,
    MdClose,
    MdQuestionAnswer,
    MdExpandMore,
    MdExpandLess,
    MdFilterList,
    MdRefresh,
    MdWarning,
    MdCheckCircle,
} from 'react-icons/md'
import Sidebar from '../../components/Sidebar/Sidebar'
import TopBar from '../../components/TopBar/TopBar'
import { faqsService } from '../../services/faqsService'
import styles from './Faqs.module.css'

// ── Paleta de áreas (color determinista por area_id) ─────────────────────────
const AREA_PALETTE = [
    { color: '#3B82F6', bg: '#EFF6FF' },
    { color: '#10B981', bg: '#ECFDF5' },
    { color: '#F59E0B', bg: '#FFFBEB' },
    { color: '#8B5CF6', bg: '#F5F3FF' },
    { color: '#EC4899', bg: '#FDF2F8' },
    { color: '#EF4444', bg: '#FEF2F2' },
    { color: '#14B8A6', bg: '#F0FDFA' },
    { color: '#F97316', bg: '#FFF7ED' },
]

const getAreaColor = (id) => {
    const n = Math.max(1, parseInt(id, 10) || 1)
    return AREA_PALETTE[(n - 1) % AREA_PALETTE.length]
}

// ── Helper para leer el área del FAQ (el API anida el objeto en faq.areas) ──
const getAreaId = (faq) => faq.areas?.id ?? faq.area_id ?? 0
const getAreaName = (faq) => faq.areas?.name ?? faq.area_name ?? `Área ${getAreaId(faq)}`

// ── Valores iniciales del form ────────────────────────────────────────────────
const EMPTY_FORM = { area_id: '', question: '', answer: '' }

// ── Validación del form ───────────────────────────────────────────────────────
const validateForm = (form) => {
    const errs = {}
    if (!form.area_id) errs.area_id = 'El área es obligatoria'
    if (!form.question || form.question.trim().length < 10)
        errs.question = 'La pregunta debe tener al menos 10 caracteres'
    if (form.question && form.question.trim().length > 80)
        errs.question = 'La pregunta no puede superar 80 caracteres'
    if (!form.answer || form.answer.trim().length < 30)
        errs.answer = 'La respuesta debe tener al menos 30 caracteres'
    if (form.answer && form.answer.trim().length > 400)
        errs.answer = 'La respuesta no puede superar 400 caracteres'
    return Object.keys(errs).length ? errs : null
}

export default function Faqs() {
    const location = useLocation()

    // ── Data state ──────────────────────────────────────────────────────────────
    const [faqs, setFaqs] = useState([])
    const [areas, setAreas] = useState([])     // derivadas de los datos (para el filtro)
    const [allAreas, setAllAreas] = useState([])     // todas las áreas desde GET /areas (para el select del modal)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // ── UI state ────────────────────────────────────────────────────────────────
    const [search, setSearch] = useState('')
    const [filterArea, setFilterArea] = useState('all')
    const [expandedId, setExpandedId] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)  // faq a eliminar
    const [editTarget, setEditTarget] = useState(null)  // faq en edición
    const [form, setForm] = useState(EMPTY_FORM)
    const [formErrors, setFormErrors] = useState({})
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [toast, setToast] = useState(null)  // { msg, type }

    const searchRef = useRef(null)

    // ── Toast auto-dismiss ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(null), 3500)
        return () => clearTimeout(t)
    }, [toast])

    // ── Carga inicial ───────────────────────────────────────────────────────────
    const loadFaqs = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await faqsService.getAll()
            const list = res.data ?? []
            setFaqs(list)
            // Derivar áreas únicas de los datos (para el filtro de la toolbar)
            const uniqueAreas = []
            const seen = new Set()
            list.forEach((f) => {
                const aid = getAreaId(f)
                if (!seen.has(aid)) {
                    seen.add(aid)
                    uniqueAreas.push({ id: aid, name: getAreaName(f) })
                }
            })
            setAreas(uniqueAreas.sort((a, b) => a.id - b.id))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // Carga todas las áreas disponibles para el select del modal
    const loadAllAreas = useCallback(async () => {
        try {
            const res = await faqsService.getAreas()
            setAllAreas(res.data ?? [])
        } catch {
            // Si falla, el select mostrará las áreas derivadas de las FAQs como fallback
            setAllAreas([])
        }
    }, [])

    useEffect(() => {
        loadFaqs()
        loadAllAreas()
    }, [loadFaqs, loadAllAreas])

    // ── Filtrado y búsqueda ─────────────────────────────────────────────────────
    const filtered = faqs.filter((f) => {
        const matchArea = filterArea === 'all' || String(getAreaId(f)) === String(filterArea)
        const q = search.toLowerCase()
        const matchSearch =
            !q ||
            f.question.toLowerCase().includes(q) ||
            f.answer.toLowerCase().includes(q) ||
            getAreaName(f).toLowerCase().includes(q)
        return matchArea && matchSearch
    })

    // Agrupar por área para la vista agrupada
    const grouped = filtered.reduce((acc, faq) => {
        const key = getAreaId(faq)
        if (!acc[key]) acc[key] = { name: getAreaName(faq), id: key, items: [] }
        acc[key].items.push(faq)
        return acc
    }, {})

    // ── Handlers del modal ──────────────────────────────────────────────────────
    const openCreate = () => {
        setEditTarget(null)
        setForm(EMPTY_FORM)
        setFormErrors({})
        setModalOpen(true)
    }

    const openEdit = (faq) => {
        setEditTarget(faq)
        setForm({ area_id: getAreaId(faq), question: faq.question, answer: faq.answer })
        setFormErrors({})
        setModalOpen(true)
    }

    const closeModal = () => {
        if (saving) return
        setModalOpen(false)
        setEditTarget(null)
        setForm(EMPTY_FORM)
        setFormErrors({})
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const handleSubmit = async () => {
        const errs = validateForm(form)
        if (errs) { setFormErrors(errs); return }

        setSaving(true)
        try {
            const payload = {
                area_id: Number(form.area_id),
                question: form.question.trim(),
                answer: form.answer.trim(),
            }
            if (editTarget) {
                await faqsService.update(editTarget.id, payload)
                setToast({ msg: 'FAQ actualizada correctamente', type: 'success' })
            } else {
                await faqsService.create(payload)
                setToast({ msg: 'FAQ creada correctamente', type: 'success' })
            }
            closeModal()
            loadFaqs()
        } catch (err) {
            setToast({ msg: err.message, type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    // ── Eliminar ────────────────────────────────────────────────────────────────
    const confirmDelete = (faq) => setDeleteTarget(faq)
    const cancelDelete = () => setDeleteTarget(null)

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await faqsService.delete(deleteTarget.id)
            setToast({ msg: 'FAQ eliminada correctamente', type: 'success' })
            setDeleteTarget(null)
            loadFaqs()
        } catch (err) {
            setToast({ msg: err.message, type: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    // ── Render ──────────────────────────────────────────────────────────────────
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
                                    <MdQuestionAnswer size={22} />
                                </div>
                                <div>
                                    <h1 className={styles.pageTitle}>Preguntas frecuentes</h1>
                                    <p className={styles.pageSubtitle}>
                                        {faqs.length} {faqs.length === 1 ? 'pregunta frecuente' : 'preguntas frecuentes'} · {areas.length} {areas.length === 1 ? 'área' : 'áreas'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.headerRight}>
                            <button
                                className={styles.btnRefresh}
                                onClick={loadFaqs}
                                aria-label="Recargar FAQs"
                                disabled={loading}
                            >
                                <MdRefresh size={18} className={loading ? styles.spinning : ''} />
                            </button>
                            <button className={styles.btnPrimary} onClick={openCreate}>
                                <MdAdd size={18} />
                                Nueva FAQ
                            </button>
                        </div>
                    </header>

                    {/* ── Toolbar: búsqueda + filtros ── */}
                    <div className={styles.toolbar}>
                        <div className={styles.searchWrap}>
                            <MdSearch className={styles.searchIcon} size={18} />
                            <input
                                ref={searchRef}
                                className={styles.searchInput}
                                placeholder="Buscar por pregunta, respuesta o área…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    className={styles.searchClear}
                                    onClick={() => { setSearch(''); searchRef.current?.focus() }}
                                    aria-label="Limpiar búsqueda"
                                >
                                    <MdClose size={16} />
                                </button>
                            )}
                        </div>

                        <div className={styles.filterWrap}>
                            <MdFilterList size={16} className={styles.filterIcon} />
                            <select
                                className={styles.filterSelect}
                                value={filterArea}
                                onChange={(e) => setFilterArea(e.target.value)}
                            >
                                <option value="all">Todas las áreas</option>
                                {areas.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Resultados label ── */}
                    {(search || filterArea !== 'all') && !loading && (
                        <p className={styles.resultsLabel}>
                            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                            {search && <> para &ldquo;<strong>{search}</strong>&rdquo;</>}
                        </p>
                    )}

                    {/* ── Estados: loading / error / vacío ── */}
                    {loading && (
                        <div className={styles.skeletonWrap}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={styles.skeletonGroup}>
                                    <div className={styles.skeletonHeader} />
                                    {[1, 2].map((j) => <div key={j} className={styles.skeletonCard} />)}
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && error && (
                        <div className={styles.errorState}>
                            <MdWarning size={22} />
                            <div>
                                <p className={styles.errorTitle}>Error al cargar las FAQs</p>
                                <p className={styles.errorMsg}>{error}</p>
                            </div>
                            <button className={styles.btnRetry} onClick={loadFaqs}>
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !error && filtered.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <MdQuestionAnswer size={32} />
                            </div>
                            <h3 className={styles.emptyTitle}>
                                {search || filterArea !== 'all' ? 'Sin resultados' : 'Aún no hay FAQs'}
                            </h3>
                            <p className={styles.emptyDesc}>
                                {search || filterArea !== 'all'
                                    ? 'Prueba con otros términos o cambia el filtro de área.'
                                    : 'Crea la primera pregunta frecuente para tu base de conocimiento.'}
                            </p>
                            {!search && filterArea === 'all' && (
                                <button className={styles.btnPrimary} onClick={openCreate}>
                                    <MdAdd size={16} /> Crear primera FAQ
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Lista agrupada por área ── */}
                    {!loading && !error && filtered.length > 0 && (
                        <div className={styles.groups}>
                            {Object.values(grouped).map((group) => {
                                const aclr = getAreaColor(group.id)
                                return (
                                    <section key={group.id} className={styles.areaGroup}>
                                        {/* Cabecera de área */}
                                        <div className={styles.areaHeader}>
                                            <div
                                                className={styles.areaDot}
                                                style={{ background: aclr.color }}
                                            />
                                            <span className={styles.areaName}>{group.name}</span>
                                            <span
                                                className={styles.areaBadge}
                                                style={{ color: aclr.color, background: aclr.bg }}
                                            >
                                                {group.items.length}
                                            </span>
                                        </div>

                                        {/* Tarjetas FAQ */}
                                        <div className={styles.faqList}>
                                            {group.items.map((faq) => {
                                                const isOpen = expandedId === faq.id
                                                return (
                                                    <div
                                                        key={faq.id}
                                                        className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}
                                                    >
                                                        {/* Pregunta row — div en lugar de button para evitar button-in-button */}
                                                        <div className={styles.faqRow}>
                                                            {/* Zona clickeable para toggle (ocupa todo el espacio disponible) */}
                                                            <div
                                                                className={styles.faqQuestion}
                                                                role="button"
                                                                tabIndex={0}
                                                                aria-expanded={isOpen}
                                                                onClick={() => setExpandedId(isOpen ? null : faq.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault()
                                                                        setExpandedId(isOpen ? null : faq.id)
                                                                    }
                                                                }}
                                                            >
                                                                <span
                                                                    className={styles.faqBullet}
                                                                    style={{ background: aclr.bg, color: aclr.color }}
                                                                >
                                                                    Q
                                                                </span>
                                                                <span className={styles.faqQuestionText}>{faq.question}</span>
                                                                <span className={styles.faqChevron}>
                                                                    {isOpen ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                                                                </span>
                                                            </div>

                                                            {/* Acciones — fuera del div toggle para que no disparen el expand */}
                                                            <div className={styles.faqActions}>
                                                                <button
                                                                    className={styles.actionBtn}
                                                                    onClick={() => openEdit(faq)}
                                                                    aria-label="Editar FAQ"
                                                                    title="Editar"
                                                                >
                                                                    <MdEdit size={16} />
                                                                </button>
                                                                <button
                                                                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                                    onClick={() => confirmDelete(faq)}
                                                                    aria-label="Eliminar FAQ"
                                                                    title="Eliminar"
                                                                >
                                                                    <MdDelete size={16} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Respuesta (expandible) */}
                                                        {isOpen && (
                                                            <div className={styles.faqAnswer}>
                                                                <span
                                                                    className={styles.faqBullet}
                                                                    style={{ background: '#ECFDF5', color: '#10B981' }}
                                                                >
                                                                    A
                                                                </span>
                                                                <p className={styles.faqAnswerText}>{faq.answer}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>
                                )
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* ══ Modal Crear / Editar ══════════════════════════════════════════════ */}
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={editTarget ? 'Editar FAQ' : 'Nueva FAQ'}
                    >
                        {/* Modal header */}
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitleGroup}>
                                <div className={styles.modalTitleIcon}>
                                    <MdQuestionAnswer size={18} />
                                </div>
                                <h2 className={styles.modalTitle}>
                                    {editTarget ? 'Editar FAQ' : 'Nueva FAQ'}
                                </h2>
                            </div>
                            <button
                                className={styles.modalClose}
                                onClick={closeModal}
                                aria-label="Cerrar modal"
                                disabled={saving}
                            >
                                <MdClose size={20} />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className={styles.modalBody}>
                            {/* Área — select poblado desde GET /areas */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Área <span className={styles.required}>*</span>
                                </label>
                                <select
                                    className={`${styles.select} ${formErrors.area_id ? styles.inputError : ''}`}
                                    name="area_id"
                                    value={form.area_id}
                                    onChange={handleFormChange}
                                >
                                    <option value="">Selecciona un área…</option>
                                    {(allAreas.length ? allAreas : areas).map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                                {formErrors.area_id && (
                                    <p className={styles.fieldError}>{formErrors.area_id}</p>
                                )}
                            </div>

                            {/* Pregunta */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Pregunta <span className={styles.required}>*</span>
                                </label>
                                <input
                                    className={`${styles.input} ${formErrors.question ? styles.inputError : ''}`}
                                    type="text"
                                    name="question"
                                    value={form.question}
                                    onChange={handleFormChange}
                                    placeholder="¿Cómo se…?"
                                    maxLength={80}
                                />
                                <div className={styles.fieldMeta}>
                                    {formErrors.question && (
                                        <p className={styles.fieldError}>{formErrors.question}</p>
                                    )}
                                    <span className={`${styles.charCount} ${form.question.length > 70 ? styles.charCountWarn : ''}`}>
                                        {form.question.length}/80
                                    </span>
                                </div>
                            </div>

                            {/* Respuesta */}
                            <div className={styles.field}>
                                <label className={styles.label}>
                                    Respuesta <span className={styles.required}>*</span>
                                </label>
                                <textarea
                                    className={`${styles.textarea} ${formErrors.answer ? styles.inputError : ''}`}
                                    name="answer"
                                    value={form.answer}
                                    onChange={handleFormChange}
                                    placeholder="Detalla la respuesta con claridad…"
                                    maxLength={400}
                                    rows={5}
                                />
                                <div className={styles.fieldMeta}>
                                    {formErrors.answer && (
                                        <p className={styles.fieldError}>{formErrors.answer}</p>
                                    )}
                                    <span className={`${styles.charCount} ${form.answer.length > 370 ? styles.charCountWarn : ''}`}>
                                        {form.answer.length}/400
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnSecondary}
                                onClick={closeModal}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving
                                    ? (editTarget ? 'Guardando…' : 'Creando…')
                                    : (editTarget ? 'Guardar cambios' : 'Crear FAQ')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Modal Confirmar Eliminación ═══════════════════════════════════════ */}
            {deleteTarget && (
                <div className={styles.modalOverlay} onClick={cancelDelete}>
                    <div
                        className={`${styles.modal} ${styles.modalSm}`}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Confirmar eliminación"
                    >
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitleGroup}>
                                <div className={`${styles.modalTitleIcon} ${styles.modalTitleIconDanger}`}>
                                    <MdWarning size={18} />
                                </div>
                                <h2 className={styles.modalTitle}>Eliminar FAQ</h2>
                            </div>
                            <button
                                className={styles.modalClose}
                                onClick={cancelDelete}
                                disabled={deleting}
                                aria-label="Cerrar"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.deleteMsg}>
                                ¿Estás seguro de que deseas eliminar la siguiente pregunta?
                            </p>
                            <div className={styles.deletePreview}>
                                <span className={styles.deletePreviewQ}>
                                    &ldquo;{deleteTarget.question}&rdquo;
                                </span>
                            </div>
                            <p className={styles.deleteWarning}>
                                Esta acción no se puede deshacer.
                            </p>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.btnSecondary}
                                onClick={cancelDelete}
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.btnDanger}
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Toast ════════════════════════════════════════════════════════════ */}
            {toast && (
                <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
                    {toast.type === 'error'
                        ? <MdWarning size={17} />
                        : <MdCheckCircle size={17} />}
                    {toast.msg}
                </div>
            )}
        </div>
    )
}