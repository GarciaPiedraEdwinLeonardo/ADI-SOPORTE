import { useState, useEffect } from 'react'
import {
    MdEdit,
    MdDelete,
    MdEmail,
    MdCheckCircle,
    MdCancel,
    MdMoreVert,
} from 'react-icons/md'
import { ROLE_LABELS, ROLE_COLORS } from '../../../utils/validators'
import { formatDate } from '../../../utils/helpers'
import Avatar from '../../../components/ui/Avatar'
import styles from './UserCard.module.css'

export default function UserCard({ user, onEdit, onDelete, index }) {
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
