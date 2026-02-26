import React, { useEffect, useState, useCallback, useRef } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import VirtualKeyboard from "../Modals/VirtualKeyboard";
import { 
  FiTruck, 
  FiEdit2, 
  FiTrash2, 
  FiX,
  FiPhone,
  FiMail,
  FiMapPin
} from "react-icons/fi";
import { FaSpinner, FaBuilding, FaPlus } from "react-icons/fa";
import { HiOutlineTruck } from "react-icons/hi";

function Fournisseurs() {
  // ========== STATE ==========
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editingFournisseur, setEditingFournisseur] = useState(null);
  const [fournisseurToDelete, setFournisseurToDelete] = useState(null);
  
  // État pour la notification
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  // ========== FORM STATE ==========
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
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

  // Utilisation du hook d'erreur
  const {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  } = useErrorHandler();

  // ========== NOTIFICATION ==========
  const showNotification = useCallback((type, message, error = null, title = "", duration = 5000) => {
    if (error && handleError(error)) {
      // Si c'est une erreur d'abonnement, ne pas afficher la notification normale
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

  // ========== VIRTUAL KEYBOARD HANDLERS ==========
  const handleKeyboardChange = useCallback((input) => {
    setKeyboardInput(input);
    
    if (inputName === "name") {
      setFormData(prev => ({ ...prev, name: input }));
    } else if (inputName === "email") {
      setFormData(prev => ({ ...prev, email: input }));
    } else if (inputName === "phone") {
      setFormData(prev => ({ ...prev, phone: input }));
    } else if (inputName === "address") {
      setFormData(prev => ({ ...prev, address: input }));
    }
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

  // ========== DATA FETCHING ==========
  const fetchFournisseurs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AxiosClient.get("/fournisseurs");
      setFournisseurs(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error("Erreur fetch fournisseurs:", error);
      showNotification("error", "Erreur lors du chargement des fournisseurs", error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchFournisseurs();
  }, [fetchFournisseurs]);

  // ========== FORM HANDLERS ==========
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });
    setEditingFournisseur(null);
    setShowModal(false);
    setShowKeyboard(false);
    setInputName(null);
    setKeyboardInput("");
  }, []);

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setFormData({
      name: fournisseur.name,
      email: fournisseur.email || "",
      phone: fournisseur.phone || "",
      address: fournisseur.address || "",
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (inputName === name) {
      setKeyboardInput(value);
    }
  };

  const handleInputFocus = (field) => {
    // Ne pas afficher le clavier virtuel sur mobile
    if (isMobile) return;
    
    setInputName(field);
    setShowKeyboard(true);
    setKeyboardInput(formData[field] || "");
  };

  // ========== CRUD OPERATIONS ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showNotification(
        "error", 
        "Veuillez saisir le nom du fournisseur",
        null,
        "Erreur de validation",
        6000
      );
      return;
    }

    try {
      setLoading(true);
      if (editingFournisseur) {
        await AxiosClient.put(`/fournisseurs/${editingFournisseur.id}`, formData);
        showNotification("success", "Fournisseur modifié avec succès");
      } else {
        await AxiosClient.post("/fournisseurs", formData);
        showNotification("success", "Fournisseur ajouté avec succès");
      }
      resetForm();
      fetchFournisseurs();
    } catch (error) {
      console.error("Erreur sauvegarde fournisseur:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la sauvegarde";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (fournisseur) => {
    setFournisseurToDelete(fournisseur);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setFournisseurToDelete(null);
    setShowDeleteModal(false);
  };

  const deleteFournisseur = async () => {
    if (!fournisseurToDelete) return;

    try {
      setLoading(true);
      await AxiosClient.delete(`/fournisseurs/${fournisseurToDelete.id}`);
      showNotification("success", "Fournisseur supprimé avec succès");
      fetchFournisseurs();
    } catch (error) {
      console.error("Erreur suppression fournisseur:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la suppression";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
      closeDeleteModal();
    }
  };

  // ========== RENDER HELPERS ==========
  const renderContactInfo = (fournisseur) => (
    <div className="space-y-2">
      <div className="flex items-center text-sm text-gray-600">
        <FiMail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
        <span>{fournisseur.email || "Non renseigné"}</span>
      </div>
      <div className="flex items-center text-sm text-gray-600">
        <FiPhone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
        <span>{fournisseur.phone || "Non renseigné"}</span>
      </div>
    </div>
  );

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
          message="Êtes-vous sûr de vouloir supprimer ce fournisseur ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          loading={loading}
          item={fournisseurToDelete}
          itemType="fournisseur"
          onConfirm={deleteFournisseur}
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
             <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Gérez vos partenaires fournisseurs</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition duration-200 flex items-center justify-center text-xs sm:text-sm shadow-sm hover:shadow-md"
            >
              <FaPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">Ajouter un fournisseur</span>
              <span className="xs:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[80vh] overflow-y-auto">
            {/* Version Desktop */}
            <table className="w-full hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
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
                        <p className="text-gray-600">Chargement des fournisseurs...</p>
                      </div>
                    </td>
                  </tr>
                ) : fournisseurs.length === 0 ? (
                  // Message quand il n'y a pas de fournisseurs
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                          <FaBuilding className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun fournisseur trouvé</h3>
                        <p className="text-gray-500 mb-6">Commencez par ajouter votre premier fournisseur.</p>
                        <button
                          onClick={openAddModal}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md"
                        >
                          <HiOutlineTruck className="w-5 h-5 mr-2" />
                          Ajouter un fournisseur
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Afficher les fournisseurs
                  fournisseurs.map((fournisseur) => (
                    <tr key={fournisseur.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center border border-purple-200 shadow-sm">
                            <FiTruck className="w-6 h-6 text-purple-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {fournisseur.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fournisseur.email || (
                            <span className="text-gray-400 italic">Non renseigné</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fournisseur.phone || (
                            <span className="text-gray-400 italic">Non renseigné</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {fournisseur.address || (
                            <span className="text-gray-400 italic">Non renseignée</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(fournisseur)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center"
                          >
                            <FiEdit2 className="w-4 h-4 mr-1" />
                            Modifier
                          </button>
                          <button
                            onClick={() => openDeleteModal(fournisseur)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center"
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
                  <p className="text-gray-600">Chargement des fournisseurs...</p>
                </div>
              ) : fournisseurs.length === 0 ? (
                // Message quand il n'y a pas de fournisseurs (mobile)
                <div className="text-center py-16 px-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center">
                      <FaBuilding className="w-10 h-10 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun fournisseur trouvé</h3>
                  <p className="text-gray-500 mb-6">Commencez par ajouter votre premier fournisseur.</p>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md"
                  >
                    <HiOutlineTruck className="w-5 h-5 mr-2" />
                    Ajouter un fournisseur
                  </button>
                </div>
              ) : (
                // Afficher les fournisseurs (mobile)
                <div className="space-y-4 p-0">
                  {fournisseurs.map((fournisseur) => (
                    <div key={fournisseur.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition duration-150">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center border border-purple-200 shadow-sm">
                          <FiTruck className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-gray-900 mb-2">
                            {fournisseur.name}
                          </div>
                          {renderContactInfo(fournisseur)}
                        </div>
                      </div>
                      {fournisseur.address && (
                        <div className="mb-4 text-sm text-gray-600">
                          <div className="flex items-start">
                            <FiMapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{fournisseur.address}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(fournisseur)}
                          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150 flex items-center justify-center"
                        >
                          <FiEdit2 className="w-4 h-4 mr-2" />
                          Modifier
                        </button>
                        <button
                          onClick={() => openDeleteModal(fournisseur)}
                          className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150 flex items-center justify-center"
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
        </div>

        {/* Modal Ajout/Modification */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div ref={formRef} className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-2xl mx-2 transform transition-all max-h-[90vh] overflow-y-auto">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {editingFournisseur ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition duration-150 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du fournisseur *
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Ex: ABC Distribution"
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("name")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="exemple@fournisseur.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("email")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="text"
                        name="phone"
                        placeholder="+212 6 00 00 00 00"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("phone")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse
                      </label>
                      <input
                        type="text"
                        name="address"
                        placeholder="Adresse complète"
                        value={formData.address}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("address")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Clavier virtuel réutilisable - seulement sur desktop */}
                {showKeyboard && !isMobile && (
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-150 order-2 sm:order-1"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2"
                  >
                    {loading && (
                      <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    )}
                    {editingFournisseur ? "Mettre à jour" : "Ajouter"}
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

export default Fournisseurs;