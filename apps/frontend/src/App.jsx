import { SiteProvider } from './context/SiteContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Stocks       from './pages/Stocks'
import Produits     from './pages/Produits'
import Ventes       from './pages/Ventes'
import Transferts   from './pages/Transferts'
import Alertes      from './pages/Alertes'
import Rapports     from './pages/Rapports'
import Utilisateurs from './pages/Utilisateurs'
import CartesPrepayees from './pages/CartesPrepayees' 
import Chatbot from './components/Chatbot'

// Protection des routes — redirige vers /login si pas connecté
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return (
    <>
      {children}
      <Chatbot />
    </>
  )
}

function App() {
  return (
  <SiteProvider>
    <BrowserRouter>
      <Routes>

        {/* Route publique */}
        <Route path="/login" element={<Login />} />

        {/* Redirection racine */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="/stocks" element={
          <ProtectedRoute><Stocks /></ProtectedRoute>
        } />

        <Route path="/produits" element={
          <ProtectedRoute><Produits /></ProtectedRoute>
        } />

        <Route path="/ventes" element={
          <ProtectedRoute><Ventes /></ProtectedRoute>
        } />

        <Route path="/transferts" element={
          <ProtectedRoute><Transferts /></ProtectedRoute>
        } />

        <Route path="/alertes" element={
          <ProtectedRoute><Alertes /></ProtectedRoute>
        } />

        <Route path="/rapports" element={
          <ProtectedRoute><Rapports /></ProtectedRoute>
        } />

        <Route path="/utilisateurs" element={
          <ProtectedRoute><Utilisateurs /></ProtectedRoute>
        } />
        <Route path="/cartes" element={
          <ProtectedRoute><CartesPrepayees /></ProtectedRoute>
        } />
        {/* Route 404 — redirige vers dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  </SiteProvider>
)
}

export default App
