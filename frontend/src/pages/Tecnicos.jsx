// src/pages/Tecnicos.jsx
import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
    MdAdd,
    MdEdit,
    MdDelete,
    MdSearch,
    MdClose,
    MdPerson,
    MdEmail,
    MdBadge,
    MdShield,
    MdCheckCircle,
    MdCancel,
    MdRefresh,
    MdVisibility,
    MdVisibilityOff,
    MdMoreVert,
} from 'react-icons/md'
import Sidebar from '../components/Sidebar/Sidebar'
import TopBar from '../components/TopBar/TopBar'
import { tecnicosService } from '../services/tecnicosService'
import styles from './Tecnicos.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS = { 1: 'Administrador', 2: 'Técnico' }
const ROLE_COLORS = {
    1: { color: '#7C3AED', bg: '#EDE9FE' },
    2: { color: '#0284C7', bg: '#E0F2FE' },
}

const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const EMPTY_FORM = {
    name: '', apat: '', amat: '',
    email: '', password: '',
    role: 2, is_active: true,
}

const VALIDATION_RULES = {
    name: { 
        required: true, 
        minLength: 2, 
        maxLength: 80, 
        message: 'El nombre debe tener entre 2 y 80 caracteres' 
    },
    apat: { 
        required: true, 
        minLength: 3, 
        maxLength: 30, 
        message: 'El apellido paterno debe tener entre 3 y 30 caracteres' 
    },
    amat: { 
        required: false, 
        minLength: 3, 
        maxLength: 30, 
        message: 'El apellido materno debe tener entre 3 y 30 caracteres' 
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        minLength: 8,
        maxLength: 200,
        message: 'Email inválido o fuera de rango (8-200 caracteres)'
    },
    password: {
        required: (isEdit) => !isEdit,
        validate: (val, isEdit) => {
            if (isEdit && !val) return null; 
            if (!val) return 'La contraseña es requerida';
            if (val.length < 8 || val.length > 20) return 'La contraseña debe tener entre 8 y 20 caracteres';
            if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/.test(val)) return 'La contraseña contiene caracteres no permitidos';
            if (!/[a-z]/.test(val)) return 'La contraseña debe tener al menos una minúscula';
            if (!/[A-Z]/.test(val)) return 'La contraseña debe tener al menos una mayúscula';
            return null;
        }
    },
    role: { required: true, message: 'El rol es obligatorio' }
}

const validateForm = (form, isEdit) => {
    const errors = {}
    for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
        const isRequired = typeof rules.required === 'function' ? rules.required(isEdit) : rules.required
        let value = form[field]
        if (typeof value === 'string') value = value.trim()

        if (rules.validate) {
            const errorMsg = rules.validate(value, isEdit);
            if (errorMsg) errors[field] = errorMsg;
            continue;
        }

        if (isRequired && (!value || String(value) === '')) {
            errors[field] = 'Este campo es obligatorio'
            continue
        }

        if (value) {
            if (rules.pattern && !rules.pattern.test(value)) {
                errors[field] = rules.message || 'Formato inválido'
                continue
            }
            if (rules.minLength && String(value).length < rules.minLength) {
                errors[field] = rules.message || `Mínimo ${rules.minLength} caracteres`
                continue
            }
            if (rules.maxLength && String(value).length > rules.maxLength) {
                errors[field] = rules.message || `Máximo ${rules.maxLength} caracteres`
                continue
            }
        }
    }
    return Object.keys(errors).length > 0 ? errors : null
}

// ─── Avatar con inicial e inicial del apellido ────────────────────────────────

function Avatar({ user, size = 44 }) {
    const initials = [user.name?.[0], user.apat?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() || '?'

    // Color determinista basado en el id
    const hue = ((user.id ?? 0) * 47) % 360
    const style = {
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue}deg 55% 88%)`,
        color: `hsl(${hue}deg 55% 30%)`,
    }

    return (
        <div className={styles.avatar} style={style}>
            {initials}
        </div>
    )
}

// ─── Tarjeta de usuario ───────────────────────────────────────────────────────

function UserCard({ user, onEdit, onDelete, index }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS[2]

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        if (!menuOpen) return
        const close = () => setMenuOpen(false)
        document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [menuOpen])

    return (
        <article
            className={styles.card}
            style={{ animationDelay: `${index * 40}ms` }}
        >
            {/* ── Cabecera de la card ─────────────────────────────── */}
            <div className={styles.cardHeader}>
                <Avatar user={user} size={48} />

                <div className={styles.cardTitleGroup}>
                    <span className={styles.cardName}>
                        {user.name} {user.apat} {user.amat}
                    </span>
                </div>

                {/* Menú ⋮ */}
                <div
                    className={styles.cardMenuWrapper}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className={styles.btnMenu}
                        onClick={() => setMenuOpen((v) => !v)}
                        title="Más opciones"
                    >
                        <MdMoreVert size={18} />
                    </button>
                    {menuOpen && (
                        <div className={styles.dropMenu}>
                            <button
                                className={`${styles.dropItem} ${styles.dropItemDanger}`}
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDelete(user.id);
                                }}
                            >
                                <MdDelete size={15} />
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Cuerpo ─────────────────────────────────────────── */}
            <div className={styles.cardBody}>
                {/* Email */}
                <div className={styles.cardRow}>
                    <MdEmail className={styles.cardRowIcon} />
                    <span className={styles.cardRowText}>{user.email}</span>
                </div>

                {/* Creado */}
                <div className={styles.cardRow}>
                    <span className={styles.cardRowLabel}>Creado</span>
                    <span className={styles.cardRowValue}>{formatDate(user.created_at)}</span>
                </div>
            </div>

            {/* ── Pie: badges + acción ───────────────────────────── */}
            <div className={styles.cardFooter}>
                <div className={styles.cardBadges}>
                    {/* Rol */}
                    <span
                        className={styles.badge}
                        style={{ color: roleStyle.color, background: roleStyle.bg }}
                    >
                        {ROLE_LABELS[user.role] ?? 'Desconocido'}
                    </span>

                    {/* Estado */}
                    <span
                        className={styles.statusBadge}
                        style={
                            user.is_active
                                ? { color: '#16A34A', background: '#DCFCE7' }
                                : { color: '#DC2626', background: '#FEE2E2' }
                        }
                    >
                        {user.is_active
                            ? <MdCheckCircle size={12} />
                            : <MdCancel size={12} />}
                        {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>

                <button className={styles.btnEdit} onClick={() => onEdit(user)}>
                    <MdEdit size={14} />
                    Editar
                </button>
            </div>
        </article>
    )
}

// ─── Modal crear / editar ─────────────────────────────────────────────────────

function UserModal({ mode, user, onClose, onSaved }) {
    const isEdit = mode === 'edit'
    const [form, setForm] = useState(
        isEdit
            ? {
                name: user.name ?? '', apat: user.apat ?? '',
                amat: user.amat ?? '', email: user.email ?? '',
                password: '', role: user.role ?? 2,
                is_active: user.is_active ?? true,
            }
            : { ...EMPTY_FORM },
    )
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState({})

    const set = (key) => (e) => {
        const val =
            e.target.type === 'checkbox' ? e.target.checked
                : key === 'role' ? Number(e.target.value)
                    : e.target.value
        setForm((f) => ({ ...f, [key]: val }))
        if (fieldErrors[key]) {
            setFieldErrors((prev) => ({ ...prev, [key]: null }))
        }
    }

    const handleSubmit = async () => {
        const validationErrors = validateForm(form, isEdit)
        if (validationErrors) {
            setFieldErrors(validationErrors)
            setError('Por favor, corrige los errores del formulario.')
            return
        }

        setError(null)
        setLoading(true)
        try {
            if (isEdit) {
                const { name, apat, amat, email, role, is_active } = form
                const result = await tecnicosService.update(user.id, { name, apat, amat, email, role, is_active })
                onSaved(result.data, 'edit')
            } else {
                const result = await tecnicosService.create(form)
                onSaved(result.data, 'create')
            }
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitleGroup}>
                        <div className={styles.modalIcon}>
                            {isEdit ? <MdEdit size={18} /> : <MdAdd size={18} />}
                        </div>
                        <div>
                            <h2 className={styles.modalTitle}>
                                {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
                            </h2>
                            <p className={styles.modalSub}>
                                {isEdit ? `ID #${user.id}` : 'Rellena los campos para crear la cuenta'}
                            </p>
                        </div>
                    </div>
                    <button className={styles.modalClose} onClick={onClose}>
                        <MdClose size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.alertError}>
                            <MdCancel size={15} /> {error}
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <Field label="Nombre(s)" error={fieldErrors.name}>
                            <InputIcon icon={<MdPerson />}>
                                <input className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`} type="text" placeholder="Ej. Juan" maxLength={80}
                                    value={form.name} onChange={set('name')} />
                            </InputIcon>
                        </Field>

                        <Field label="Apellido paterno" error={fieldErrors.apat}>
                            <InputIcon icon={<MdBadge />}>
                                <input className={`${styles.input} ${fieldErrors.apat ? styles.inputError : ''}`} type="text" placeholder="Ej. García" maxLength={30}
                                    value={form.apat} onChange={set('apat')} />
                            </InputIcon>
                        </Field>

                        <Field label="Apellido materno" error={fieldErrors.amat}>
                            <InputIcon icon={<MdBadge />}>
                                <input className={`${styles.input} ${fieldErrors.amat ? styles.inputError : ''}`} type="text" placeholder="Ej. López" maxLength={30}
                                    value={form.amat} onChange={set('amat')} />
                            </InputIcon>
                        </Field>

                        <Field label="Correo electrónico" full error={fieldErrors.email}>
                            <InputIcon icon={<MdEmail />}>
                                <input className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`} type="email" placeholder="usuario@empresa.com" maxLength={200}
                                    value={form.email} onChange={set('email')} />
                            </InputIcon>
                        </Field>

                        {!isEdit && (
                            <Field label="Contraseña" full error={fieldErrors.password}>
                                <InputIcon icon={<MdShield />} right={
                                    <button type="button" className={styles.eyeBtn}
                                        onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                                        {showPwd ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                                    </button>
                                }>
                                    <input className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                                        type={showPwd ? 'text' : 'password'}
                                        placeholder="Mín. 8 caracteres, mayúsc. y minúsc."
                                        maxLength={20}
                                        value={form.password} onChange={set('password')} />
                                </InputIcon>
                            </Field>
                        )}

                        <Field label="Rol" error={fieldErrors.role}>
                            <select className={`${styles.select} ${fieldErrors.role ? styles.inputError : ''}`} value={form.role} onChange={set('role')}>
                                <option value={1}>Administrador</option>
                                <option value={2}>Técnico</option>
                            </select>
                        </Field>

                        {isEdit && (
                            <Field label="Estado">
                                <div className={styles.toggleRow}>
                                    <span className={styles.toggleLabel}>
                                        {form.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                </div>
                            </Field>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button className={styles.btnSave} onClick={handleSubmit} disabled={loading}>
                        {loading
                            ? <span className={styles.spinner} />
                            : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Micro-componentes de formulario
function Field({ label, children, full, error }) {
    return (
        <div className={`${styles.fieldGroup} ${full ? styles.fullWidth : ''}`}>
            <label className={styles.label}>{label}</label>
            {children}
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    )
}

function InputIcon({ icon, right, children }) {
    return (
        <div className={styles.inputWrapper}>
            <span className={styles.inputIcon}>{icon}</span>
            {children}
            {right && <span className={styles.inputRight}>{right}</span>}
        </div>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Tecnicos() {
    const location = useLocation()

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    const [modal, setModal] = useState(null)
    const [toast, setToast] = useState(null)

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await tecnicosService.getAll()
            setUsers(result.data ?? [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    // ── Toast ────────────────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    // ── onSaved ──────────────────────────────────────────────────────────────
    const handleSaved = (savedUser, mode) => {
        if (mode === 'create') {
            setUsers((u) => [...u, savedUser])
            showToast('Usuario creado correctamente')
        } else {
            setUsers((u) => u.map((x) => (x.id === savedUser.id ? savedUser : x)))
            showToast('Usuario actualizado correctamente')
        }
    }

    // ── onDelete ─────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;
        try {
            await tecnicosService.delete(id);
            setUsers((u) => u.filter((x) => x.id !== id));
            showToast('Usuario eliminado correctamente');
        } catch (err) {
            showToast(err.message || 'Error al eliminar el usuario', 'error');
        }
    }

    // ── Filtrado ─────────────────────────────────────────────────────────────
    const filtered = users.filter((u) => {
        const fullName = `${u.name} ${u.apat} ${u.amat}`.toLowerCase()
        const matchSearch =
            !search ||
            fullName.includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        const matchRole = filterRole === 'all' || String(u.role) === filterRole
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' ? u.is_active : !u.is_active)
        return matchSearch && matchRole && matchStatus
    })

    return (
        <div className={styles.root}>
            <Sidebar activePath={location.pathname} />

            <div className={styles.rightPane}>
                <TopBar />

                <main className={styles.main}>

                    {/* ── Page header ─────────────────────────────────────── */}
                    <header className={styles.pageHeader}>
                        <div>
                            <h1 className={styles.pageTitle}>Usuarios</h1>
                            <p className={styles.pageSub}>
                                {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className={styles.headerRight}>
                            <button className={styles.btnRefresh} onClick={fetchUsers} title="Actualizar">
                                <MdRefresh size={18} />
                            </button>
                            <button className={styles.btnPrimary} onClick={() => setModal({ mode: 'create' })}>
                                <MdAdd size={18} />
                                Nuevo usuario
                            </button>
                        </div>
                    </header>

                    {/* ── Toolbar ─────────────────────────────────────────── */}
                    <div className={styles.toolbar}>
                        <div className={styles.searchWrapper}>
                            <MdSearch className={styles.searchIcon} />
                            <input
                                className={styles.searchInput}
                                type="text"
                                placeholder="Buscar por nombre o correo…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button className={styles.searchClear} onClick={() => setSearch('')}>
                                    <MdClose size={16} />
                                </button>
                            )}
                        </div>

                        <div className={styles.filters}>
                            <select className={styles.filterSelect} value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}>
                                <option value="all">Todos los roles</option>
                                <option value="1">Administrador</option>
                                <option value="2">Técnico</option>
                            </select>

                            <select className={styles.filterSelect} value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">Cualquier estado</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>
                    </div>

                    {/* ── Estados ──────────────────────────────────────────── */}
                    {loading && (
                        <div className={styles.stateBox}>
                            <span className={styles.spinnerLg} />
                            <p>Cargando usuarios…</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className={styles.stateBox}>
                            <MdCancel size={36} color="#DC2626" />
                            <p className={styles.errorMsg}>{error}</p>
                            <button className={styles.btnRetry} onClick={fetchUsers}>Reintentar</button>
                        </div>
                    )}

                    {/* ── Grid de cards ────────────────────────────────────── */}
                    {!loading && !error && (
                        <>
                            {filtered.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <MdPerson size={52} className={styles.emptyIcon} />
                                    <p className={styles.emptyTitle}>
                                        {search || filterRole !== 'all' || filterStatus !== 'all'
                                            ? 'Sin resultados para los filtros aplicados'
                                            : 'No hay usuarios registrados'}
                                    </p>
                                    {!search && filterRole === 'all' && filterStatus === 'all' && (
                                        <button className={styles.btnPrimary}
                                            onClick={() => setModal({ mode: 'create' })}>
                                            <MdAdd size={18} /> Crear primer usuario
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={styles.grid}>
                                        {filtered.map((u, i) => (
                                            <UserCard
                                                key={u.id}
                                                user={u}
                                                index={i}
                                                onEdit={(usr) => setModal({ mode: 'edit', user: usr })}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                    <p className={styles.gridFooter}>
                                        Mostrando {filtered.length} de {users.length} usuario{users.length !== 1 ? 's' : ''}
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* ── Modal ──────────────────────────────────────────────── */}
            {modal && (
                <UserModal
                    mode={modal.mode}
                    user={modal.user}
                    onClose={() => setModal(null)}
                    onSaved={handleSaved}
                />
            )}

            {/* ── Toast ──────────────────────────────────────────────── */}
            {toast && (
                <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
                    {toast.type === 'error' ? <MdCancel size={17} /> : <MdCheckCircle size={17} />}
                    {toast.msg}
                </div>
            )}
        </div>
    )
}