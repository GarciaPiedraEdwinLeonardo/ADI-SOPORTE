import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a public route to prevent authenticated users from accessing it.
 * If the user is already authenticated, it redirects them to the dashboard.
 */
export default function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}
