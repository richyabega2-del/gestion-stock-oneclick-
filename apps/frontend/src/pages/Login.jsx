import { useState } from 'react'
import logo from '../assets/logo.png'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setChargement(true)
    setErreur('')
    try {
      const res = await axios.post('/api/auth/login', {
        email,
        motDePasse
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('utilisateur', JSON.stringify(res.data.utilisateur))
      navigate('/dashboard')
    } catch (err) {
      setErreur('Identifiant ou mot de passe incorrect')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Fond décoratif */}
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoZone}>
          <img src={logo} alt="ONECLICK" style={{ width: '140px', objectFit: 'contain' }} />
        </div>
        {/* Titre */}
        <h2 style={styles.titre}>Bienvenue 👋</h2>
        <p style={styles.sousTitre}>
          Connectez-vous pour accéder à la gestion des stocks
        </p>

        {/* Formulaire */}
        <form onSubmit={handleLogin}>
          <div style={styles.champ}>
            <label style={styles.label}>IDENTIFIANT</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div style={styles.champ}>
            <label style={styles.label}>MOT DE PASSE</label>
            <input
              type="password"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {erreur && (
            <div style={styles.erreurBox}>
              <span>⚠️ {erreur}</span>
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.bouton,
              opacity: chargement ? 0.7 : 1,
              cursor: chargement ? 'not-allowed' : 'pointer'
            }}
            disabled={chargement}
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Info démo */}
        <p style={styles.demo}>
          Première connexion ? Créez d'abord un compte admin.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f1117',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    top: '-100px',
    right: '-100px',
  },
  bgDecor2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    bottom: '-80px',
    left: '-80px',
  },
  card: {
    backgroundColor: '#1a1d27',
    padding: '48px 40px',
    borderRadius: '16px',
    width: '420px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.06)',
    position: 'relative',
    zIndex: 1,
  },
  logoZone: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  logoBox: {
    width: '42px',
    height: '42px',
    backgroundColor: '#ff6b00',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontWeight: '800',
    fontSize: '14px',
  },
  logoNom: {
    color: 'white',
    fontWeight: '800',
    fontSize: '20px',
    letterSpacing: '1px',
  },
  titre: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  sousTitre: {
    color: '#8b8fa8',
    fontSize: '14px',
    marginBottom: '32px',
    lineHeight: '1.5',
  },
  champ: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#8b8fa8',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '1px',
  },
  input: {
    padding: '14px 16px',
    backgroundColor: '#0f1117',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    transition: 'border 0.2s',
  },
  erreurBox: {
    backgroundColor: 'rgba(255, 59, 59, 0.1)',
    border: '1px solid rgba(255, 59, 59, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ff6b6b',
    fontSize: '13px',
    marginBottom: '16px',
  },
  bouton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ff6b00',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background 0.2s',
  },
  demo: {
    color: '#8b8fa8',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '24px',
  }
}
export default Login