import React, { useEffect, useState, useCallback } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import { FiTrash2, FiUser,FiTrendingUp,FiTrendingDown} from "react-icons/fi";
import { FaSpinner, FaUserClock } from "react-icons/fa";

function Shifts() {
  // ========== STATE ==========
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);

  // État pour la notification
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  // ========== HOOKS ==========
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

  // ========== DATA FETCHING ==========
 const fetchShifts = useCallback(async () => {
  setLoading(true);
  try {
    const { data } = await AxiosClient.get("/shifts");
    const shiftsData = Array.isArray(data.data) ? data.data : data;
    
    // Trier les shifts : actifs en premier, puis par date de début décroissante
    const sortedShifts = [...shiftsData].sort((a, b) => {
      // Si a est actif et b ne l'est pas, a passe avant
      if (a.ended_at === null && b.ended_at !== null) return -1;
      // Si b est actif et a ne l'est pas, b passe avant
      if (b.ended_at === null && a.ended_at !== null) return 1;
      
      // Si les deux sont actifs ou les deux sont terminés, trier par date de début décroissante
      const dateA = new Date(a.started_at);
      const dateB = new Date(b.started_at);
      return dateB - dateA; // Les plus récents en premier
    });
    
    setShifts(sortedShifts);
  } catch (error) {
    console.error("Erreur fetch shifts:", error);
    showNotification("error", "Erreur lors du chargement des shifts", error);
  } finally {
    setLoading(false);
  }
}, [showNotification]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // ========== FORMAT HELPERS ==========
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return "N/A";
    return duration;
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2) + " DH";
  };

  const calculateNet = (ventes, charges) => {
    return parseFloat(ventes) - parseFloat(charges);
  };

  const getUserName = (shift) => {
    return shift.user ? `${shift.user.prenom} ${shift.user.nom}` : `Utilisateur ${shift.user_id}`;
  };

  // ========== DELETE OPERATIONS ==========
  const openDeleteModal = (shift) => {
    setShiftToDelete(shift);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShiftToDelete(null);
    setShowDeleteModal(false);
  };

  const deleteShift = async () => {
    if (!shiftToDelete) return;

    try {
      setLoading(true);
      await AxiosClient.delete(`/shifts/${shiftToDelete.id}`);
      showNotification("success", "Shift supprimé avec succès");
      fetchShifts();
    } catch (error) {
      console.error("Erreur suppression shift:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la suppression";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
      closeDeleteModal();
    }
  };

  // ========== RENDER HELPERS ==========
  const renderNetAmount = (ventes, charges) => {
    const net = calculateNet(ventes, charges);
    const isPositive = net >= 0;
    
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isPositive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isPositive ? (
          <FiTrendingUp className="w-3 h-3 mr-1" />
        ) : (
          <FiTrendingDown className="w-3 h-3 mr-1" />
        )}
        {formatCurrency(net)}
      </div>
    );
  };

  const renderStatusBadge = (ended_at) => {
    const isActive = ended_at === null;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-yellow-100 text-yellow-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
            Actif
          </>
        ) : (
          "Terminé"
        )}
      </span>
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
        
        {/* Modal de confirmation de suppression */}
        <ConfirmationModal
          show={showDeleteModal}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer ce shift ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          loading={loading}
          item={shiftToDelete}
          itemType="shift"
          onConfirm={deleteShift}
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
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-2 mb-2 sm:mb-3">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Consultez l'historique des plages horaires de travail</p>
            </div>
            
            {/* Statistiques */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-gray-600">
                <span className="font-semibold text-gray-900">{shifts.length}</span> shifts au total
              </div>
              <div className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {shifts.filter(s => s.ended_at === null).length}
                </span> actifs
              </div>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[80vh] overflow-y-auto">
            {/* Version Desktop */}
            <table className="w-full table-fixed hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Début
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin
                  </th>
                  
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventes / Charges
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
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
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                        <p className="text-gray-600">Chargement des shifts...</p>
                      </div>
                    </td>
                  </tr>
                ) : shifts.length === 0 ? (
                  // Message quand il n'y a pas de shifts
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                          <FaUserClock className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun shift trouvé</h3>
                        <p className="text-gray-500">Aucun shift n'a été enregistré pour le moment.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Afficher les shifts
                  shifts.map((shift) => {
                    const net = calculateNet(shift.ventes, shift.charges);
                    const isActive = shift.ended_at === null;
                    
                    return (
                      <tr 
                        key={shift.id} 
                        className="hover:bg-gray-50 transition duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm ${
                              isActive 
                                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                            }`}>
                              <FiUser className={`w-6 h-6 ${isActive ? 'text-yellow-500' : 'text-blue-500'}`} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {getUserName(shift)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {shift.user?.role || "Utilisateur"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(shift.ended_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateTime(shift.started_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {shift.ended_at ? formatDateTime(shift.ended_at) : "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <FiTrendingUp className="w-3 h-3 mr-1 text-green-500" />
                              <span className="text-gray-900">{formatCurrency(shift.ventes)}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <FiTrendingDown className="w-3 h-3 mr-1 text-red-500" />
                              <span className="text-gray-900">{formatCurrency(shift.charges)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderNetAmount(shift.ventes, shift.charges)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openDeleteModal(shift)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center ml-auto"
                          >
                            <FiTrash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </button>
                          
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Version Mobile */}
            <div className="sm:hidden">
              {loading ? (
                // Spinner pour mobile pendant le chargement
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                  <p className="text-gray-600">Chargement des shifts...</p>
                </div>
              ) : shifts.length === 0 ? (
                // Message quand il n'y a pas de shifts (mobile)
                <div className="text-center py-16 px-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center">
                      <FaUserClock className="w-10 h-10 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun shift trouvé</h3>
                  <p className="text-gray-500">Aucun shift n'a été enregistré pour le moment.</p>
                </div>
              ) : (
                // Afficher les shifts (mobile)
                <div className="space-y-4 p-0">
                  {shifts.map((shift) => {
                    const net = calculateNet(shift.ventes, shift.charges);
                    const isActive = shift.ended_at === null;
                    
                    return (
                      <div 
                        key={shift.id} 
                        className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition duration-150"
                      >
                        {/* En-tête avec utilisateur et statut */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm ${
                              isActive 
                                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                            }`}>
                              <FiUser className={`w-5 h-5 ${isActive ? 'text-yellow-500' : 'text-blue-500'}`} />
                            </div>
                            <div>
                              <div className="text-base font-semibold text-gray-900">
                                {getUserName(shift)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {shift.user?.role || "Utilisateur"}
                              </div>
                            </div>
                          </div>
                          {renderStatusBadge(shift.ended_at)}
                        </div>

                        {/* Dates et durée */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600 font-medium mb-1">Début</div>
                            <div className="text-sm text-gray-900">
                              {formatDateTime(shift.started_at)}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600 font-medium mb-1">Fin</div>
                            <div className="text-sm text-gray-900">
                              {shift.ended_at ? formatDateTime(shift.ended_at) : "—"}
                            </div>
                          </div>
                        </div>

                        {/* Durée */}
                        <div className="mb-4">
                          <div className="text-xs text-gray-600 font-medium mb-1">Durée</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {formatDuration(shift.duration)}
                          </div>
                        </div>

                        {/* Montants */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-green-600 font-medium">Ventes</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(shift.ventes)}
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-2 text-center">
                            <div className="text-xs text-red-600 font-medium">Charges</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(shift.charges)}
                            </div>
                          </div>
                          <div className={`rounded-lg p-2 text-center ${
                            net >= 0 ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <div className={`text-xs font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Net
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(net)}
                            </div>
                          </div>
                        </div>

                        {/* Action de suppression */}
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                          <button
                            onClick={() => openDeleteModal(shift)}
                            className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition duration-150 flex items-center justify-center w-full"
                          >
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Supprimer ce shift
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shifts;