import React, { useState, useEffect, useRef, useCallback } from 'react';
import AxiosClient from "../Services/AxiosClient";
import VirtualKeyboard from "../Modals/VirtualKeyboard";

export default function Settings() {
  const [settings, setSettings] = useState({
    ticket_footer_message: '',
    ticket_type: 'normal',
    nom: '',
    adresse: '',
    telephone: '',
    currency: 'DH'
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // États pour le clavier virtuel (même structure que dans Produits)
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputName, setInputName] = useState(null);
  const [keyboardInput, setKeyboardInput] = useState("");
  const formRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile (comme dans Produits)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Charger les paramètres au montage du composant
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await AxiosClient.get('/ticket-settings');
      setSettings(response.data);
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement des paramètres');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Gestionnaires pour chaque fonctionnalité
  const handleFooterUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AxiosClient.put('/ticket-settings/footer', {
        ticket_footer_message: settings.ticket_footer_message
      });
      
      setSettings(prev => ({
        ...prev,
        ticket_footer_message: response.data.ticket_footer_message
      }));
      
      showMessage('success', 'Footer mis à jour avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour du footer');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeUpdate = async (type) => {
    try {
      const response = await AxiosClient.put('/ticket-settings/type', {
        ticket_type: type
      });
      
      setSettings(prev => ({
        ...prev,
        ticket_type: response.data.ticket_type
      }));
      
      showMessage('success', 'Type de ticket mis à jour');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AxiosClient.put('/ticket-settings/name', {
        nom: settings.nom
      });
      
      setSettings(prev => ({
        ...prev,
        nom: response.data.nom
      }));
      
      showMessage('success', 'Nom mis à jour avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour du nom');
    } finally {
      setLoading(false);
    }
  };

  const handleTelephoneUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AxiosClient.put('/ticket-settings/telephone', {
        telephone: settings.telephone
      });
      
      setSettings(prev => ({
        ...prev,
        telephone: response.data.telephone
      }));
      
      showMessage('success', 'Téléphone mis à jour avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour du téléphone');
    } finally {
      setLoading(false);
    }
  };

  const handleAdresseUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AxiosClient.put('/ticket-settings/adresse', {
        adresse: settings.adresse
      });
      
      setSettings(prev => ({
        ...prev,
        adresse: response.data.adresse
      }));
      
      showMessage('success', 'Adresse mise à jour avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour de l\'adresse');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AxiosClient.put('/ticket-settings/currency', {
        currency: settings.currency
      });
      
      setSettings(prev => ({
        ...prev,
        currency: response.data.currency
      }));
      
      showMessage('success', 'Devise mise à jour avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour de la devise');
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaires pour le clavier virtuel (exactement comme dans Produits)
  const handleKeyboardChange = useCallback((input) => {
    setKeyboardInput(input);
    
    if (inputName) {
      setSettings(prev => ({
        ...prev,
        [inputName]: input
      }));
    }
  }, [inputName]);

  const handleKeyPress = useCallback((button) => {
    if (button === "{bksp}") {
      const currentValue = settings[inputName] || "";
      const newValue = currentValue.slice(0, -1);
      setKeyboardInput(newValue);
      
      setSettings(prev => ({
        ...prev,
        [inputName]: newValue
      }));
    } else if (button === "{space}") {
      const newValue = (settings[inputName] || "") + " ";
      setKeyboardInput(newValue);
      
      setSettings(prev => ({
        ...prev,
        [inputName]: newValue
      }));
    }
  }, [inputName, settings]);

  // Gestionnaire pour fermer le clavier en cliquant en dehors (comme dans Produits)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        formRef.current &&
        !formRef.current.contains(event.target) &&
        !event.target.closest(".hg-button")
      ) {
        setShowKeyboard(false);
        setInputName(null);
        setKeyboardInput("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputFocus = (field) => {
    // Ne pas afficher le clavier virtuel sur mobile (comme dans Produits)
    if (isMobile) return;
    
    setInputName(field);
    setShowKeyboard(true);
    const currentValue = settings[field] || "";
    setKeyboardInput(currentValue);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setSettings(prev => ({ ...prev, [field]: value }));
    
    if (inputName === field) {
      setKeyboardInput(value);
    }
  };

  // Composant d'aperçu du ticket
  const TicketPreview = () => {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const Paiment = 'espèce';
    const Operateur = 'Souhail iz';

    // Exemple d'articles pour l'aperçu
    const exampleItems = [
      { name: 'Article exemple 1', quantity: 2, price: 15.00 },
      { name: 'Article exemple 2', quantity: 1, price: 25.50 },
      { name: 'Article exemple 3', quantity: 3, price: 8.75 }
    ];

    const calculateTotal = () => {
      return exampleItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2);
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 font-mono text-sm">
        {/* En-tête du ticket */}
        <div className="text-center border-b border-gray-300 pb-3 mb-3">
         <h3 className="font-bold text-lg">{(settings.nom || "Nom de l'établissement").toUpperCase()}</h3><br/>
          <p className="text-xs">{settings.adresse || "Adresse de l'établissement"}</p>
         {settings.telephone && <p className="text-xs">Tél: {settings.telephone}</p>}
          <span>{currentDate} {currentTime}</span>
        </div>

        {/* En-têtes des colonnes */}
        <div className="flex justify-between text-xs font-bold border-b border-gray-300 pb-1 mb-2">
          <span className="w-1/2">Article</span>
          <span className="w-1/4 text-right">Qté</span>
          <span className="w-1/4 text-right">Prix</span>
        </div>

        {/* Liste des articles */}
        <div className="space-y-1 mb-3">
          {exampleItems.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="w-1/2 truncate">{item.name}</span>
              <span className="w-1/4 text-right">{item.quantity}</span>
              <span className="w-1/4 text-right">{item.price.toFixed(2)} {settings.currency}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="justify-center flex font-bold border-t border-gray-300 pt-2 mt-2">
          <span>TOTAL TTC : {calculateTotal()} {settings.currency} 
          </span> 
        </div>
        <div className="justify-left flex text-xs border-t border-gray-300 pt-2 mt-2">
          <span>Paiment: {Paiment}</span>
        </div>
        <div className="justify-left flex text-xs">
          <span>Opérateur: {Operateur}</span>
        </div>

        {/* Type de ticket */}
        {settings.ticket_type === 'double' && (
          <div className="text-center text-xs mt-3 p-1 bg-yellow-100 rounded">
            <span className="font-bold">⚠️ Ticket double (Client + Cuisine)</span>
          </div>
        )}
        
        {/* Message de pied de page */}
        {settings.ticket_footer_message && (
          <div className="text-center text-xs mt-3 pt-2 border-t border-gray-300 italic">
            {settings.ticket_footer_message}
          </div>
        )}

        {/* Ligne de coupure pour ticket double */}
        {settings.ticket_type === 'double' && (
          <div className="text-center text-xs mt-3 text-gray-400">
            - - - - - - - - - - - - - - - - - - - -
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-blue-100 pt-2 px-1 sm:px-4 md:px-4 pb-3 sm:pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec le même style que Produits */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-2 sm:mb-3">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Paramètres de l'établissement
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Gérez toutes les informations et configurations de votre établissement
              </p>
            </div>
          </div>
        </div>

        {/* Message de notification avec le même style */}
        {message.text && (
          <div className={`mb-6 rounded-lg p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {/* Grille des paramètres */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche - Paramètres */}
          <div ref={formRef} className="space-y-6">
            {/* Carte Informations générales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
                </div>
              </div>
              
              <div className="px-6 py-5 space-y-6">
                {/* Nom */}
                <form onSubmit={handleNameUpdate}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'établissement
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={settings.nom || ''}
                      onChange={(e) => handleInputChange(e, "nom")}
                      onFocus={() => handleInputFocus("nom")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom de votre établissement"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300"
                    >
                      Modifier
                    </button>
                  </div>
                </form>

                {/* Téléphone */}
                <form onSubmit={handleTelephoneUpdate}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={settings.telephone || ''}
                      onChange={(e) => handleInputChange(e, "telephone")}
                      onFocus={() => handleInputFocus("telephone")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Numéro de téléphone"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300"
                    >
                      Modifier
                    </button>
                  </div>
                </form>

                {/* Adresse */}
                <form onSubmit={handleAdresseUpdate}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={settings.adresse || ''}
                      onChange={(e) => handleInputChange(e, "adresse")}
                      onFocus={() => handleInputFocus("adresse")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Adresse complète"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300"
                    >
                      Modifier
                    </button>
                  </div>
                </form>

                {/* Devise */}
                <form onSubmit={handleCurrencyUpdate}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={settings.currency || 'DH'}
                      onChange={(e) => handleInputChange(e, "currency")}
                      onFocus={() => handleInputFocus("currency")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="DH, EUR, USD..."
                      maxLength="10"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300"
                    >
                      Modifier
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Carte Type de ticket */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Type de ticket</h2>
                </div>
              </div>
              
              <div className="px-6 py-5">
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="ticket_type"
                      value="normal"
                      checked={settings.ticket_type === 'normal'}
                      onChange={(e) => handleTypeUpdate(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-3">
                      <span className="block font-medium text-gray-900">Ticket normal</span>
                      <span className="block text-sm text-gray-500">Format standard avec une seule impression</span>
                    </span>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="ticket_type"
                      value="double"
                      checked={settings.ticket_type === 'double'}
                      onChange={(e) => handleTypeUpdate(e.target.value)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-3">
                      <span className="block font-medium text-gray-900">Ticket double</span>
                      <span className="block text-sm text-gray-500">Ticket client + ticket cuisine</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Carte Message de pied de page */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Message de pied de page</h2>
                </div>
              </div>
              
              <form onSubmit={handleFooterUpdate} className="px-6 py-5">
                <textarea
                  value={settings.ticket_footer_message || ''}
                  onChange={(e) => handleInputChange(e, "ticket_footer_message")}
                  onFocus={() => handleInputFocus("ticket_footer_message")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Message qui apparaîtra en bas de vos tickets..."
                  maxLength="255"
                />
                
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {settings.ticket_footer_message?.length || 0}/255 caractères
                  </span>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300"
                  >
                    {loading ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Colonne droite - Aperçu du ticket */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">Aperçu du ticket</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Visualisez l'apparence de vos tickets en temps réel
                </p>
              </div>
              
              <div className="px-6 py-5">
                <div className=" border rounded-lg border-gray-200">
                  <TicketPreview />
                </div>
              
              </div>
            </div>
          </div>
        </div>

        {/* Clavier virtuel réutilisable - même position et style que dans Produits */}
        {showKeyboard && !isMobile && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-lg">
            <VirtualKeyboard
              inputName={inputName}
              inputValue={keyboardInput}
              onChange={handleKeyboardChange}
              onKeyPress={handleKeyPress}
              onHide={() => {
                setShowKeyboard(false);
                setInputName(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}