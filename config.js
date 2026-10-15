/* Réglages du site Beauty Studio By M : seul fichier à modifier pour brancher l'agenda et le paiement.
   Voir RESERVATION-AGENDA.md (agenda Google via Make) et worker/README.md (paiement Stripe).
   Les prix et durées sont dans data.js (relus sur Booksy) ; les règles d'acompte et d'annulation aussi.
   Vérification : node outils/verifier-prix.mjs */
window.BSM_CFG = {
  /* true = démonstration : créneaux d'exemple, aucun paiement réel, aucune demande envoyée. */
  DEMO_MODE: true,

  /* Agenda (Make → Google Agenda de Manon). Contrat décrit dans RESERVATION-AGENDA.md. */
  BOOKING_WEBHOOK: '',      // reçoit le rendez-vous (POST JSON) et crée l'événement horaire
  AVAILABILITY_URL: '',     // renvoie les créneaux déjà pris (GET ?from=AAAA-MM-JJ&to=AAAA-MM-JJ)

  /* Paiement.
     'demo'   : simulation claire, aucune carte demandée (état actuel)
     'stripe' : redirection vers Stripe Checkout via le Worker Cloudflare (worker/checkout.js)
     'none'   : pas de paiement en ligne, la demande est envoyée à l'agenda et l'acompte se règle à l'institut */
  PAYMENT_MODE: 'demo',
  CHECKOUT_ENDPOINT: '',    // ex. https://beauty-studio-by-m-paiement.<compte>.workers.dev/checkout

  /* Réservation : créneaux toutes les 15 minutes, délai minimum de 12 h, planning ouvert 90 jours. */
  MIN_NOTICE_HOURS: 12,
  MAX_DAYS_AHEAD: 90,
  SLOT_STEP_MIN: 15,
  MAX_TOTAL_MIN: 360,

  /* Institut */
  PHONE_DISPLAY: '07 67 03 45 00',
  PHONE_TEL: '+33767034500',
  ADDRESS: '7 rue du Grand Pré, Villa Roucasse, 04130 Volx',
  LAT: 43.8775349,
  LNG: 5.8456456,
  OWNER: 'Manon',
  BRAND: 'Beauty Studio By M'
};
