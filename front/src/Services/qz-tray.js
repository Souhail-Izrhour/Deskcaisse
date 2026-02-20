// Services/qz-tray.js
import * as qz from 'qz-tray';
import AxiosClient from '../Services/AxiosClient';

let qzInitialized = false;
let cachedCertificate = null;

// Fonction de debug
const debugLog = (message, data = null) => {
  console.log('[QZ DEBUG]', message, data ?? '');
};

// Charger et stocker le certificat (une seule fois)
export const initCertificate = async () => {
  if (cachedCertificate) return cachedCertificate;

  try {
    const response = await AxiosClient.get('/qz/certificate');
    cachedCertificate = response.data.certificate;

    // Configurer QZ Tray avec le certificat
    qz.security.setCertificatePromise(() => Promise.resolve(cachedCertificate));
    debugLog('Certificat chargé et stocké');
    return cachedCertificate;
  } catch (err) {
    debugLog('Erreur chargement certificat', err);
    throw err;
  }
};

// Initialiser QZ Tray
export const initQzTray = async () => {
  if (qzInitialized) return qz;

  try {
    debugLog('Initialisation QZ Tray...');

    // Charger le certificat
    await initCertificate();


    // Signature dynamique via backend
   qz.security.setSignaturePromise((toSign) => {
  return (resolve, reject) => {
    AxiosClient.post('/qz/sign', { toSign: toSign })
      .then(res => resolve(res.data)) // res.data doit être la string base64 pure
      .catch(err => reject(err));
  };
});
    
    // Connexion WebSocket
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect({ retries: 3, delay: 1000 });
      debugLog('WebSocket QZ Tray connecté');
    }

    qzInitialized = true;
    return qz;
  } catch (err) {
    debugLog('Erreur initialisation QZ Tray', err);
    throw err;
  }
};



// Impression d’un ticket réel
export const printTicket = async (ticketData, printerName = "ticket-thermique") => {
  try {
    await initQzTray();

    // Récupérer imprimantes si aucun nom fourni
    
    if (!printerName) throw new Error(' imprimante ticket-thermique non trouvée');

    debugLog('Imprimante utilisée:', printerName);

    const config = qz.configs.create(printerName);

    // Contenu du ticket
    const content = `
=== TICKET ===
Date: ${new Date().toLocaleString()}
Commande: #${ticketData.orderId || 'N/A'}
Total: ${ticketData.total || '0.00'} DH
=====================
Merci !
`.trim();

    const data = [
  '\x1B\x40',                 // init
  '\x1B\x61\x01',             // center
  '*** TICKET ***\n',
  '\x1B\x61\x00',             // left
  `Date: ${new Date().toLocaleString()}\n`,
  '-------------------------\n',
  ...ticketData.items.map(
    i => `${i.name}\n  ${i.quantity} x ${i.price} DH\n`
  ),
  '-------------------------\n',
  `TOTAL: ${ticketData.total} DH\n\n`,
  '\x1D\x56\x41\x10'          // cut
];


    const result = await qz.print(config, data);
    debugLog('Impression envoyée:', result);

    return true;
  } catch (err) {
    debugLog('Erreur impression:', err);
    throw err;
  }
};

// SHA-256 si nécessaire
export const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};