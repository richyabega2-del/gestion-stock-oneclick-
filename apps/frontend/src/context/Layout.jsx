import Sidebar from './Sidebar'
import { useNavigate } from 'react-router-dom'

function Layout({ children, titre, showBack = false }) {
  const navigate = useNavigate()

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:'#0f1117', color:'white', fontFamily:"'Inter', sans-serif" }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'auto' }}>
        {/* Header avec boutons navigation */}
        <div style={styles.header}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            {showBack && (
              <button style={styles.btnNav} onClick={() => navigate(-1)} title="Page précédente">
                ← Retour
              </button>
            )}
            <h1 style={styles.titre}>{titre}</h1>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button style={styles.btnNav} onClick={() => navigate(-1)}>← Retour</button>
            <button style={styles.btnNav} onClick={() => navigate(1)}>Suivant →</button>
            <button style={styles.btnPrimaire} onClick={() => navigate('/dashboard')}>🏠 Accueil</button>
          </div>
        </div>

        {/* Contenu de la page */}
        <div style={{ padding:'24px', flex:1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: { padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1a1d27', position:'sticky', top:0, zIndex:100 },
  titre: { fontSize:'20px', fontWeight:'700' },
  btnNav: { padding:'7px 14px', backgroundColor:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'white', fontSize:'12px', cursor:'pointer' },
  btnPrimaire: { padding:'7px 14px', backgroundColor:'#ff6b00', border:'none', borderRadius:'8px', color:'white', fontSize:'12px', cursor:'pointer', fontWeight:'600' },
}

export default Layout
