import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import VirtualKeyboard from "../Modals/VirtualKeyboard";
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiPlus,
  FiPower,
  FiRefreshCw,
  FiX
} from "react-icons/fi";
import { 
  FaBuilding, 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle,
  FaUserPlus
} from "react-icons/fa";
import { HiOutlineBuildingOffice2, HiOutlineBuildingOffice } from "react-icons/hi2";

function Tenants() {
  const navigate = useNavigate();
  
  // ========== STATE ==========
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'suspend' or 'reactivate'
  const [showAddTenantModal, setShowAddTenantModal] = useState(false); // État pour le modal d'ajout
  
  // État pour la notification
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  // ========== FORM STATE POUR AJOUT TENANT ==========
  const [formData, setFormData] = useState({
    // Tenant fields
    tenant_nom: "",
    tenant_email: "",
    tenant_telephone: "",
    tenant_adresse: "",
    
    // Admin fields
    admin_nom: "",
    admin_prenom: "",
    admin_email: "",
    admin_password: "",
    admin_password_confirmation: "",
  });

  // ========== VIRTUAL KEYBOARD ==========
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputName, setInputName] = useState(null);
  const [keyboardInput, setKeyboardInput] = useState("");
  const formRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  // ========== HOOKS ==========
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

  const {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  } = useErrorHandler();

  // ========== NOTIFICATION ==========
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

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  // ========== FETCH TENANTS ==========
  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AxiosClient.get("/tenants");
      setTenants(response.data.data || []);
    } catch (error) {
      console.error("Erreur fetch tenants:", error);
      showNotification("error", "Erreur lors du chargement des tenants", error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // ========== GESTION DU MODAL D'AJOUT ==========
  const openAddTenantModal = () => {
    setShowAddTenantModal(true);
  };

  const closeAddTenantModal = () => {
    setShowAddTenantModal(false);
    resetForm();
  };

  // ========== VIRTUAL KEYBOARD HANDLERS ==========
  const handleKeyboardChange = useCallback((input) => {
    setKeyboardInput(input);
    setFormData(prev => ({ ...prev, [inputName]: input }));
  }, [inputName]);

  const handleKeyPress = useCallback((button) => {
    if (button === "{bksp}") {
      const newValue = keyboardInput.slice(0, -1);
      setKeyboardInput(newValue);
      if (inputName) {
        setFormData(prev => ({ ...prev, [inputName]: newValue }));
      }
    } else if (button === "{space}") {
      const newValue = keyboardInput + " ";
      setKeyboardInput(newValue);
      if (inputName) {
        setFormData(prev => ({ ...prev, [inputName]: newValue }));
      }
    }
  }, [inputName, keyboardInput]);

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

  // ========== FORM HANDLERS ==========
  const resetForm = useCallback(() => {
    setFormData({
      tenant_nom: "",
      tenant_email: "",
      tenant_telephone: "",
      tenant_adresse: "",
      admin_nom: "",
      admin_prenom: "",
      admin_email: "",
      admin_password: "",
      admin_password_confirmation: "",
    });
    setShowKeyboard(false);
    setInputName(null);
    setKeyboardInput("");
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (inputName === name) {
      setKeyboardInput(value);
    }
  };

  const handleInputFocus = (field) => {
    if (isMobile) return;
    setInputName(field);
    setShowKeyboard(true);
    setKeyboardInput(formData[field] || "");
  };

  // ========== CRUD OPERATIONS ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.tenant_nom.trim()) {
      showNotification(
        "error", 
        "Veuillez saisir le nom du tenant",
        null,
        "Erreur de validation",
        6000
      );
      return;
    }

    if (!formData.admin_nom.trim() || !formData.admin_prenom.trim()) {
      showNotification(
        "error", 
        "Veuillez saisir le nom et prénom de l'administrateur",
        null,
        "Erreur de validation",
        6000
      );
      return;
    }

    if (!formData.admin_email.trim()) {
      showNotification(
        "error", 
        "Veuillez saisir l'email de l'administrateur",
        null,
        "Erreur de validation",
        6000
      );
      return;
    }

    if (formData.admin_password.length < 6) {
      showNotification(
        "error", 
        "Le mot de passe doit contenir au moins 6 caractères",
        null,
        "Erreur de validation",
        6000
      );
      return;
    }

    if (formData.admin_password !== formData.admin_password_confirmation) {
      showNotification(
        "error", 
        "Les mots de passe ne correspondent pas",
        null,
        "Erreur de validation",
        6000
      );
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await AxiosClient.post("/tenants", formData);
      
      showNotification(
        "success", 
        "Tenant et administrateur créés avec succès !",
        null,
        "Succès",
        6000
      );
      
      resetForm();
      fetchTenants(); // Recharger la liste
      
      // Fermer le modal après un court délai
      setTimeout(() => {
        closeAddTenantModal();
      }, 2000);
      
    } catch (error) {
      console.error("Erreur création tenant:", error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0] || "Erreur de validation";
        showNotification("error", firstError, error);
      } else {
        const errorMsg = error.response?.data?.message || "Erreur lors de la création du tenant";
        showNotification("error", errorMsg, error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ========== ACTIONS SUR TENANT ==========
  const openConfirmModal = (tenant, action) => {
    setSelectedTenant(tenant);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setSelectedTenant(null);
    setConfirmAction(null);
    setShowConfirmModal(false);
  };

  const handleSuspend = async () => {
    if (!selectedTenant) return;
    
    setActionLoading(true);
    try {
      await AxiosClient.patch(`/tenants/${selectedTenant.id}/suspend`);
      showNotification("success", `Le tenant "${selectedTenant.nom}" a été suspendu avec succès`);
      fetchTenants();
    } catch (error) {
      console.error("Erreur suspension:", error);
      showNotification("error", "Erreur lors de la suspension du tenant", error);
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  const handleReactivate = async () => {
    if (!selectedTenant) return;
    
    setActionLoading(true);
    try {
      await AxiosClient.patch(`/tenants/${selectedTenant.id}/reactivate`);
      showNotification("success", `Le tenant "${selectedTenant.nom}" a été réactivé avec succès`);
      fetchTenants();
    } catch (error) {
      console.error("Erreur réactivation:", error);
      showNotification("error", "Erreur lors de la réactivation du tenant", error);
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  const handleAction = () => {
    if (confirmAction === 'suspend') {
      handleSuspend();
    } else if (confirmAction === 'reactivate') {
      handleReactivate();
    }
  };

  // ========== RENDER HELPERS ==========
  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <FaCheckCircle className="w-3 h-3 mr-1" />
          Actif
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <FaTimesCircle className="w-3 h-3 mr-1" />
          Suspendu
        </span>
      );
    }
  };

  const getActionButton = (tenant) => {
    if (tenant.is_active) {
      return (
        <button
          onClick={() => openConfirmModal(tenant, 'suspend')}
          className="inline-flex items-center px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-medium transition duration-150 border border-orange-200 hover:border-orange-300"
          title="Suspendre le tenant"
        >
          <FiPower className="w-3.5 h-3.5 mr-1" />
          Suspendre
        </button>
      );
    } else {
      return (
        <button
          onClick={() => openConfirmModal(tenant, 'reactivate')}
          className="inline-flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition duration-150 border border-green-200 hover:border-green-300"
          title="Réactiver le tenant"
        >
          <FiRefreshCw className="w-3.5 h-3.5 mr-1" />
          Réactiver
        </button>
      );
    }
  };

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      {/* Modals */}
      <SubscriptionModal
        show={showSubscriptionModal}
        message={errorMessage}
        onClose={closeSubscriptionModal}
      />
      
      <NotificationModal
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={notification.duration}
        onClose={closeNotification}
      />

      <ConfirmationModal
        show={showConfirmModal}
        title={confirmAction === 'suspend' ? "Confirmer la suspension" : "Confirmer la réactivation"}
        message={confirmAction === 'suspend' 
          ? `Êtes-vous sûr de vouloir suspendre le tenant "${selectedTenant?.nom}" ? Cette action désactivera l'accès à tous ses fonctions.`
          : `Êtes-vous sûr de vouloir réactiver le tenant "${selectedTenant?.nom}" ?`
        }
        confirmText={confirmAction === 'suspend' ? "Suspendre" : "Réactiver"}
        cancelText="Annuler"
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={closeConfirmModal}
        type={confirmAction === 'suspend' ? 'warning' : 'success'}
      />

      {/* Modal d'ajout de tenant - Version compacte */}
      {showAddTenantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div ref={formRef} className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-2 transform transition-all max-h-[90vh] overflow-y-auto">
            
            {/* Header compact */}
            <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <HiOutlineBuildingOffice className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Créer un nouveau tenant
                  </h2>
                </div>
                <button
                  onClick={closeAddTenantModal}
                  className="text-gray-400 hover:text-gray-600 transition duration-150 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Formulaire compact */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              {/* Section Tenant */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nom du tenant *
                    </label>
                    <input
                      type="text"
                      name="tenant_nom"
                      placeholder="Ex: ABC Corporation"
                      value={formData.tenant_nom}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("tenant_nom")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="tenant_email"
                      placeholder="contact@tenant.com"
                      value={formData.tenant_email}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("tenant_email")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      name="tenant_telephone"
                      placeholder="+212 6 00 00 00 00"
                      value={formData.tenant_telephone}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("tenant_telephone")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Adresse
                    </label>
                    <input
                      type="text"
                      name="tenant_adresse"
                      placeholder="Adresse complète"
                      value={formData.tenant_adresse}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("tenant_adresse")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    />
                  </div>
                </div>
              </div>

              {/* Section Admin compacte */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 border-b border-gray-200 pb-1.5">
                  <FaUserPlus className="w-3.5 h-3.5 text-green-600" />
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Informations de l'administrateur</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="admin_nom"
                      placeholder="Nom"
                      value={formData.admin_nom}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("admin_nom")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="admin_prenom"
                      placeholder="Prénom"
                      value={formData.admin_prenom}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("admin_prenom")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="admin_email"
                      placeholder="admin@tenant.com"
                      value={formData.admin_email}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("admin_email")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      name="admin_password"
                      placeholder="••••••••"
                      value={formData.admin_password}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("admin_password")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                      required
                      minLength="6"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Confirmation *
                    </label>
                    <input
                      type="password"
                      name="admin_password_confirmation"
                      placeholder="••••••••"
                      value={formData.admin_password_confirmation}
                      onChange={handleInputChange}
                      onFocus={() => handleInputFocus("admin_password_confirmation")}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Clavier virtuel compact */}
              {showKeyboard && !isMobile && (
                <div className="mt-3 border-t pt-3">
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

              {/* Actions compactes */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeAddTenantModal}
                  className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-150 order-2 sm:order-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2 min-w-[100px]"
                >
                  {actionLoading && (
                    <FaSpinner className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white" />
                  )}
                  {actionLoading ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800">
                    ← Retour au dashboard
                  </button>
                </h1>
              </div>
            </div>
            <button
              onClick={openAddTenantModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition duration-200 shadow-sm hover:shadow-md"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Nouveau tenant
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tenants.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaBuilding className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tenants Actifs</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {tenants.filter(t => t.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tenants Suspendus</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {tenants.filter(t => !t.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FaTimesCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Liste des tenants */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                        <p className="text-gray-600">Chargement des tenants...</p>
                      </div>
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                          <HiOutlineBuildingOffice2 className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun tenant trouvé</h3>
                        <p className="text-gray-500 mb-6">Commencez par créer votre premier tenant.</p>
                        <button
                          onClick={openAddTenantModal}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md"
                        >
                          <FiPlus className="w-5 h-5 mr-2" />
                          Créer un tenant
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center border border-blue-200 shadow-sm">
                            <FaBuilding className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {tenant.nom}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              ID: {tenant.public_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {tenant.email && (
                            <div className="flex items-center text-xs text-gray-600">
                              <FiMail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {tenant.email}
                            </div>
                          )}
                          {tenant.telephone && (
                            <div className="flex items-center text-xs text-gray-600">
                              <FiPhone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                              {tenant.telephone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.adresse ? (
                          <div className="flex items-start text-xs text-gray-600 max-w-xs">
                            <FiMapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{tenant.adresse}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non renseignée</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tenant.is_active)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getActionButton(tenant)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tenants;