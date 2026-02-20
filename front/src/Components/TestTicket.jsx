import React, { useState } from "react";
import { initQzTray, printTicket } from "../Services/qz-tray";

const TestTicket = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Tester connexion QZ
  const handleConnect = async () => {
    try {
      setLoading(true);
      setMessage("Connexion en cours...");
      await initQzTray();
      setMessage("✅ QZ Tray connecté avec succès");
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur connexion QZ Tray");
    } finally {
      setLoading(false);
    }
  };

  // Impression test
  const handlePrint = async () => {
    try {
      setLoading(true);
      setMessage("Impression en cours...");

      const ticketData = {
        orderId: 1234,
        total: 85,
        items: [
          { name: "Café Noir", quantity: 2, price: 12 },
          { name: "Croissant", quantity: 1, price: 15 },
          { name: "Jus d'orange", quantity: 1, price: 20 }
        ]
      };

      await printTicket(ticketData, "ticket-thermique");

      setMessage("🖨️ Ticket imprimé avec succès !");
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur impression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Test Impression QZ Tray</h2>

      <button onClick={handleConnect} disabled={loading}>
        Tester Connexion QZ
      </button>

      <br /><br />

      <button onClick={handlePrint} disabled={loading}>
        Imprimer Ticket Test
      </button>

      <br /><br />

      {message && (
        <div style={{ marginTop: 20, fontWeight: "bold" }}>
          {message}
        </div>
      )}
    </div>
  );
};
// [QZ DEBUG] Initialisation QZ Tray... 
// qz-tray.js:10 [QZ DEBUG] Certificat chargé et stocké 
// qz-tray.js:37 Established connection with QZ Tray on ws://localhost:8182   pourquoi la signature ya pas de post

// Excellent Souhail 👌
// Là ton log est très intéressant :

// [QZ DEBUG] Initialisation QZ Tray...
// [QZ DEBUG] Certificat chargé et stocké
// Established connection with QZ Tray on ws://localhost:8182


// 👉 Ça veut dire :

// ✅ Certificat OK
// ✅ WebSocket OK
// ❗ Signature PAS encore déclenchée

// 🎯 Pourquoi tu ne vois pas de POST /qz/sign ?

// Parce que la signature n’est demandée que lorsqu’une action sécurisée est exécutée.

// QZ Tray ne demande PAS de signature pour :

// La connexion WebSocket

// L’initialisation

// Il demande une signature seulement pour :

// qz.print()

// qz.printers.find()

// Certaines actions protégées

// 🔥 Donc dans ton cas :

// Tu as juste fait :

// await initQzTray();


// Mais tu n’as pas encore fait :

// await qz.print(...)


// Donc :
// 👉 Aucun besoin de signature pour le moment
// 👉 Donc aucun POST /qz/sign

// 🧠 Comment vérifier que la signature fonctionne ?

// Clique sur ton bouton :

// Imprimer Ticket


// À ce moment-là tu devrais voir dans Network :

// POST /qz/sign


// Et dans console :

// [QZ DEBUG] Impression envoyée

// ⚠️ Si le POST ne se déclenche pas lors de print()

// Alors 2 possibilités :

// 1️⃣ QZ est en mode "unsigned development"

// Parfois QZ accepte temporairement sans signature (mode dev).

// 2️⃣ Tu es en HTTP simple (pas HTTPS)

// En HTTP local, QZ peut être plus permissif.

// 🎯 Conclusion

// Ton système fonctionne correctement jusqu’ici.

// La signature :

// ❌ n’est PAS appelée à la connexion

// ✅ est appelée au moment de l’impression

// 🚀 Petit test pour forcer la signature

// Ajoute temporairement :

// await qz.printers.find();


// Après la connexion.

// Ça va déclencher une demande de signature.

// Si tu veux, envoie-moi :

// Ce qui se passe quand tu cliques sur imprimer

// Si le POST apparaît ou pas

// On finalise ça comme un vrai SaaS caisse pro 💪

export default TestTicket;
