// src/pages/tecnicos/hooks/useTecnicos.js
import { useState, useEffect, useCallback } from 'react'
import { tecnicosService } from '../../../services/tecnicosService'

/**
 * Hook que encapsula toda la lógica de estado del módulo Técnicos:
 * fetch, filtrado, CRUD y notificaciones toast.
 */
export function useTecnicos() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    const [modal, setModal] = useState(null)   // null | { mode: 'create' | 'edit', user? }
    const [toast, setToast] = useState(null)   // null | { msg, type }

    // ── Fetch ──────────────────────────────────────────────────────────────────
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

    // ── Toast ──────────────────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleSaved = (savedUser, mode) => {
        if (mode === 'create') {
            setUsers((u) => [...u, savedUser])
            showToast('Usuario creado correctamente')
        } else {
            setUsers((u) => u.map((x) => (x.id === savedUser.id ? savedUser : x)))
            showToast('Usuario actualizado correctamente')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return
        try {
            await tecnicosService.delete(id)
            setUsers((u) => u.filter((x) => x.id !== id))
            showToast('Usuario eliminado correctamente')
        } catch (err) {
            showToast(err.message || 'Error al eliminar el usuario', 'error')
        }
    }

    // ── Filtrado ───────────────────────────────────────────────────────────────
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

    return {
        // Estado
        users, filtered, loading, error,
        // Búsqueda y filtros
        search, setSearch,
        filterRole, setFilterRole,
        filterStatus, setFilterStatus,
        // Modal y toast
        modal, setModal,
        toast,
        // Acciones
        fetchUsers, handleSaved, handleDelete,
    }
}
