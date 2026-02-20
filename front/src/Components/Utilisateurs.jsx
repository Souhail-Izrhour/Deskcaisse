import React, { useEffect, useState, useCallback, useRef } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import VirtualKeyboard from "../Modals/VirtualKeyboard";
import { FiUser, FiEdit2, FiTrash2, FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { FaUser, FaUserShield, FaSpinner, FaUserPlus } from "react-icons/fa";
import { HiOutlineUserAdd } from "react-icons/hi";

function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editData, setEditData] = useState({
    id: null,
    nom: "",
    prenom: "",
    email: "",
    role: "",
  });

  const [newUser, setNewUser] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "serveur",
  });

  // États pour les mots de passe en édition
  const [editPassword, setEditPassword] = useState({
    password: "",
    password_confirmation: "",
  });

  // États pour afficher/masquer les mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
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

  // Fonction de notification améliorée avec gestion d'erreur
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

  // Fermeture de la notification
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  // Gestion du clavier virtuel
  const handleKeyboardChange = useCallback((input) => {
    setKeyboardInput(input);
    
    if (inputName === "nom") {
      isEditing 
        ? setEditData(prev => ({ ...prev, nom: input }))
        : setNewUser(prev => ({ ...prev, nom: input }));
    } else if (inputName === "prenom") {
      isEditing 
        ? setEditData(prev => ({ ...prev, prenom: input }))
        : setNewUser(prev => ({ ...prev, prenom: input }));
    } else if (inputName === "email") {
      isEditing 
        ? setEditData(prev => ({ ...prev, email: input }))
        : setNewUser(prev => ({ ...prev, email: input }));
    }
  }, [inputName, isEditing]);

  const handleKeyPress = useCallback((button) => {
    if (button === "{bksp}") {
      const currentValue = isEditing 
        ? editData[inputName] || ""
        : newUser[inputName] || "";
      
      const newValue = currentValue.slice(0, -1);
      setKeyboardInput(newValue);
      
      if (inputName) {
        if (isEditing) {
          setEditData(prev => ({ ...prev, [inputName]: newValue }));
        } else {
          setNewUser(prev => ({ ...prev, [inputName]: newValue }));
        }
      }
    } else if (button === "{space}") {
      const newValue = keyboardInput + " ";
      setKeyboardInput(newValue);
      
      if (inputName) {
        if (isEditing) {
          setEditData(prev => ({ ...prev, [inputName]: newValue }));
        } else {
          setNewUser(prev => ({ ...prev, [inputName]: newValue }));
        }
      }
    }
  }, [inputName, isEditing, editData, newUser, keyboardInput]);

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

  // Fetch utilisateurs avec AxiosClient et gestion d'erreur
  const fetchUtilisateurs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AxiosClient.get("/users");
      setUtilisateurs(response.data.data);
    } catch (error) {
      console.error("Erreur fetch utilisateurs:", error);
      showNotification("error", "Erreur lors du chargement des utilisateurs", error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchUtilisateurs();
  }, [fetchUtilisateurs]);

  const resetForm = useCallback(() => {
    setNewUser({
      nom: "",
      prenom: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "serveur",
    });
    setEditData({
      id: null,
      nom: "",
      prenom: "",
      email: "",
      role: "",
    });
    setEditPassword({
      password: "",
      password_confirmation: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
    setShowModal(false);
    setIsEditing(false);
    setShowKeyboard(false);
    setInputName(null);
    setKeyboardInput("");
  }, []);

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditData(user);
    setEditPassword({
      password: "",
      password_confirmation: "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Validation des mots de passe
  const validatePasswords = (isEditMode) => {
    if (isEditMode) {
      // Validation pour l'édition
      if (editPassword.password || editPassword.password_confirmation) {
        if (editPassword.password !== editPassword.password_confirmation) {
          showNotification(
            "error", 
            "Les mots de passe ne correspondent pas. Veuillez vérifier votre saisie.",
            null,
            "Erreur de validation",
            6000
          );
          return false;
        }
        
        if (editPassword.password.length < 6) {
          showNotification(
            "error",
            "Le mot de passe doit contenir au moins 6 caractères.",
            null,
            "Erreur de validation",
            6000
          );
          return false;
        }
      }
    } else {
      // Validation pour l'ajout
      if (newUser.password !== newUser.password_confirmation) {
        showNotification(
          "error", 
          "Les mots de passe ne correspondent pas. Veuillez vérifier votre saisie.",
          null,
          "Erreur de validation",
          6000
        );
        return false;
      }
      
      if (newUser.password.length < 6) {
        showNotification(
          "error",
          "Le mot de passe doit contenir au moins 6 caractères.",
          null,
          "Erreur de validation",
          6000
        );
        return false;
      }
    }
    
    return true;
  };

  // Ajouter un utilisateur avec AxiosClient et gestion d'erreur
  const addUtilisateur = async () => {
    // Validation des mots de passe
    if (!validatePasswords(false)) {
      return;
    }

    try {
      setLoading(true);
      await AxiosClient.post("/users", newUser);
      showNotification("success", "Utilisateur ajouté avec succès");
      resetForm();
      fetchUtilisateurs();
    } catch (error) {
      console.error("Erreur add utilisateur:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'ajout";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
    }
  };

  // Modifier un utilisateur avec AxiosClient et gestion d'erreur
  const updateUtilisateur = async () => {
    // Validation des mots de passe pour l'édition
    if (!validatePasswords(true)) {
      return;
    }

    try {
      setLoading(true);
      
      // Préparation des données à envoyer
      const dataToSend = { ...editData };
      
      // Si un nouveau mot de passe est fourni, on l'ajoute
      if (editPassword.password) {
        dataToSend.password = editPassword.password;
        dataToSend.password_confirmation = editPassword.password_confirmation;
      }
      
      await AxiosClient.put(`/users/${editData.id}`, dataToSend);
      showNotification("success", "Utilisateur modifié avec succès");
      resetForm();
      fetchUtilisateurs();
    } catch (error) {
      console.error("Erreur update utilisateur:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la modification";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  // Supprimer un utilisateur avec AxiosClient et gestion d'erreur
  const deleteUtilisateur = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      await AxiosClient.delete(`/users/${userToDelete.id}`);
      showNotification("success", "Utilisateur supprimé avec succès");
      fetchUtilisateurs();
    } catch (error) {
      console.error("Erreur delete utilisateur:", error);
      const errorMsg = error.response?.data?.message || "Impossible de supprimer";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
      closeDeleteModal();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateUtilisateur();
    } else {
      addUtilisateur();
    }
  };

  const handleInputFocus = (field) => {
    // Ne pas afficher le clavier virtuel sur mobile
    if (isMobile) return;
    
    setInputName(field);
    setShowKeyboard(true);
    const currentValue = isEditing ? editData[field] || "" : newUser[field] || "";
    setKeyboardInput(currentValue);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    
    if (isEditing) {
      setEditData(prev => ({ ...prev, [field]: value }));
    } else {
      setNewUser(prev => ({ ...prev, [field]: value }));
    }
    
    if (inputName === field) {
      setKeyboardInput(value);
    }
  };

  // Gestion du changement de mot de passe
  const handlePasswordChange = (e, field) => {
    const value = e.target.value;
    
    if (isEditing) {
      setEditPassword(prev => ({ ...prev, [field]: value }));
    } else {
      setNewUser(prev => ({ ...prev, [field]: value }));
    }
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
        
        {/* Modal de confirmation de suppression */}
        <ConfirmationModal
          show={showDeleteModal}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          loading={loading}
          item={userToDelete}
          onConfirm={deleteUtilisateur}
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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-2 sm:mb-3">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gérez les accès et permissions de votre équipe</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center text-sm sm:text-base shadow-sm hover:shadow-md"
            >
              <HiOutlineUserAdd className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="hidden xs:inline">Ajouter un utilisateur</span>
              <span className="xs:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {/* Version Desktop */}
            <table className="w-full hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
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
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                        <p className="text-gray-600">Chargement des utilisateurs...</p>
                      </div>
                    </td>
                  </tr>
                ) : utilisateurs.length === 0 ? (
                  // Message quand il n'y a pas d'utilisateurs
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                          <FaUserPlus className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                        <p className="text-gray-500 mb-6">Commencez par ajouter le premier utilisateur.</p>
                        <button
                          onClick={openAddModal}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md"
                        >
                          <HiOutlineUserAdd className="w-5 h-5 mr-2" />
                          Ajouter un utilisateur
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Afficher les utilisateurs
                  utilisateurs.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200 shadow-sm">
                            <FiUser className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.prenom} {user.nom}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? (
                            <>
                              <FaUserShield className="mr-1" />
                              Administrateur
                            </>
                          ) : (
                            <>
                              <FaUser className="mr-1" />
                              Serveur
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center"
                          >
                            <FiEdit2 className="w-4 h-4 mr-1" />
                            Modifier
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
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
                  <p className="text-gray-600">Chargement des utilisateurs...</p>
                </div>
              ) : utilisateurs.length === 0 ? (
                // Message quand il n'y a pas d'utilisateurs (mobile)
                <div className="text-center py-16 px-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center">
                      <FaUserPlus className="w-10 h-10 text-indigo-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                  <p className="text-gray-500 mb-6">Commencez par ajouter le premier utilisateur.</p>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md"
                  >
                    <HiOutlineUserAdd className="w-5 h-5 mr-2" />
                    Ajouter un utilisateur
                  </button>
                </div>
              ) : (
                // Afficher les utilisateurs (mobile)
                <div className="space-y-4 p-0">
                  {utilisateurs.map((user) => (
                    <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition duration-150">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200 shadow-sm">
                          <FiUser className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-gray-900 mb-1">
                            {user.prenom} {user.nom}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{user.email}</div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? (
                              <>
                                <FaUserShield className="mr-1" />
                                Administrateur
                              </>
                            ) : (
                              <>
                                <FaUser className="mr-1" />
                                Serveur
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150 flex items-center justify-center"
                        >
                          <FiEdit2 className="w-4 h-4 mr-2" />
                          Modifier
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
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
                    {isEditing ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
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
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={isEditing ? editData.nom : newUser.nom}
                        onChange={(e) => handleInputChange(e, "nom")}
                        onFocus={() => handleInputFocus("nom")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={isEditing ? editData.prenom : newUser.prenom}
                        onChange={(e) => handleInputChange(e, "prenom")}
                        onFocus={() => handleInputFocus("prenom")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={isEditing ? editData.email : newUser.email}
                        onChange={(e) => handleInputChange(e, "email")}
                        onFocus={() => handleInputFocus("email")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Section Mot de passe pour l'AJOUT */}
                    {!isEditing && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mot de passe *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={newUser.password}
                              onChange={(e) => handlePasswordChange(e, "password")}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base pr-10"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-150"
                            >
                              {showPassword ? (
                                <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Minimum 6 caractères
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmation mot de passe *
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={newUser.password_confirmation}
                              onChange={(e) => handlePasswordChange(e, "password_confirmation")}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base pr-10"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-150"
                            >
                              {showConfirmPassword ? (
                                <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                          {newUser.password && newUser.password_confirmation && 
                           newUser.password !== newUser.password_confirmation && (
                            <p className="text-xs text-red-600 mt-1">
                               Les mots de passe ne correspondent pas
                            </p>
                          )}
                          {newUser.password && newUser.password_confirmation && 
                           newUser.password === newUser.password_confirmation && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Les mots de passe correspondent
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Section Mot de passe pour l'ÉDITION */}
                    {isEditing && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nouveau mot de passe
                          </label>
                          <div className="relative">
                            <input
                              type={showEditPassword ? "text" : "password"}
                              value={editPassword.password}
                              onChange={(e) => handlePasswordChange(e, "password")}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base pr-10"
                              minLength={6}
                              placeholder="Laisser vide pour ne pas changer"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-150"
                            >
                              {showEditPassword ? (
                                <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Minimum 6 caractères (optionnel)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmation nouveau mot de passe
                          </label>
                          <div className="relative">
                            <input
                              type={showEditConfirmPassword ? "text" : "password"}
                              value={editPassword.password_confirmation}
                              onChange={(e) => handlePasswordChange(e, "password_confirmation")}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base pr-10"
                              minLength={6}
                              placeholder="Laisser vide pour ne pas changer"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-150"
                            >
                              {showEditConfirmPassword ? (
                                <FiEyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <FiEye className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </button>
                          </div>
                          {editPassword.password && editPassword.password_confirmation && 
                           editPassword.password !== editPassword.password_confirmation && (
                            <p className="text-xs text-red-600 mt-1">
                               Les mots de passe ne correspondent pas
                            </p>
                          )}
                          {editPassword.password && editPassword.password_confirmation && 
                           editPassword.password === editPassword.password_confirmation && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Les mots de passe correspondent
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle *
                      </label>
                      <select
                        value={isEditing ? editData.role : newUser.role}
                        onChange={(e) => {
                          isEditing 
                            ? setEditData({ ...editData, role: e.target.value })
                            : setNewUser({ ...newUser, role: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                        required
                      >
                        <option value="serveur">Serveur</option>
                        <option value="admin">Administrateur</option>
                      </select>
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
                    disabled={loading || 
                      (!isEditing && (!newUser.password || !newUser.password_confirmation)) ||
                      (isEditing && ((editPassword.password && !editPassword.password_confirmation) || 
                                     (!editPassword.password && editPassword.password_confirmation)))
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2"
                  >
                    {loading && (
                      <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    )}
                    {isEditing ? "Mettre à jour" : "Ajouter"}
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

export default Utilisateurs;