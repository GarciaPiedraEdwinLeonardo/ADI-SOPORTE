// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicRoute } from './components'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Tecnicos from './pages/tecnicos/Tecnicos'
import Faqs from './pages/faqs/Faqs'
import TicketsAdmin from './pages/tickets/admin/TicketsAdmin'
import TicketDetailAdmin from './pages/tickets/admin/TicketDetailAdmin'
import TicketsTecnico from './pages/tickets/tecnico/TicketsTecnico'
import TicketDetailTecnico from './pages/tickets/tecnico/TicketDetailTecnico'
import Auditoria from './pages/auditoria/Auditoria'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Protected — cualquier usuario autenticado */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected — solo admin (role = 1) */}
          <Route
            path="/tecnicos"
            element={
              <ProtectedRoute requiredRole={1}>
                <Tecnicos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faqs"
            element={
              <ProtectedRoute requiredRole={1}>
                <Faqs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/auditoria"
            element={
              <ProtectedRoute requiredRole={1}>
                <Auditoria />
              </ProtectedRoute>
            }
          />

          {/* Tickets — solo admin */}
          <Route
            path="/tickets/admin"
            element={
              <ProtectedRoute requiredRole={1}>
                <TicketsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/admin/:id"
            element={
              <ProtectedRoute requiredRole={1}>
                <TicketDetailAdmin />
              </ProtectedRoute>
            }
          />

          {/* Tickets — solo técnico (role = 2) */}
          <Route
            path="/tickets/tecnico"
            element={
              <ProtectedRoute requiredRole={2}>
                <TicketsTecnico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/tecnico/:id"
            element={
              <ProtectedRoute requiredRole={2}>
                <TicketDetailTecnico />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}