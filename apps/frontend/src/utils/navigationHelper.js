// Ordre logique de navigation dans l'application ONECLICK
export const ORDRE_PAGES = [
  { path: '/dashboard', nom: 'Tableau de bord' },
  { path: '/stocks', nom: 'Inventaire' },
  { path: '/ventes', nom: 'Ventes' },
  { path: '/produits', nom: 'Produits' },
  { path: '/cartes', nom: 'Cartes prépayées' },
  { path: '/transferts', nom: 'Transferts' },
  { path: '/alertes', nom: 'Alertes' },
  { path: '/rapports', nom: 'Rapports' },
  { path: '/utilisateurs', nom: 'Utilisateurs' },
]

export function getPagePrecedente(currentPath) {
  const index = ORDRE_PAGES.findIndex(p => p.path === currentPath)
  if (index <= 0) return ORDRE_PAGES[ORDRE_PAGES.length - 1] // boucle vers la fin
  return ORDRE_PAGES[index - 1]
}

export function getPageSuivante(currentPath) {
  const index = ORDRE_PAGES.findIndex(p => p.path === currentPath)
  if (index === -1 || index === ORDRE_PAGES.length - 1) return ORDRE_PAGES[0] // boucle vers le début
  return ORDRE_PAGES[index + 1]
}
