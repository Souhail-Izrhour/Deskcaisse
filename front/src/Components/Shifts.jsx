import React, { useEffect, useState, useCallback } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import { FiTrash2, FiUser, FiTrendingUp, FiTrendingDown, FiPrinter } from "react-icons/fi";
import { FaSpinner, FaUserClock} from "react-icons/fa";

function Shifts() {
  // ========== STATE ==========
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printingShiftId, setPrintingShiftId] = useState(null);
  
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

  // ========== DATA FETCHING ==========
  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AxiosClient.get("/shifts");
      const shiftsData = Array.isArray(data.data) ? data.data : data;
      
      const sortedShifts = [...shiftsData].sort((a, b) => {
        if (a.ended_at === null && b.ended_at !== null) return -1;
        if (b.ended_at === null && a.ended_at !== null) return 1;
        
        const dateA = new Date(a.started_at);
        const dateB = new Date(b.started_at);
        return dateB - dateA;
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

  // ========== IMPRESSION SHIFT ==========
  const printShift = async (shift) => {
    if (shift.ended_at === null) {
      showNotification("warning", "Impossible d'imprimer un shift en cours. Utilisez l'impression depuis la page active.");
      return;
    }

    setPrintingShiftId(shift.id);
    try {
      await AxiosClient.post(`/shifts/${shift.id}/print`);
      showNotification("success", "Shift imprimé avec succès");
    } catch (error) {
      console.error("Erreur impression shift:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'impression";
      showNotification("error", errorMsg, error);
    } finally {
      setPrintingShiftId(null);
    }
  };

  // ========== RENDER HELPERS ==========
  const renderNetAmount = (ventes, charges) => {
    const net = calculateNet(ventes, charges);
    const isPositive = net >= 0;
    
    return (
      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isPositive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isPositive ? (
          <FiTrendingUp className="w-3 h-3 mr-0.5" />
        ) : (
          <FiTrendingDown className="w-3 h-3 mr-0.5" />
        )}
        {formatCurrency(net)}
      </div>
    );
  };

  const renderStatusBadge = (ended_at) => {
    const isActive = ended_at === null;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-yellow-100 text-yellow-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-0.5 animate-pulse"></span>
            Actif
          </>
        ) : (
          "Terminé"
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-blue-100 pt-2 px-1 sm:px-2 md:px-3 pb-3 sm:pb-4 md:pb-6">
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

        {/* Header - Version plus mince */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-gray-600 text-xs sm:text-sm">Consultez l'historique des plages horaires de travail</p>
            </div>
            
            {/* Statistiques */}
            <div className="flex items-center justify-center space-x-3 text-xs">
              <div className="text-gray-600">
                <span className="font-semibold text-gray-900">{shifts.length}</span> shifts
              </div>
              <div className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {shifts.filter(s => s.ended_at === null).length}
                </span> actifs
              </div>
            </div>
          </div>
        </div>

        {/* Tableau - Version plus compacte */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[80vh] overflow-y-auto">
            {/* Version Desktop */}
            <table className="w-full table-fixed hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Début
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventes / Charges
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mb-3" />
                        <p className="text-xs text-gray-600">Chargement des shifts...</p>
                      </div>
                    </td>
                  </tr>
                ) : shifts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center mb-3">
                          <FaUserClock className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Aucun shift trouvé</h3>
                        <p className="text-xs text-gray-500">Aucun shift n'a été enregistré.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => {
                    const net = calculateNet(shift.ventes, shift.charges);
                    const isActive = shift.ended_at === null;
                    
                    return (
                      <tr 
                        key={shift.id} 
                        className="hover:bg-gray-50 transition duration-150"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border shadow-sm ${
                              isActive 
                                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                            }`}>
                              <FiUser className={`w-4 h-4 ${isActive ? 'text-yellow-500' : 'text-blue-500'}`} />
                            </div>
                            <div className="ml-2">
                              <div className="text-xs font-semibold text-gray-900">
                                {getUserName(shift)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {renderStatusBadge(shift.ended_at)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {formatDateTime(shift.started_at)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {shift.ended_at ? formatDateTime(shift.ended_at) : "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center text-xs">
                              <FiTrendingUp className="w-3 h-3 mr-0.5 text-green-500" />
                              <span className="text-gray-900">{formatCurrency(shift.ventes)}</span>
                            </div>
                            <div className="flex items-center text-xs">
                              <FiTrendingDown className="w-3 h-3 mr-0.5 text-red-500" />
                              <span className="text-gray-900">{formatCurrency(shift.charges)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {renderNetAmount(shift.ventes, shift.charges)}
                        </td>
                        {/* Bouton d'impression */}
                        <td className="px-1 py-2 whitespace-nowrap text-center">
                          {!isActive && (
                            <button
                              onClick={() => printShift(shift)}
                              disabled={printingShiftId === shift.id}
                              className={`inline-flex items-center p-1.5 rounded-lg text-xs font-medium transition duration-150 ${
                                printingShiftId === shift.id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                              title="Imprimer le rapport"
                            >
                              {printingShiftId === shift.id ? (
                                <FaSpinner className="animate-spin w-3.5 h-3.5" />
                              ) : (
                                <FiPrinter className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-1 py-2 whitespace-nowrap text-right text-xs font-medium">
                          {!isActive ? (
                            <button
                              onClick={() => openDeleteModal(shift)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition duration-150 flex items-center"
                              title="Supprimer"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-gray-400 text-2xs italic p-1.5 block text-right">
                              Actif
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Version Mobile - Plus compacte */}
            <div className="sm:hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mb-3" />
                  <p className="text-xs text-gray-600">Chargement...</p>
                </div>
              ) : shifts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center">
                      <FaUserClock className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun shift trouvé</h3>
                  <p className="text-xs text-gray-500">Aucun shift n'a été enregistré.</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {shifts.map((shift) => {
                    const net = calculateNet(shift.ventes, shift.charges);
                    const isActive = shift.ended_at === null;
                    
                    return (
                      <div 
                        key={shift.id} 
                        className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-md transition duration-150"
                      >
                        {/* En-tête */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border shadow-sm ${
                              isActive 
                                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' 
                                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                            }`}>
                              <FiUser className={`w-4 h-4 ${isActive ? 'text-yellow-500' : 'text-blue-500'}`} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {getUserName(shift)}
                              </div>
                            </div>
                          </div>
                          {renderStatusBadge(shift.ended_at)}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-gray-50 rounded-lg p-1.5">
                            <div className="text-2xs text-gray-600 font-medium mb-0.5">Début</div>
                            <div className="text-xs text-gray-900">
                              {formatDateTime(shift.started_at)}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-1.5">
                            <div className="text-2xs text-gray-600 font-medium mb-0.5">Fin</div>
                            <div className="text-xs text-gray-900">
                              {shift.ended_at ? formatDateTime(shift.ended_at) : "—"}
                            </div>
                          </div>
                        </div>

                        {/* Durée */}
                        <div className="mb-2">
                          <div className="text-2xs text-gray-600 font-medium mb-0.5">Durée</div>
                          <div className="text-xs font-semibold text-gray-900">
                            {formatDuration(shift.duration)}
                          </div>
                        </div>

                        {/* Montants */}
                        <div className="grid grid-cols-3 gap-1 mb-2">
                          <div className="bg-green-50 rounded-lg p-1.5 text-center">
                            <div className="text-2xs text-green-600 font-medium">Ventes</div>
                            <div className="text-xs font-semibold text-gray-900">
                              {formatCurrency(shift.ventes)}
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-1.5 text-center">
                            <div className="text-2xs text-red-600 font-medium">Charges</div>
                            <div className="text-xs font-semibold text-gray-900">
                              {formatCurrency(shift.charges)}
                            </div>
                          </div>
                          <div className={`rounded-lg p-1.5 text-center ${
                            net >= 0 ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <div className={`text-2xs font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Net
                            </div>
                            <div className="text-xs font-semibold text-gray-900">
                              {formatCurrency(net)}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 pt-2 border-t border-gray-100">
                          {/* Bouton d'impression */}
                          {!isActive && (
                            <button
                              onClick={() => printShift(shift)}
                              disabled={printingShiftId === shift.id}
                              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition duration-150 flex items-center justify-center ${
                                printingShiftId === shift.id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                            >
                              {printingShiftId === shift.id ? (
                                <FaSpinner className="animate-spin w-3 h-3 mr-1" />
                              ) : (
                                <FiPrinter className="w-3 h-3 mr-1" />
                              )}
                              Imprimer
                            </button>
                          )}
                          
                          {/* Bouton de suppression */}
                          <button
                            onClick={() => openDeleteModal(shift)}
                            className="flex-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition duration-150 flex items-center justify-center"
                          >
                            <FiTrash2 className="w-3 h-3 mr-1" />
                            Supprimer
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