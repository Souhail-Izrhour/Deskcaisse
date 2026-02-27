import React, { useEffect, useState, useCallback } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import NotificationModal from "../Modals/NotificationModal";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import EditUserModal from "../Modals/EditUserModal";
import { useNavigate } from "react-router-dom";
import { 
  FaUsers, 
  FaBuilding, 
  FaSpinner, 
  FaUserCheck, 
  FaUserClock,
  FaUserTag,
  FaEdit,
  FaTrash,
  FaUndo,
  FaBan,
  FaCheck
} from "react-icons/fa";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { FiMail, FiPhone, FiUser, FiCalendar, FiRefreshCw } from "react-icons/fi";

function Allusers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [groupedUsers, setGroupedUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'deactivate', 'activate', 'delete', 'restore'
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  
  // État pour la notification
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  // Hook d'erreur
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

  // ========== FETCH USERS ==========
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AxiosClient.get("/all-users");
      
      if (response.data.success) {
        const usersData = response.data.data || [];
        setUsers(usersData);
        
        // Grouper les utilisateurs par tenant
        const grouped = usersData.reduce((acc, user) => {
          const tenantId = user.tenant_id || 'sans-tenant';
          const tenantName = user.tenant?.nom || 'Sans tenant';
          
          if (!acc[tenantId]) {
            acc[tenantId] = {
              id: tenantId,
              name: tenantName,
              users: []
            };
          }
          acc[tenantId].users.push(user);
          return acc;
        }, {});
        
        setGroupedUsers(grouped);
      }
    } catch (error) {
      console.error("Erreur fetch users:", error);
      showNotification("error", "Erreur lors du chargement des utilisateurs", error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ========== GESTION DES ACTIONS ==========
  const openConfirmModal = (user, action) => {
    setSelectedUser(user);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setSelectedUser(null);
    setConfirmAction(null);
    setShowConfirmModal(false);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setShowEditModal(false);
  };

  // Activer un utilisateur
  const handleActivate = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await AxiosClient.patch(`/users/${selectedUser.id}/activate`);
      showNotification("success", `L'utilisateur ${selectedUser.prenom} ${selectedUser.nom} a été activé avec succès`);
      fetchUsers();
    } catch (error) {
      console.error("Erreur activation:", error);
      showNotification("error", "Erreur lors de l'activation de l'utilisateur", error);
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  // Désactiver un utilisateur
  const handleDeactivate = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await AxiosClient.patch(`/users/${selectedUser.id}/deactivate`);
      showNotification("success", `L'utilisateur ${selectedUser.prenom} ${selectedUser.nom} a été désactivé avec succès`);
      fetchUsers();
    } catch (error) {
      console.error("Erreur désactivation:", error);
      showNotification("error", "Erreur lors de la désactivation de l'utilisateur", error);
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  // Supprimer définitivement un utilisateur
  const handleDelete = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await AxiosClient.delete(`/users/${selectedUser.id}`);
      showNotification("success", `L'utilisateur ${selectedUser.prenom} ${selectedUser.nom} a été supprimé définitivement`);
      fetchUsers();
    } catch (error) {
      console.error("Erreur suppression:", error);
      showNotification("error", "Erreur lors de la suppression de l'utilisateur", error);
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  // Restaurer un utilisateur
  const handleRestore = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await AxiosClient.post(`/users/${selectedUser.id}/restore`);
      showNotification("success", `L'utilisateur ${selectedUser.prenom} ${selectedUser.nom} a été restauré avec succès`);
      fetchUsers();
    } catch (error) {
      console.error("Erreur restauration:", error);
      showNotification("error", "Erreur lors de la restauration de l'utilisateur", error);
    } finally {
      setActionLoading(false);
      closeConfirmModal();
    }
  };

  const handleConfirmAction = () => {
    switch (confirmAction) {
      case 'activate':
        handleActivate();
        break;
      case 'deactivate':
        handleDeactivate();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'restore':
        handleRestore();
        break;
      default:
        break;
    }
  };

  // Mise à jour après édition
  const handleUserUpdated = () => {
    fetchUsers();
    showNotification("success", "Utilisateur mis à jour avec succès");
  };

  // ========== STATISTIQUES ==========
  const getTotalUsers = () => users.length;
  
  const getActiveUsers = () => users.filter(user => user.is_active).length;
  
  const getInactiveUsers = () => users.filter(user => !user.is_active).length;
  
  const getDeletedUsers = () => users.filter(user => user.deleted_at).length;
  
  const getTenantCount = () => Object.keys(groupedUsers).length;

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
        title={
          confirmAction === 'activate' ? "Confirmer l'activation" :
          confirmAction === 'deactivate' ? "Confirmer la désactivation" :
          confirmAction === 'delete' ? "Confirmer la suppression définitive" :
          "Confirmer la restauration"
        }
        message={
          confirmAction === 'activate' 
            ? `Êtes-vous sûr de vouloir activer l'utilisateur "${selectedUser?.prenom} ${selectedUser?.nom}" ?`
            : confirmAction === 'deactivate'
            ? `Êtes-vous sûr de vouloir désactiver l'utilisateur "${selectedUser?.prenom} ${selectedUser?.nom}" ?`
            : confirmAction === 'delete'
            ? `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${selectedUser?.prenom} ${selectedUser?.nom}" ? Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir restaurer l'utilisateur "${selectedUser?.prenom} ${selectedUser?.nom}" ?`
        }
        confirmText={
          confirmAction === 'activate' ? "Activer" :
          confirmAction === 'deactivate' ? "Désactiver" :
          confirmAction === 'delete' ? "Supprimer" :
          "Restaurer"
        }
        cancelText="Annuler"
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmModal}
        type={
          confirmAction === 'activate' ? 'success' :
          confirmAction === 'deactivate' ? 'warning' :
          confirmAction === 'delete' ? 'danger' :
          'info'
        }
      />

      <EditUserModal
        show={showEditModal}
        user={selectedUser}
        onClose={closeEditModal}
        onSuccess={handleUserUpdated}
      />

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
              onClick={fetchUsers}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-150"
              title="Rafraîchir"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{getTotalUsers()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{getActiveUsers()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaUserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs Inactifs</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{getInactiveUsers()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FaUserClock className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs Supprimés</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{getDeletedUsers()}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <FaTrash className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nombre de Tenants</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{getTenantCount()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaBuilding className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs groupés par tenant */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                <p className="text-gray-600">Chargement des utilisateurs...</p>
              </div>
            </div>
          ) : Object.keys(groupedUsers).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <FaUsers className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                <p className="text-gray-500">Il n'y a pas encore d'utilisateurs dans le système.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedUsers).map((tenant) => (
                <div key={tenant.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  {/* En-tête du tenant */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <HiOutlineBuildingOffice2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {tenant.name}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {tenant.users.length} utilisateur{tenant.users.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ID: {tenant.id}
                      </span>
                    </div>
                  </div>

                  {/* Liste des utilisateurs du tenant */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rôle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tenant.users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center border border-blue-200">
                                  <FiUser className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {user.prenom} {user.nom}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    @{user.username || user.pseudo || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {user.email && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <FiMail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    {user.email}
                                  </div>
                                )}
                                {user.telephone && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <FiPhone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    {user.telephone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FaUserTag className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                                <span className="text-xs font-medium text-gray-700">
                                  {user.role === 'admin' ? 'Administrateur' : 
                                   user.role === 'serveur' ? 'Serveur' : 
                                   user.role || 'Utilisateur'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {user.deleted_at ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <FaTrash className="w-3 h-3 mr-1" />
                                  Supprimé
                                </span>
                              ) : user.is_active ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FaUserCheck className="w-3 h-3 mr-1" />
                                  Actif
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <FaUserClock className="w-3 h-3 mr-1" />
                                  Inactif
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                {/* Bouton Modifier (toujours visible) */}
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition duration-150"
                                  title="Modifier"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>

                                {/* Actions selon le statut */}
                                {user.deleted_at ? (
                                  // Utilisateur supprimé : bouton Restaurer
                                  <button
                                    onClick={() => openConfirmModal(user, 'restore')}
                                    className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition duration-150"
                                    title="Restaurer"
                                  >
                                    <FaUndo className="w-4 h-4" />
                                  </button>
                                ) : user.is_active ? (
                                  // Utilisateur actif : bouton Désactiver
                                  <button
                                    onClick={() => openConfirmModal(user, 'deactivate')}
                                    className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 p-2 rounded-lg transition duration-150"
                                    title="Désactiver"
                                  >
                                    <FaBan className="w-4 h-4" />
                                  </button>
                                ) : (
                                  // Utilisateur inactif : bouton Activer
                                  <button
                                    onClick={() => openConfirmModal(user, 'activate')}
                                    className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition duration-150"
                                    title="Activer"
                                  >
                                    <FaCheck className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Bouton Supprimer définitivement */}
                                <button
                                  onClick={() => openConfirmModal(user, 'delete')}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition duration-150"
                                  title="Supprimer définitivement"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Allusers;