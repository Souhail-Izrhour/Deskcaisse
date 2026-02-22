import React, { useState, useEffect, useRef, useCallback } from 'react';
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import NotificationModal from "../Modals/NotificationModal";
import VirtualKeyboard from "../Modals/VirtualKeyboard";
import { FiEye, FiX } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";

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
  const [fetching, setFetching] = useState(false);

  // États pour le clavier virtuel
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [inputName, setInputName] = useState(null);
  const [keyboardInput, setKeyboardInput] = useState("");
  const formRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  // État pour la modal d'aperçu
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // État pour la notification
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  // Utilisation du hook d'erreur
  const {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  } = useErrorHandler();

  // Détection mobile
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
    setFetching(true);
    try {
      const response = await AxiosClient.get('/ticket-settings');
      setSettings(response.data);
    } catch (error) {
      showNotification('error', 'Erreur lors du chargement des paramètres', error);
    } finally {
      setFetching(false);
    }
  };

  // Fonction de notification avec gestion d'erreur
  const showNotification = useCallback((type, message, error = null, title = "", duration = 5000) => {
    if (error && handleError(error)) {
      return;
    }
    
    setNotification({
      show: true,
      type,
      title: title || (type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : 'Information'),
      message,
      duration
    });
  }, [handleError]);

  // Fermeture de la notification
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

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
      
      showNotification('success', 'Footer mis à jour avec succès');
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour du footer', error);
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
      
      showNotification('success', 'Type de ticket mis à jour');
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour', error);
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
      
      showNotification('success', 'Nom mis à jour avec succès');
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour du nom', error);
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
      
      showNotification('success', 'Téléphone mis à jour avec succès');
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour du téléphone', error);
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
      
      showNotification('success', 'Adresse mise à jour avec succès');
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour de l\'adresse', error);
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
      
      showNotification('success', 'Devise mise à jour avec succès');
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour de la devise', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaires pour le clavier virtuel
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

  // Gestionnaire pour fermer le clavier en cliquant en dehors
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
        <div className="text-center border-b border-gray-300 pb-3 mb-3">
          <h3 className="font-bold text-lg">{(settings.nom || "Nom de l'établissement").toUpperCase()}</h3>
          <br/>
          <p className="text-xs">{settings.adresse || "Adresse de l'établissement"}</p>
          {settings.telephone && <p className="text-xs">Tél: {settings.telephone}</p>}
          <span>{currentDate} {currentTime}</span>
        </div>

        <div className="flex justify-between text-xs font-bold border-b border-gray-300 pb-1 mb-2">
          <span className="w-1/2">Article</span>
          <span className="w-1/4 text-right">Qté</span>
          <span className="w-1/4 text-right">Prix</span>
        </div>

        <div className="space-y-1 mb-3">
          {exampleItems.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="w-1/2 truncate">{item.name}</span>
              <span className="w-1/4 text-right">{item.quantity}</span>
              <span className="w-1/4 text-right">{item.price.toFixed(2)} {settings.currency}</span>
            </div>
          ))}
        </div>

        <div className="justify-center flex font-bold border-t border-gray-300 pt-2 mt-2">
          <span>TOTAL TTC : {calculateTotal()} {settings.currency}</span> 
        </div>
        <div className="justify-left flex text-xs border-t border-gray-300 pt-2 mt-2">
          <span>Paiment: {Paiment}</span>
        </div>
        <div className="justify-left flex text-xs">
          <span>Opérateur: {Operateur}</span>
        </div>

        {settings.ticket_type === 'double' && (
          <div className="text-center text-xs mt-3 p-1 bg-yellow-100 rounded">
            <span className="font-bold">⚠️ Ticket double (Client + Cuisine)</span>
          </div>
        )}
        
        {settings.ticket_footer_message && (
          <div className="text-center text-xs mt-3 pt-2 border-t border-gray-300 italic">
            {settings.ticket_footer_message}
          </div>
        )}

        {settings.ticket_type === 'double' && (
          <div className="text-center text-xs mt-3 text-gray-400">
            - - - - - - - - - - - - - - - - - - - -
          </div>
        )}
      </div>
    );
  };

  // Modal d'aperçu du ticket
  const PreviewModal = () => {
    if (!showPreviewModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Aperçu du ticket</h2>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="text-gray-400 hover:text-gray-600 transition duration-150 p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <TicketPreview />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-blue-100 pt-2 px-1 sm:px-4 md:px-4 pb-3 sm:pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Modal d'abonnement expiré */}
        <SubscriptionModal
          show={showSubscriptionModal}
          message={errorMessage}
          onClose={closeSubscriptionModal}
        />
        
        {/* Notification réutilisable */}
        <NotificationModal
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={closeNotification}
        />

        {/* Header avec bouton d'aperçu */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-2 mb-2 sm:mb-3">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Paramètres du ticket
              </h1>
            </div>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center text-sm sm:text-base shadow-sm hover:shadow-md"
            >
              {fetching ? (
                <FaSpinner className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <FiEye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span>Aperçu du ticket</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Conteneur principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm mb-4">
          <div className="max-h-[80vh] overflow-y-auto rounded-2xl">
            <div className="p-2 sm:p-2">
              {/* Grille des paramètres */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche - Paramètres */}
                <div ref={formRef} className="space-y-4">
                  {/* Carte Informations générales */}
                  <div className="bg-white overflow-hidden">
                    <div className="px-6 py-1 space-y-4">
                      {/* Nom */}
                      <form onSubmit={handleNameUpdate}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            disabled={fetching}
                          />
                          <button
                            type="submit"
                            disabled={loading || fetching}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300 flex items-center"
                          >
                            {loading ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Modifier'}
                          </button>
                        </div>
                      </form>

                      {/* Téléphone */}
                      <form onSubmit={handleTelephoneUpdate}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            disabled={fetching}
                          />
                          <button
                            type="submit"
                            disabled={loading || fetching}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300 flex items-center"
                          >
                            {loading ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Modifier'}
                          </button>
                        </div>
                      </form>

                      {/* Adresse */}
                      <form onSubmit={handleAdresseUpdate}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            disabled={fetching}
                          />
                          <button
                            type="submit"
                            disabled={loading || fetching}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300 flex items-center"
                          >
                            {loading ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Modifier'}
                          </button>
                        </div>
                      </form>

                      {/* Devise */}
                      <form onSubmit={handleCurrencyUpdate}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            disabled={fetching}
                          />
                          <button
                            type="submit"
                            disabled={loading || fetching}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300 flex items-center"
                          >
                            {loading ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Modifier'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Carte Message de pied de page */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-2 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        <h2 className="text-base font-semibold text-gray-900">Message de pied de page</h2>
                      </div>
                    </div>
                    
                    <form onSubmit={handleFooterUpdate} className="px-6 py-3">
                      <input
                        value={settings.ticket_footer_message || ''}
                        onChange={(e) => handleInputChange(e, "ticket_footer_message")}
                        onFocus={() => handleInputFocus("ticket_footer_message")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Message qui apparaîtra en bas de vos tickets..."
                        maxLength="255"
                        disabled={fetching}
                      />
                      
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {settings.ticket_footer_message?.length || 0}/255 caractères
                        </span>
                        
                        <button
                          type="submit"
                          disabled={loading || fetching}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-blue-300 flex items-center"
                        >
                          {loading ? <FaSpinner className="animate-spin w-4 h-4" /> : 'Mettre à jour'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Colonne droite - Clavier virtuel toujours affiché */}
                <div className="space-y-6">
                  {/* Carte Type de ticket */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-2 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <h2 className="text-base font-semibold text-gray-900">Type de ticket</h2>
                      </div>
                    </div>
                    
                    <div className="px-3 py-2">
                      <div className="flex space-x-4">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                          <input
                            type="radio"
                            name="ticket_type"
                            value="normal"
                            checked={settings.ticket_type === 'normal'}
                            onChange={(e) => handleTypeUpdate(e.target.value)}
                            className="h-4 w-4 text-blue-600"
                            disabled={fetching}
                          />
                          <span className="ml-3">
                            <span className="block font-medium text-gray-900">Ticket normal</span>
                            <span className="block text-sm text-gray-500">Client seulement</span>
                          </span>
                        </label>
                        
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                          <input
                            type="radio"
                            name="ticket_type"
                            value="double"
                            checked={settings.ticket_type === 'double'}
                            onChange={(e) => handleTypeUpdate(e.target.value)}
                            className="h-4 w-4 text-blue-600"
                            disabled={fetching}
                          />
                          <span className="ml-3">
                            <span className="block font-medium text-gray-900">Ticket double</span>
                            <span className="block text-sm text-gray-500">Client + Cuisine</span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                    {/* Le clavier est toujours affiché, même sans input sélectionné */}
                    {!inputName ? (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Cliquez sur un champ de saisie pour utiliser le clavier virtuel
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="mb-3 pb-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-700">
                            Saisie en cours : {
                              inputName === 'nom' ? 'Nom' :
                              inputName === 'telephone' ? 'Téléphone' :
                              inputName === 'adresse' ? 'Adresse' :
                              inputName === 'currency' ? 'Devise' :
                              inputName === 'ticket_footer_message' ? 'Message de pied de page' : inputName
                            }
                          </p>
                        </div>
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
              </div>
            </div>
          </div>
        </div>

        {/* Modal d'aperçu du ticket */}
        <PreviewModal />
      </div>
    </div>
  );
}