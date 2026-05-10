import { useLocation } from 'react-router-dom'
import {
    MdAdd,
    MdSearch,
    MdClose,
    MdPerson,
    MdCancel,
    MdRefresh,
    MdCheckCircle
} from 'react-icons/md'
import Sidebar from '../../components/Sidebar/Sidebar'
import TopBar from '../../components/TopBar/TopBar'
import UserCard from './components/UserCard'
import UserModal from './components/UserModal'
import Toast from '../../components/ui/Toast'
import { useTecnicos } from './hooks/useTecnicos'
import styles from './Tecnicos.module.css'

export default function Tecnicos() {
    const location = useLocation()
    const {
        users, filtered, loading, error,
        search, setSearch,
        filterRole, setFilterRole,
        filterStatus, setFilterStatus,
        modal, setModal,
        toast,
        fetchUsers, handleSaved, handleDelete
    } = useTecnicos()

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
                <Toast msg={toast.msg} type={toast.type} />
            )}
        </div>
    )
}
