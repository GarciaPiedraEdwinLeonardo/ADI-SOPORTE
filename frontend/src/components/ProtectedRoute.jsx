import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route to require authentication.
 * Optionally restricts to a specific role (1 = admin).
 */
export default function ProtectedRoute({ children, requiredRole }) {
    const { isAuthenticated, user } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole !== undefined && user?.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}