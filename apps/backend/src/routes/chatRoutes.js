const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const traiterQuestion = async (question) => {
  const q = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // =================== SALUTATIONS ===================
  if (q.includes("bonjour") || q.includes("salut") || q.includes("hello") || q.includes("bonsoir")) {
    return "Bonjour ! Je suis l assistant intelligent ONECLICK.\n\nJe peux vous aider avec:\n- Stocks et produits disponibles\n- Chiffre d affaires et ventes\n- Alertes et ruptures de stock\n- Rapports et analyses\n- Informations sur ONECLICK\n- Navigation dans l application\n\nPosez votre question !";
  }

  // =================== NAVIGATION ===================
  if (q.includes("ouvre") || q.includes("affiche") || q.includes("aller") || q.includes("module") || q.includes("page")) {
    if (q.includes("vente")) return "Pour acceder aux ventes, cliquez sur 'Ventes' dans le menu de gauche ou rendez-vous sur: /ventes";
    if (q.includes("stock") || q.includes("inventaire")) return "Pour acceder a l inventaire, cliquez sur 'Inventaire' dans le menu de gauche ou rendez-vous sur: /stocks";
    if (q.includes("transfert")) return "Pour acceder aux transferts, cliquez sur 'Transferts inter-sites' dans le menu de gauche ou rendez-vous sur: /transferts";
    if (q.includes("alerte")) return "Pour acceder aux alertes, cliquez sur 'Alertes' dans le menu de gauche ou rendez-vous sur: /alertes";
    if (q.includes("rapport")) return "Pour acceder aux rapports, cliquez sur 'Rapports' dans le menu de gauche ou rendez-vous sur: /rapports";
    if (q.includes("produit")) return "Pour acceder aux produits, cliquez sur 'Produits' dans le menu de gauche ou rendez-vous sur: /produits";
    if (q.includes("utilisateur")) return "Pour acceder aux utilisateurs, cliquez sur 'Utilisateurs' dans le menu de gauche ou rendez-vous sur: /utilisateurs";
    if (q.includes("tableau") || q.includes("bord") || q.includes("accueil")) return "Pour acceder au tableau de bord, cliquez sur 'Tableau de bord' dans le menu de gauche ou rendez-vous sur: /dashboard";
  }

  // =================== AIDE NAVIGATION ===================
  if (q.includes("comment") && (q.includes("creer") || q.includes("ajouter") || q.includes("enregistrer") || q.includes("faire"))) {
    if (q.includes("vente") || q.includes("facture")) return "Pour enregistrer une vente:\n1. Cliquez sur 'Nouvelle vente' en haut a droite\n2. Selectionnez le produit\n3. Choisissez le site de vente\n4. Entrez la quantite et le prix\n5. Ajoutez le client et le mode de paiement\n6. Cliquez sur 'Enregistrer la vente'";
    if (q.includes("transfert")) return "Pour creer un transfert:\n1. Allez dans 'Transferts inter-sites'\n2. Cliquez sur '+ Demander un transfert'\n3. Selectionnez le site source et destination\n4. Choisissez le produit et la quantite\n5. Cliquez sur 'Soumettre'\nNote: l administrateur doit ensuite approuver le transfert.";
    if (q.includes("produit")) return "Pour ajouter un produit:\n1. Allez dans 'Produits'\n2. Cliquez sur '+ Nouveau produit'\n3. Remplissez le nom, SKU, type, prix achat et prix vente\n4. Definissez le seuil d alerte\n5. Cliquez sur 'Ajouter'";
    if (q.includes("utilisateur") || q.includes("gestionnaire")) return "Pour creer un utilisateur:\n1. Allez dans 'Utilisateurs'\n2. Cliquez sur '+ Nouvel utilisateur'\n3. Remplissez nom, prenom, email, mot de passe\n4. Selectionnez le role (Admin ou Gestionnaire)\n5. Affectez un site\n6. Cliquez sur 'Creer'";
    if (q.includes("stock") || q.includes("entree")) return "Pour faire une entree de stock:\n1. Allez dans 'Inventaire'\n2. Cliquez sur '+ Entree stock'\n3. Selectionnez le produit et le site\n4. Entrez la quantite recue\n5. Ajoutez un motif (livraison, reapprovisionnement...)\n6. Cliquez sur 'Enregistrer'";
  }

  // =================== CHIFFRE D AFFAIRES ===================
  if ((q.includes("chiffre") || q.includes("ca") || q.includes("revenu") || q.includes("sante")) && (q.includes("mois") || q.includes("mensuel") || q.includes("entreprise"))) {
    const r = await pool.query(`
      SELECT
        COALESCE(SUM(montant_total),0) AS ca_mois,
        COUNT(*) AS nb_ventes,
        COALESCE(SUM(CASE WHEN date_trunc('month', created_at) = date_trunc('month', NOW() - interval '1 month') THEN montant_total END), 0) AS ca_mois_precedent
      FROM ventes
      WHERE created_at >= date_trunc('month', NOW())
    `);
    const { ca_mois, nb_ventes, ca_mois_precedent } = r.rows[0];
    const ca = Number(ca_mois);
    const caPrec = Number(ca_mois_precedent);
    const evolution = caPrec > 0 ? ((ca - caPrec) / caPrec * 100).toFixed(1) : 0;
    const caFormate = ca >= 1000000 ? (ca/1000000).toFixed(1) + 'M' : ca >= 1000 ? Math.round(ca/1000) + 'K' : ca;
    let analyse = ca > caPrec ? "en hausse par rapport au mois precedent." : ca < caPrec ? "en baisse par rapport au mois precedent." : "stable par rapport au mois precedent.";
    return `Rapport financier du mois en cours:\n\n- Chiffre d affaires: ${Number(ca).toLocaleString('fr-FR')} FCFA (${caFormate})\n- Nombre de ventes: ${nb_ventes}\n- Evolution: ${evolution}% ${analyse}\n\nPour plus de details, consultez le module Rapports.`;
  }

  // =================== VENTES AUJOURD'HUI ===================
  if (q.includes("aujourd") || q.includes("journee") || (q.includes("vente") && q.includes("jour"))) {
    const r = await pool.query(`
      SELECT COUNT(*) AS nb, COALESCE(SUM(montant_total),0) AS total,
        COALESCE(SUM(quantite),0) AS unites
      FROM ventes WHERE DATE(created_at) = CURRENT_DATE
    `);
    const { nb, total, unites } = r.rows[0];
    return `Bilan des ventes d aujourd hui:\n\n- Nombre de ventes: ${nb}\n- Chiffre d affaires: ${Number(total).toLocaleString('fr-FR')} FCFA\n- Unites vendues: ${unites}\n\nConsultez le module Ventes pour le detail.`;
  }

  // =================== VENTES TRIMESTRE ===================
  if (q.includes("trimestre") || q.includes("trimestriel")) {
    const r = await pool.query(`
      SELECT COALESCE(SUM(montant_total),0) AS ca, COUNT(*) AS nb
      FROM ventes WHERE created_at >= date_trunc('quarter', NOW())
    `);
    return `Ventes ce trimestre:\n\n- CA: ${Number(r.rows[0].ca).toLocaleString('fr-FR')} FCFA\n- Nombre de ventes: ${r.rows[0].nb}`;
  }

  // =================== MEILLEUR CLIENT ===================
  if (q.includes("meilleur client") || q.includes("client") && q.includes("mois")) {
    const r = await pool.query(`
      SELECT client, COUNT(*) AS nb_achats, SUM(montant_total) AS total
      FROM ventes
      WHERE date_trunc('month', created_at) = date_trunc('month', NOW())
      AND client IS NOT NULL AND client != ''
      GROUP BY client ORDER BY total DESC LIMIT 5
    `);
    if (r.rows.length === 0) return "Aucun client enregistre ce mois. Pensez a saisir les noms des clients lors des ventes.";
    let rep = "Top clients ce mois:\n\n";
    r.rows.forEach((row, i) => {
      rep += `${i+1}. ${row.client}: ${Number(row.total).toLocaleString('fr-FR')} FCFA (${row.nb_achats} achat(s))\n`;
    });
    return rep;
  }

  // =================== PRODUITS LES PLUS VENDUS ===================
  if (q.includes("plus vendu") || q.includes("top produit") || q.includes("populaire") || q.includes("meilleur produit") || q.includes("forte rotation")) {
    const r = await pool.query(`
      SELECT p.nom, SUM(lv.quantite) AS qte, SUM(lv.sous_total) AS total
      FROM lignes_vente lv JOIN produits p ON p.id = lv.produit_id
      GROUP BY p.nom ORDER BY qte DESC LIMIT 5
    `);
    if (r.rows.length === 0) return "Aucune vente enregistree pour le moment.";
    let rep = "Top 5 produits les plus vendus:\n\n";
    r.rows.forEach((row, i) => {
      rep += `${i+1}. ${row.nom}: ${row.qte} unites - ${Number(row.total).toLocaleString('fr-FR')} FCFA\n`;
    });
    return rep;
  }

  // =================== VENTES PAR SITE ===================
  if ((q.includes("vente") || q.includes("ca")) && (q.includes("site") || q.includes("agence") || q.includes("elig") || q.includes("mimboman") || q.includes("raphael"))) {
    const r = await pool.query(`
      SELECT s.nom AS site, COUNT(v.id) AS nb_ventes, COALESCE(SUM(v.montant_total),0) AS ca
      FROM ventes v JOIN sites s ON s.id = v.site_id
      WHERE date_trunc('month', v.created_at) = date_trunc('month', NOW())
      GROUP BY s.nom ORDER BY ca DESC
    `);
    if (r.rows.length === 0) return "Aucune vente ce mois.";
    let rep = "Performance par site ce mois:\n\n";
    r.rows.forEach((row, i) => {
      rep += `${i+1}. ${row.site}: ${Number(row.ca).toLocaleString('fr-FR')} FCFA (${row.nb_ventes} ventes)\n`;
    });
    const best = r.rows[0];
    rep += `\nSite le plus performant: ${best.site} avec ${Number(best.ca).toLocaleString('fr-FR')} FCFA`;
    return rep;
  }

  // =================== STOCKS DISPONIBLES ===================
  if (q.includes("stock") || q.includes("disponible") || q.includes("quantite") || q.includes("inventaire")) {
    let filtre = "";
    if (q.includes("uba")) filtre = " AND p.nom ILIKE '%UBA%'";
    else if (q.includes("access")) filtre = " AND p.nom ILIKE '%ACCESS%'";
    else if (q.includes("visa")) filtre = " AND p.nom ILIKE '%VISA%'";
    else if (q.includes("office")) filtre = " AND p.nom ILIKE '%Office%'";
    else if (q.includes("kaspersky")) filtre = " AND p.nom ILIKE '%Kaspersky%'";

    let siteFiltre = "";
    if (q.includes("elig")) siteFiltre = " AND s.nom ILIKE '%Elig%'";
    else if (q.includes("mimboman")) siteFiltre = " AND s.nom ILIKE '%Mimboman%'";
    else if (q.includes("raphael") || q.includes("ange")) siteFiltre = " AND s.nom ILIKE '%Ange%'";

    const r = await pool.query(`
      SELECT p.nom, s.nom AS site, st.quantite, p.seuil_alerte
      FROM stocks st JOIN produits p ON p.id = st.produit_id JOIN sites s ON s.id = st.site_id
      WHERE st.quantite > 0 ${filtre} ${siteFiltre}
      ORDER BY p.nom, s.nom
    `);
    if (r.rows.length === 0) return "Aucun stock disponible pour ce critere.";
    const total = r.rows.reduce((s, r) => s + parseInt(r.quantite), 0);
    let rep = `Stock disponible (${total} unites au total):\n\n`;
    r.rows.forEach(row => {
      const alerte = row.quantite <= (row.seuil_alerte || 5) ? " ⚠ STOCK BAS" : "";
      rep += `- ${row.nom} (${row.site}): ${row.quantite} unites${alerte}\n`;
    });
    return rep;
  }

  // =================== RUPTURES ET ALERTES ===================
  if (q.includes("rupture") || q.includes("alerte") || q.includes("bientot") || q.includes("critique") || q.includes("reapprovisionner") || q.includes("priorite")) {
    const r = await pool.query(`
      SELECT p.nom, s.nom AS site, st.quantite, a.seuil
      FROM alertes a
      JOIN produits p ON p.id = a.produit_id
      JOIN sites s ON s.id = a.site_id
      JOIN stocks st ON st.produit_id = a.produit_id AND st.site_id = a.site_id
      WHERE st.quantite <= a.seuil
      ORDER BY st.quantite ASC
    `);
    if (r.rows.length === 0) return "Aucune alerte de stock en ce moment. Tous les stocks sont a un niveau normal.";
    let rep = `Alertes stock (${r.rows.length} produit(s) a reapprovisionner):\n\n`;
    r.rows.forEach((row, i) => {
      const urgence = row.quantite === 0 ? "RUPTURE TOTALE" : "Stock bas";
      rep += `${i+1}. ${row.nom} - ${row.site}: ${row.quantite} unites (${urgence})\n`;
    });
    rep += `\nRecommandation: Reapprovisionnez en priorite les produits en rupture totale.`;
    return rep;
  }

  // =================== ANALYSE ET RECOMMANDATIONS ===================
  if (q.includes("recommand") || q.includes("conseil") || q.includes("que faire") || q.includes("action")) {
    const [alertesRes, ventesRes, stocksRes] = await Promise.all([
      pool.query("SELECT COUNT(*) AS nb FROM alertes a JOIN stocks st ON st.produit_id=a.produit_id AND st.site_id=a.site_id WHERE st.quantite<=a.seuil"),
      pool.query("SELECT COALESCE(SUM(montant_total),0) AS ca, COUNT(*) AS nb FROM ventes WHERE date_trunc('month',created_at)=date_trunc('month',NOW())"),
      pool.query("SELECT SUM(quantite) AS total FROM stocks")
    ]);
    const nbAlertes = parseInt(alertesRes.rows[0].nb);
    const ca = Number(ventesRes.rows[0].ca);
    const nbVentes = parseInt(ventesRes.rows[0].nb);
    let rep = "Analyse et recommandations:\n\n";
    rep += `Situation actuelle:\n- CA ce mois: ${ca.toLocaleString('fr-FR')} FCFA\n- Ventes: ${nbVentes}\n- Alertes stock: ${nbAlertes}\n\n`;
    rep += "Actions recommandees:\n";
    if (nbAlertes > 0) rep += `1. URGENT: Reapprovisionnez ${nbAlertes} produit(s) en alerte de stock\n`;
    if (nbVentes < 5) rep += `2. Le nombre de ventes est faible ce mois. Envisagez des actions commerciales.\n`;
    rep += `3. Consultez les rapports pour analyser les tendances de vente\n`;
    rep += `4. Verifiez les transferts inter-sites en attente d approbation`;
    return rep;
  }

  // =================== RAPPORT RAPIDE ===================
  if (q.includes("rapport") || q.includes("bilan") || q.includes("point") || q.includes("resume") || q.includes("sante")) {
    const [ventesRes, stocksRes, alertesRes, transfertsRes] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(montant_total),0) AS ca, COUNT(*) AS nb FROM ventes WHERE date_trunc('month',created_at)=date_trunc('month',NOW())"),
      pool.query("SELECT SUM(quantite) AS total, COUNT(DISTINCT produit_id) AS refs FROM stocks"),
      pool.query("SELECT COUNT(*) AS nb FROM alertes a JOIN stocks st ON st.produit_id=a.produit_id AND st.site_id=a.site_id WHERE st.quantite<=a.seuil"),
      pool.query("SELECT COUNT(*) AS nb FROM transferts WHERE statut='EN_ATTENTE'")
    ]);
    const ca = Number(ventesRes.rows[0].ca);
    return `Bilan general ONECLICK:\n\nVentes ce mois:\n- CA: ${ca.toLocaleString('fr-FR')} FCFA\n- Nombre de ventes: ${ventesRes.rows[0].nb}\n\nStocks:\n- Total articles: ${stocksRes.rows[0].total}\n- References: ${stocksRes.rows[0].refs}\n\nAlertes:\n- Produits en stock bas: ${alertesRes.rows[0].nb}\n\nOperations:\n- Transferts en attente: ${transfertsRes.rows[0].nb}\n\nPour plus de details, consultez le module Rapports.`;
  }

  // =================== TRANSFERTS EN ATTENTE ===================
  if (q.includes("transfert") && (q.includes("attente") || q.includes("approuv") || q.includes("valider") || q.includes("combien"))) {
    const r = await pool.query(`
      SELECT t.reference, s1.nom AS depart, s2.nom AS arrivee, t.created_at
      FROM transferts t
      JOIN sites s1 ON s1.id = t.site_depart_id
      JOIN sites s2 ON s2.id = t.site_arrivee_id
      WHERE t.statut = 'EN_ATTENTE'
      ORDER BY t.created_at DESC
    `);
    if (r.rows.length === 0) return "Aucun transfert en attente d approbation.";
    let rep = `${r.rows.length} transfert(s) en attente d approbation:\n\n`;
    r.rows.forEach((row, i) => {
      rep += `${i+1}. ${row.reference}: ${row.depart} -> ${row.arrivee}\n`;
    });
    rep += `\nPour les approuver, allez dans 'Transferts inter-sites'.`;
    return rep;
  }

  // =================== PRIX ET TARIFS ===================
  if (q.includes("prix") || q.includes("tarif") || q.includes("coute") || q.includes("combien coute")) {
    const r = await pool.query("SELECT nom, prix_vente, prix_achat FROM produits WHERE actif=true ORDER BY nom");
    let rep = "Tarifs ONECLICK:\n\n";
    r.rows.forEach(p => {
      const marge = p.prix_achat ? Math.round((p.prix_vente - p.prix_achat) / p.prix_vente * 100) : 0;
      rep += `- ${p.nom}: ${Number(p.prix_vente).toLocaleString('fr-FR')} FCFA${marge > 0 ? ` (marge: ${marge}%)` : ''}\n`;
    });
    return rep;
  }

  // =================== INFORMATIONS ONECLICK ===================
  if (q.includes("oneclick") && (q.includes("qu est") || q.includes("presentation") || q.includes("histoire") || q.includes("qui"))) {
    return "ONECLICK est une entreprise camerounaise fondee en 2012 par Mme BIAHA EMMA CATHERINE.\n\nServices:\n- Vente cartes VISA prepayees (UBA et ACCESS BANK)\n- Formation digitale agreee MINEFOP\n- Developpement d applications\n- Creation et hebergement web\n\nSites:\n- Elig-Essono (Yaounde)\n- Mimboman (Yaounde)\n- Ange Raphael (Douala)\n\nContacts:\n- Tel: 697517937 / 674092441\n- Email: oneclickcameroun@gmail.com\n\nSlogan: Simplifiez-vous la vie !";
  }

  if (q.includes("carte") || q.includes("visa") || q.includes("prepayee") || q.includes("uba") || q.includes("access")) {
    if (q.includes("comment") || q.includes("utiliser") || q.includes("marche")) {
      return "Les cartes VISA prepayees ONECLICK permettent:\n- Paiement en ligne sur tous les sites VISA\n- Retraits aux distributeurs (DAB)\n- Transferts d argent depuis l etranger\n- Achats chez les commercants\n\nDisponibles en 25 000 et 50 000 FCFA.\nPartenaires: UBA BANK et ACCESS BANK.\n\nPour commander: 697517937";
    }
    const r = await pool.query("SELECT nom, prix_vente FROM produits WHERE nom ILIKE '%VISA%' OR nom ILIKE '%carte%' ORDER BY nom");
    if (r.rows.length > 0) {
      let rep = "Cartes prepayees disponibles:\n\n";
      r.rows.forEach(p => { rep += `- ${p.nom}: ${Number(p.prix_vente).toLocaleString('fr-FR')} FCFA\n`; });
      rep += "\nPour acheter: 697517937 / 674092441";
      return rep;
    }
    return "Cartes VISA disponibles: UBA 25K, UBA 50K, ACCESS 25K, ACCESS 50K.\nContactez-nous: 697517937";
  }

  if (q.includes("formation") || q.includes("cours") || q.includes("apprendre") || q.includes("diplome")) {
    return "Academie du Digital ONECLICK (agreee MINEFOP):\n\nFormations disponibles:\n- Bureautique\n- Infographie et Web Design\n- Marketing Digital et E-commerce\n- Community Management\n- Developpement d applications\n- Gestion informatisee\n\nDiplome professionnel en fin de formation.\nInscription: 697517937 / oneclickcameroun@gmail.com";
  }

  if (q.includes("horaire") || q.includes("ouvert") || q.includes("heure")) {
    return "Horaires ONECLICK:\n- Lundi-Vendredi: 8h00 - 18h00\n- Samedi: 9h00 - 15h00\n- Dimanche: Ferme\n\nContactez-nous: 697517937 / 674092441";
  }

  if (q.includes("adresse") || q.includes("localisation") || q.includes("ou etes") || q.includes("site")) {
    return "Nos agences:\n- Elig-Essono: Avant MAHIMA, Yaounde\n- Mimboman: En face sapeur, Terminus, Yaounde\n- Ange Raphael: Douala\n\nTel: 697517937 / 674092441";
  }

  if (q.includes("contact") || q.includes("telephone") || q.includes("email") || q.includes("joindre")) {
    return "Contacts ONECLICK:\n- Tel: 697517937 / 674092441\n- Email: oneclickcameroun@gmail.com\n- Site web: www.1click.com\n\nHoraires: Lundi-Vendredi 8h-18h, Samedi 9h-15h";
  }

  // =================== REPONSE PAR DEFAUT ===================
  return "Je peux vous aider sur:\n\nVentes et finances:\n- Chiffre d affaires du mois\n- Ventes d aujourd hui\n- Meilleurs clients\n- Produits les plus vendus\n\nStocks:\n- Stock disponible par produit/site\n- Alertes et ruptures\n- Recommandations de reapprovisionnement\n\nNavigation:\n- Comment creer une vente\n- Comment faire un transfert\n- Comment ajouter un produit\n\nEntreprise:\n- Infos sur ONECLICK\n- Cartes VISA prepayees\n- Formations disponibles\n- Horaires et contacts\n\nPosez votre question !";
};

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "messages requis" });
    const dernierMessage = messages[messages.length - 1];
    const reponse = await traiterQuestion(dernierMessage.content);
    res.json({ content: reponse });
  } catch (error) {
    console.error("Erreur chatbot:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
