import { createContext, useContext, useState, useEffect } from 'react'

const SiteContext = createContext()

export function SiteProvider({ children }) {
  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || '{}')
  
  // Si gestionnaire, son site est fixe. Si admin, peut choisir.
  const siteInitial = utilisateur?.role === 'GESTIONNAIRE' 
    ? utilisateur.site_id 
    : null // null = tous les sites

  const [siteActifId, setSiteActifId] = useState(siteInitial)
  const [siteActifNom, setSiteActifNom] = useState(
    utilisateur?.role === 'GESTIONNAIRE' ? utilisateur.site_nom || 'Mon site' : 'Tous les sites'
  )

  const changerSite = (id, nom) => {
    // Un gestionnaire ne peut pas changer de site
    if (utilisateur?.role === 'GESTIONNAIRE') return
    setSiteActifId(id)
    setSiteActifNom(id ? nom : 'Tous les sites')
  }

  return (
    <SiteContext.Provider value={{ siteActifId, siteActifNom, changerSite, utilisateur }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  return useContext(SiteContext)
}
