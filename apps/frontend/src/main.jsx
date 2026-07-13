import axios from 'axios'
axios.defaults.baseURL = import.meta.env.VITE_API_URL
import './responsive.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)