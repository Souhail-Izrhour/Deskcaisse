import React, { useEffect, useState, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import VirtualKeyboard from "../Modals/VirtualKeyboard";
import { 
  FiDollarSign, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { 
  FaSpinner, 
  FaMoneyBillAlt
} from "react-icons/fa";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import { FaTriangleExclamation } from "react-icons/fa6";

function Charges() {
  // Récupérer le contexte du Layout
  const { shiftActive } = useOutletContext();
  
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftStats, setShiftStats] = useState(null);
  const [fetching, setFetching] = useState(false); // Pour le fetching initial

  const [newCharge, setNewCharge] = useState({
    amount: "",
    description: ""
  });

  const [editData, setEditData] = useState({
    id: null,
    amount: "",
    description: ""
  });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chargeToDelete, setChargeToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // État pour la notification
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  // --- clavier virtuel ---
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputName, setInputName] = useState(null);
  const [keyboardInput, setKeyboardInput] = useState("");
  const formRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

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

  // Utilisation du hook d'erreur
  const {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  } = useErrorHandler();

  // Fonction de notification
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

  // Gestion du clavier virtuel
  const handleKeyboardChange = useCallback((input) => {
    setKeyboardInput(input);
    
    if (inputName === "description") {
      isEditing 
        ? setEditData(prev => ({ ...prev, description: input }))
        : setNewCharge(prev => ({ ...prev, description: input }));
    } else if (inputName === "amount") {
      const cleaned = input.replace(/[^0-9.]/g, '');
      isEditing 
        ? setEditData(prev => ({ ...prev, amount: cleaned }))
        : setNewCharge(prev => ({ ...prev, amount: cleaned }));
    }
  }, [inputName, isEditing]);

  const handleKeyPress = useCallback((button) => {
    if (button === "{bksp}") {
      const currentValue = isEditing 
        ? editData[inputName] || ""
        : inputName === "amount" ? newCharge.amount || "" : newCharge[inputName] || "";
      
      const newValue = currentValue.slice(0, -1);
      setKeyboardInput(newValue);
      
      if (inputName) {
        if (isEditing) {
          setEditData(prev => ({ ...prev, [inputName]: newValue }));
        } else if (inputName === "amount") {
          setNewCharge(prev => ({ ...prev, amount: newValue }));
        } else {
          setNewCharge(prev => ({ ...prev, [inputName]: newValue }));
        }
      }
    } else if (button === "{space}" && inputName === "description") {
      const newValue = keyboardInput + " ";
      setKeyboardInput(newValue);
      
      if (isEditing) {
        setEditData(prev => ({ ...prev, [inputName]: newValue }));
      } else {
        setNewCharge(prev => ({ ...prev, [inputName]: newValue }));
      }
    } else if (button === "." && inputName === "amount") {
      if (!keyboardInput.includes('.')) {
        const newValue = keyboardInput + ".";
        setKeyboardInput(newValue);
        if (isEditing) {
          setEditData(prev => ({ ...prev, [inputName]: newValue }));
        } else {
          setNewCharge(prev => ({ ...prev, amount: newValue }));
        }
      }
    }
  }, [inputName, isEditing, editData, newCharge, keyboardInput]);

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

  // Récupérer les stats du shift actif avec les charges
  const fetchCurrentShiftStats = useCallback(async () => {
    if (!shiftActive) {
      setShiftStats(null);
      setCharges([]);
      setLoading(false);
      return;
    }
    
    setFetching(true);
    try {
      const response = await AxiosClient.get("/shifts/currentStats");
      setShiftStats(response.data);
      setCharges(response.data.charges_details || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setShiftStats(null);
        setCharges([]);
      } else {
        console.error("Erreur fetch shift stats:", error);
        showNotification("error", "Erreur lors du chargement du shift actif", error);
      }
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, [shiftActive, showNotification]);

  useEffect(() => {
    setLoading(true); // Montrer le spinner au chargement initial
    fetchCurrentShiftStats();
  }, [fetchCurrentShiftStats]);

  const resetForm = useCallback(() => {
    setNewCharge({
      amount: "",
      description: ""
    });
    setEditData({
      id: null,
      amount: "",
      description: ""
    });
    setShowModal(false);
    setIsEditing(false);
    setShowKeyboard(false);
    setInputName(null);
    setKeyboardInput("");
  }, []);

  const openAddModal = () => {
    if (!shiftActive) {
      showNotification("error", "Veuillez démarrer un shift avant d'ajouter une charge");
      return;
    }
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (charge) => {
    if (!shiftActive) {
      showNotification("error", "Aucun shift actif");
      return;
    }
    setEditData({
      id: charge.id,
      amount: charge.amount,
      description: charge.description || ""
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Validation des données
  const validateCharge = (data) => {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      showNotification("error", "Veuillez entrer un montant valide", null, "Erreur de validation");
      return false;
    }
    return true;
  };

  // Ajouter une charge
  const addCharge = async () => {
    if (!validateCharge(newCharge)) return;
    if (!shiftActive) {
      showNotification("error", "Veuillez démarrer un shift avant d'ajouter une charge");
      return;
    }

    setLoading(true);
    try {
      await AxiosClient.post("/charges", newCharge);
      showNotification("success", "Charge ajoutée avec succès");
      resetForm();
      await fetchCurrentShiftStats(); // Recharger les stats du shift
    } catch (error) {
      console.error("Erreur add charge:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'ajout";
      showNotification("error", errorMsg, error);
      setLoading(false);
    }
  };

  // Modifier une charge
  const updateCharge = async () => {
    if (!validateCharge(editData)) return;
    if (!shiftActive) {
      showNotification("error", "Aucun shift actif");
      return;
    }

    setLoading(true);
    try {
      await AxiosClient.put(`/charges/${editData.id}`, editData);
      showNotification("success", "Charge modifiée avec succès");
      resetForm();
      await fetchCurrentShiftStats();
    } catch (error) {
      console.error("Erreur update charge:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la modification";
      showNotification("error", errorMsg, error);
      setLoading(false);
    }
  };

  const openDeleteModal = (charge) => {
    if (!shiftActive) {
      showNotification("error", "Aucun shift actif");
      return;
    }
    setChargeToDelete(charge);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setChargeToDelete(null);
    setShowDeleteModal(false);
  };

  // Supprimer une charge
  const deleteCharge = async () => {
    if (!chargeToDelete) return;

    setLoading(true);
    try {
      await AxiosClient.delete(`/charges/${chargeToDelete.id}`);
      showNotification("success", "Charge supprimée avec succès");
      await fetchCurrentShiftStats();
      closeDeleteModal();
    } catch (error) {
      console.error("Erreur delete charge:", error);
      const errorMsg = error.response?.data?.message || "Impossible de supprimer";
      showNotification("error", errorMsg, error);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateCharge();
    } else {
      addCharge();
    }
  };

  const handleInputFocus = (field) => {
    if (isMobile) return;
    
    setInputName(field);
    setShowKeyboard(true);
    
    let currentValue = "";
    if (isEditing) {
      currentValue = editData[field] || "";
    } else {
      currentValue = newCharge[field] || "";
    }
    setKeyboardInput(currentValue);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    
    if (isEditing) {
      setEditData(prev => ({ ...prev, [field]: value }));
    } else {
      if (field === "amount") {
        const cleaned = value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) {
          return;
        }
        if (parts[1] && parts[1].length > 2) {
          return;
        }
        setNewCharge(prev => ({ ...prev, [field]: cleaned }));
      } else {
        setNewCharge(prev => ({ ...prev, [field]: value }));
      }
    }
    
    if (inputName === field) {
      setKeyboardInput(value);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formater le montant
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2) + ' DH';
  };

  // Calculer le total des charges du tableau
  const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);

  return (
    <div className="min-h-screen bg-blue-100 pt-2 px-1 sm:px-4 md:px-4 pb-3 sm:pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Modal d'abonnement expiré */}
        <SubscriptionModal
          show={showSubscriptionModal}
          message={errorMessage}
          onClose={closeSubscriptionModal}
        />
        
        {/* Modal de confirmation de suppression */}
        <ConfirmationModal
          show={showDeleteModal}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer cette charge ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          loading={loading}
          item={chargeToDelete}
          onConfirm={deleteCharge}
          onCancel={closeDeleteModal}
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

        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-2 mb-2 sm:mb-3">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-gray-600  text-xs sm:text-sm">Vous trouvez ici les charges du shift en cours.</p>          
            </div>
            <button
              onClick={openAddModal}
              disabled={!shiftActive || fetching}
              className={`
                bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4  sm:py-2 rounded-lg font-medium 
                transition duration-200 flex items-center justify-center text-sm sm:text-base shadow-sm hover:shadow-md
                ${!shiftActive || fetching ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {fetching ? (
                <FaSpinner className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <HiOutlineCurrencyDollar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden xs:inline">Ajouter une charge</span>
                  <span className="xs:hidden">Ajouter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Conteneur principal avec tableau et total */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm mb-4">
          <div className="max-h-[75vh] overflow-y-auto rounded-2xl">
            {/* Tableau des charges */}
            {!shiftActive && !loading ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl flex items-center justify-center">
                    <FaTriangleExclamation className="w-10 h-10 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Shift non démarré</h3>
                <p className="text-gray-500 mb-6">
                  Démarrez un shift pour voir et gérer les charges.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl">
                {/* Version Desktop */}
                <table className="w-full hidden sm:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enregistré par
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      // Spinner dans le tableau pendant le chargement
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                            <p className="text-gray-600">Chargement des charges...</p>
                          </div>
                        </td>
                      </tr>
                    ) : charges.length === 0 ? (
                      // Message quand il n'y a pas de charges
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mb-4">
                              <FaMoneyBillAlt className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune charge pour ce shift</h3>
                            <p className="text-gray-500 mb-6">Commencez par ajouter votre première charge.</p>
                            <button
                              onClick={openAddModal}
                              disabled={!shiftActive || fetching}
                              className={`
                                inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                                font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md
                                ${!shiftActive || fetching ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <HiOutlineCurrencyDollar className="w-5 h-5 mr-2" />
                              Ajouter une charge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Afficher les charges
                      charges.map((charge) => (
                        <tr key={charge.id} className="hover:bg-gray-50 transition duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">
                                {shiftStats?.user?.prenom} {shiftStats?.user?.nom}
                              </span>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-red-600">
                              {formatAmount(charge.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {charge.description || "Aucune description"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">
                                {formatDate(charge.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(charge)}
                                disabled={!shiftActive || loading}
                                className={`
                                  text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg 
                                  text-sm font-medium transition duration-150 flex items-center
                                  ${!shiftActive || loading ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                              >
                                <FiEdit2 className="w-4 h-4 mr-1" />
                                Modifier
                              </button>
                              <button
                                onClick={() => openDeleteModal(charge)}
                                disabled={!shiftActive || loading}
                                className={`
                                  text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg 
                                  text-sm font-medium transition duration-150 flex items-center
                                  ${!shiftActive || loading ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                              >
                                <FiTrash2 className="w-4 h-4 mr-1" />
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Version Mobile */}
                <div className="sm:hidden">
                  {loading ? (
                    // Spinner pour mobile pendant le chargement
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                      <p className="text-gray-600">Chargement des charges...</p>
                    </div>
                  ) : charges.length === 0 ? (
                    // Message quand il n'y a pas de charges (mobile)
                    <div className="text-center py-16 px-4">
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center">
                          <FaMoneyBillAlt className="w-10 h-10 text-red-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune charge pour ce shift</h3>
                      <p className="text-gray-500 mb-6">Commencez par ajouter votre première charge.</p>
                      <button
                        onClick={openAddModal}
                        disabled={!shiftActive || fetching}
                        className={`
                          inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                          font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md
                          ${!shiftActive || fetching ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <HiOutlineCurrencyDollar className="w-5 h-5 mr-2" />
                        Ajouter une charge
                      </button>
                    </div>
                  ) : (
                    // Afficher les charges (mobile)
                    <div className="space-y-4 p-4">
                      {charges.map((charge) => (
                        <div key={charge.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-150">
                          <div className="flex justify-between items-start mb-3 truncate">
                            <div className="flex-1">
                              <div className="mb-2">
                                <div className="text-sm text-gray-700 font-medium">
                                  {charge.description || "Aucune description"}
                                </div>
                              </div>
                              <div className="flex items-center mb-2">
                                <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-xs text-gray-600">
                                  {shiftStats?.user?.prenom} {shiftStats?.user?.nom}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-xs text-gray-500">
                                    {formatDate(charge.created_at)}
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-red-600">
                                  {formatAmount(charge.amount)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => openEditModal(charge)}
                              disabled={!shiftActive || loading}
                              className={`
                                flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-lg 
                                text-sm font-medium transition duration-150 flex items-center justify-center
                                ${!shiftActive || loading ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <FiEdit2 className="w-4 h-4 mr-2" />
                              Modifier
                            </button>
                            <button
                              onClick={() => openDeleteModal(charge)}
                              disabled={!shiftActive || loading}
                              className={`
                                flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-lg 
                                text-sm font-medium transition duration-150 flex items-center justify-center
                                ${!shiftActive || loading ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <FiTrash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total des charges (affiché seulement s'il y a des charges et non en chargement) */}
        {!loading && charges.length > 0 && (
          <div className="inline-block rounded-2xl bg-white px-6 py-1">
            <p className="font-medium text-gray-800">
              Total des charges de ce shift :
              <span className="ml-6 text-xl font-bold text-red-600 text-right">
                {formatAmount(totalCharges)}
              </span>
            </p>
          </div>
        )}

        {/* Modal Ajout/Modification */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div ref={formRef} className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-md mx-2 transform transition-all max-h-[90vh] overflow-y-auto">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {isEditing ? "Modifier la charge" : "Ajouter une charge"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition duration-150 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
                {!shiftActive && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-600">
                      <FaTriangleExclamation className="inline w-4 h-4 mr-1" />
                      Shift non démarré - Impossible d'ajouter/modifier des charges
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant (DH) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={isEditing ? editData.amount : newCharge.amount}
                        onChange={(e) => handleInputChange(e, "amount")}
                        onFocus={() => handleInputFocus("amount")}
                        className={`
                          w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                          focus:border-blue-500 transition duration-150 text-sm sm:text-base
                          ${!shiftActive ? 'bg-gray-100 cursor-not-allowed' : ''}
                        `}
                        required
                        placeholder="0.00"
                        disabled={!shiftActive}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format: 150.50
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={isEditing ? editData.description : newCharge.description}
                      onChange={(e) => handleInputChange(e, "description")}
                      onFocus={() => handleInputFocus("description")}
                      className={`
                        w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                        focus:border-blue-500 transition duration-150 text-sm sm:text-base
                        ${!shiftActive ? 'bg-gray-100 cursor-not-allowed' : ''}
                      `}
                      rows="3"
                      placeholder="Décrivez la charge (facultatif)"
                      disabled={!shiftActive}
                    />
                  </div>
                </div>

                {/* Clavier virtuel réutilisable - seulement sur desktop */}
                {showKeyboard && !isMobile && shiftActive && (
                  <div className="mt-4 border-t pt-4">
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

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-150 order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !shiftActive || (!isEditing && (!newCharge.amount || parseFloat(newCharge.amount) <= 0))}
                    className={`
                      px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg 
                      transition duration-150 flex items-center justify-center order-1 sm:order-2
                      ${(loading || !shiftActive) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        {isEditing ? "Mise à jour..." : "Ajout..."}
                      </>
                    ) : isEditing ? "Mettre à jour" : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Charges;