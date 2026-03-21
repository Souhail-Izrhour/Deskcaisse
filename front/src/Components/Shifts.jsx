import React, { useEffect, useState, useCallback } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import { FiTrash2, FiUser, FiTrendingUp, FiTrendingDown, FiPrinter, FiPackage, FiX, FiCreditCard, FiRefreshCw } from "react-icons/fi";
import { FaSpinner, FaUserClock, FaMoneyBillWave } from "react-icons/fa";

function Shifts() {
  // ========== STATE ==========
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printingShiftId, setPrintingShiftId] = useState(null);
  
  // État pour le modal des commandes
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' ou 'charges'
  
  // État pour la suppression de commande
  const [showDeleteOrderModal, setShowDeleteOrderModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);
  
  // État pour la suppression de charge
  const [showDeleteChargeModal, setShowDeleteChargeModal] = useState(false);
  const [chargeToDelete, setChargeToDelete] = useState(null);
  const [deletingCharge, setDeletingCharge] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);

  // État pour le rafraîchissement
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Fonction de rafraîchissement
  const refreshShifts = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchShifts();
      showNotification("success", "Les shifts ont été actualisés avec succès", null, "Actualisation", 3000);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      showNotification("error", "Erreur lors de l'actualisation des données", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchShifts, showNotification]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // ========== DELETE ORDER ==========
  const openDeleteOrderModal = (order, event) => {
    if (event) {
      event.stopPropagation();
    }
    setOrderToDelete(order);
    setShowDeleteOrderModal(true);
  };

  const closeDeleteOrderModal = () => {
    setOrderToDelete(null);
    setShowDeleteOrderModal(false);
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;

    setDeletingOrder(true);
    try {
      await AxiosClient.delete(`/orders/${orderToDelete.id}`);
      showNotification("success", "Commande supprimée avec succès");
      
      // Mettre à jour l'état local du shift sélectionné
      if (selectedShift) {
        const updatedOrders = selectedShift.orders.filter(order => order.id !== orderToDelete.id);
        const newVentes = updatedOrders.reduce((sum, order) => sum + parseFloat(order.totalOrder || 0), 0);
        
        setSelectedShift({
          ...selectedShift,
          orders: updatedOrders,
          ventes: newVentes,
          net: newVentes - parseFloat(selectedShift.charges || 0)
        });
        
        // Mettre à jour la liste des shifts
        setShifts(prevShifts => 
          prevShifts.map(shift => {
            if (shift.id === selectedShift.id) {
              return {
                ...shift,
                orders: updatedOrders,
                ventes: newVentes,
                net: newVentes - parseFloat(shift.charges || 0)
              };
            }
            return shift;
          })
        );
      }
    } catch (error) {
      console.error("Erreur suppression commande:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la suppression de la commande";
      showNotification("error", errorMsg, error);
    } finally {
      setDeletingOrder(false);
      closeDeleteOrderModal();
    }
  };

  // ========== DELETE CHARGE ==========
  const openDeleteChargeModal = (charge, event) => {
    if (event) {
      event.stopPropagation();
    }
    setChargeToDelete(charge);
    setShowDeleteChargeModal(true);
  };

  const closeDeleteChargeModal = () => {
    setChargeToDelete(null);
    setShowDeleteChargeModal(false);
  };

  const deleteCharge = async () => {
    if (!chargeToDelete) return;

    setDeletingCharge(true);
    try {
      await AxiosClient.delete(`/charges/${chargeToDelete.id}`);
      showNotification("success", "Charge supprimée avec succès");
      
      // Mettre à jour l'état local du shift sélectionné
      if (selectedShift) {
        const updatedCharges = selectedShift.charges_details.filter(charge => charge.id !== chargeToDelete.id);
        const newCharges = updatedCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
        
        setSelectedShift({
          ...selectedShift,
          charges_details: updatedCharges,
          charges: newCharges,
          net: parseFloat(selectedShift.ventes || 0) - newCharges
        });
        
        // Mettre à jour la liste des shifts
        setShifts(prevShifts => 
          prevShifts.map(shift => {
            if (shift.id === selectedShift.id) {
              return {
                ...shift,
                charges_details: updatedCharges,
                charges: newCharges,
                net: parseFloat(shift.ventes || 0) - newCharges
              };
            }
            return shift;
          })
        );
      }
    } catch (error) {
      console.error("Erreur suppression charge:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la suppression de la charge";
      showNotification("error", errorMsg, error);
    } finally {
      setDeletingCharge(false);
      closeDeleteChargeModal();
    }
  };

  // ========== OPEN ORDERS MODAL ==========
  const openOrdersModal = (shift, event) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedShift(shift);
    setActiveTab('orders');
    setShowOrdersModal(true);
  };

  const closeOrdersModal = () => {
    setShowOrdersModal(false);
    setSelectedShift(null);
    setActiveTab('orders');
  };

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

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return "N/A";
    return duration;
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2) + " DH";
  };

  const calculateNet = (ventes, charges) => {
    return parseFloat(ventes || 0) - parseFloat(charges || 0);
  };

  const getUserName = (shift) => {
    return shift.user ? `${shift.user.prenom} ${shift.user.nom}` : `Utilisateur ${shift.user_id}`;
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'espèce':
        return '💰';
      case 'carte':
        return '💳';
      case 'mobile':
        return '📱';
      default:
        return '💵';
    }
  };

  const getPaymentMethodLabel = (method) => {
    return method || 'espèce';
  };

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      'payée': { bg: 'bg-green-100', text: 'text-green-800', label: 'Payée' },
      'en_attente': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      'annulée': { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' },
      'terminée': { bg: 'bg-green-100', text: 'text-green-800', label: 'Terminée' }
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getChargeCategoryBadge = (category) => {
    const categoryConfig = {
      'stock': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Stock' },
      'salary': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Salaire' },
      'rent': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Loyer' },
      'electricity': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Électricité' },
      'water': { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Eau' },
      'other': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Autre' }
    };
    
    const config = categoryConfig[category] || { bg: 'bg-gray-100', text: 'text-gray-800', label: category };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // ========== DELETE OPERATIONS ==========
  const openDeleteModal = (shift, event) => {
    if (event) {
      event.stopPropagation();
    }
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
  const printShift = async (shift, event) => {
    if (event) {
      event.stopPropagation();
    }
    
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

  // ========== DELETE ORDER CONFIRMATION MODAL ==========
  const DeleteOrderModal = () => {
    if (!showDeleteOrderModal || !orderToDelete) return null;

    return (
      <div 
        className="fixed inset-0 z-[60] overflow-y-auto"
        onClick={closeDeleteOrderModal}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                Confirmer la suppression
              </h3>
              
              <p className="text-sm text-center text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer la commande #{orderToDelete.id} d'un montant de {formatCurrency(orderToDelete.totalOrder)} ?
              </p>
              
              <p className="text-xs text-center text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                Cette action est irréversible et le montant sera déduit du total des ventes du shift.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={closeDeleteOrderModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={deletingOrder}
                >
                  Annuler
                </button>
                <button
                  onClick={deleteOrder}
                  disabled={deletingOrder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingOrder ? (
                    <>
                      <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== DELETE CHARGE CONFIRMATION MODAL ==========
  const DeleteChargeModal = () => {
    if (!showDeleteChargeModal || !chargeToDelete) return null;

    return (
      <div 
        className="fixed inset-0 z-[60] overflow-y-auto"
        onClick={closeDeleteChargeModal}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                Confirmer la suppression
              </h3>
              
              <p className="text-sm text-center text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer la charge "{chargeToDelete.description || 'Sans description'}" d'un montant de {formatCurrency(chargeToDelete.amount)} ?
              </p>
              
              <p className="text-xs text-center text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                Cette action est irréversible et le montant sera ajouté au net du shift.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={closeDeleteChargeModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={deletingCharge}
                >
                  Annuler
                </button>
                <button
                  onClick={deleteCharge}
                  disabled={deletingCharge}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingCharge ? (
                    <>
                      <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== ORDERS & CHARGES MODAL ==========
  const OrdersModal = () => {
    if (!showOrdersModal || !selectedShift) return null;

    const orders = selectedShift.orders || [];
    const charges = selectedShift.charges_details || [];
    const totalOrders = orders.reduce((sum, order) => sum + parseFloat(order.totalOrder || 0), 0);
    const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
    const ordersCount = orders.length;
    const chargesCount = charges.length;
    const isActive = selectedShift.ended_at === null;
    const net = calculateNet(selectedShift.ventes, selectedShift.charges);

    return (
      <div 
        className="fixed inset-0 z-50 overflow-y-auto"
        onClick={closeOrdersModal}
      >
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        
        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiPackage className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Détails du shift
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getUserName(selectedShift)} • {formatDateTime(selectedShift.started_at)}
                    {selectedShift.ended_at && ` → ${formatDateTime(selectedShift.ended_at)}`}
                    {isActive && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                        Shift actif
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={closeOrdersModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Onglets */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'orders'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiPackage className="w-4 h-4" />
                  <span>Commandes</span>
                  <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {ordersCount}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('charges')}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === 'charges'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FiTrendingDown className="w-4 h-4" />
                  <span>Charges</span>
                  <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {chargesCount}
                  </span>
                </div>
              </button>
            </div>

            {/* Body - avec hauteur limitée et scroll */}
            <div className="p-4 max-h-[55vh] overflow-y-auto">
              {/* Résumé des totaux */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-green-600 font-medium">Total Ventes</div>
                  <div className="text-sm font-bold text-green-700">{formatCurrency(totalOrders)}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-red-600 font-medium">Total Charges</div>
                  <div className="text-sm font-bold text-red-700">{formatCurrency(totalCharges)}</div>
                </div>
                <div className={`rounded-lg p-2 text-center ${net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-xs font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>Net</div>
                  <div className={`text-sm font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(net)}
                  </div>
                </div>
              </div>

              {/* Onglet Commandes */}
              {activeTab === 'orders' && (
                <>
                  {ordersCount === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiPackage className="w-6 h-6 text-gray-400" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Aucune commande</h4>
                      <p className="text-xs text-gray-500">Ce shift n'a pas de commandes associées</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-200 transition-colors"
                        >
                          {/* En-tête de la commande */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-500">
                                #{order.id}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {formatTime(order.created_at)}
                              </span>
                              {getOrderStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs flex items-center text-gray-600">
                                <FiCreditCard className="w-3 h-3 mr-1" />
                                {getPaymentMethodLabel(order.payment_method)}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(order.totalOrder)}
                              </span>
                              {/* Bouton de suppression - visible seulement si le shift est actif */}
                              {isActive && (
                                <button
                                  onClick={(e) => openDeleteOrderModal(order, e)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer la commande"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Articles de la commande */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs font-medium text-gray-500 mb-1">Articles :</p>
                              <div className="space-y-1">
                                {order.order_items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-gray-600">
                                      <span className="font-medium text-gray-800">{item.quantity}x</span> {item.product_name}
                                    </span>
                                    <span className="text-gray-800 font-medium">
                                      {formatCurrency(item.total_row)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Onglet Charges */}
              {activeTab === 'charges' && (
                <>
                  {chargesCount === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiTrendingDown className="w-6 h-6 text-gray-400" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Aucune charge</h4>
                      <p className="text-xs text-gray-500">Ce shift n'a pas de charges associées</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {charges.map((charge) => (
                        <div 
                          key={charge.id} 
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:border-red-200 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-1.5 bg-red-50 rounded-lg">
                                <FaMoneyBillWave className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium text-gray-500">
                                    #{charge.id}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(charge.created_at)}
                                  </span>
                                  {getChargeCategoryBadge(charge.category)}
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  {charge.description || 'Sans description'}
                                </p>
                                {charge.note && (
                                  <p className="text-xs text-gray-500 mt-1">{charge.note}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-red-600">
                                {formatCurrency(charge.amount)}
                              </span>
                              {/* Bouton de suppression - visible seulement si le shift est actif */}
                              {isActive && (
                                <button
                                  onClick={(e) => openDeleteChargeModal(charge, e)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer la charge"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-500">
                {activeTab === 'orders' ? (
                  <>Total: {ordersCount} commande{ordersCount > 1 ? 's' : ''}</>
                ) : (
                  <>Total: {chargesCount} charge{chargesCount > 1 ? 's' : ''}</>
                )}
                {isActive && (
                  <span className="ml-2 text-yellow-600">
                    • Les éléments peuvent être supprimés
                  </span>
                )}
              </div>
              <button
                onClick={closeOrdersModal}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
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
        
        {/* Modal de confirmation de suppression de shift */}
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
        
        {/* Modal de confirmation de suppression de commande */}
        <DeleteOrderModal />
        
        {/* Modal de confirmation de suppression de charge */}
        <DeleteChargeModal />
        
        {/* Modal des commandes et charges */}
        <OrdersModal />
        
        {/* Notification réutilisable */}
        <NotificationModal
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={closeNotification}
        />

        {/* Header avec bouton de rafraîchissement */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-gray-600 text-xs sm:text-sm">Consultez l'historique des plages horaires de travail</p>
            </div>
            
            {/* Bouton de rafraîchissement et statistiques */}
            <div className="flex items-center justify-center space-x-3">
              {/* Bouton de rafraîchissement pour desktop */}
              <button
                onClick={refreshShifts}
                disabled={refreshing || loading}
                className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  refreshing || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 active:scale-95'
                }`}
                title="Actualiser la liste"
              >
                {refreshing || loading ? (
                  <>
                    <FaSpinner className="animate-spin w-3.5 h-3.5 mr-1.5" />
                    <span>Actualisation...</span>
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    <span>Actualiser</span>
                  </>
                )}
              </button>
              
              {/* Statistiques existantes */}
              <div className="text-gray-600 text-xs">
                <span className="font-semibold text-gray-900">{shifts.length}</span> shifts
              </div>
              <div className="text-gray-600 text-xs">
                <span className="font-semibold text-gray-900">
                  {shifts.filter(s => s.ended_at === null).length}
                </span> actifs
              </div>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[80vh] overflow-y-auto">
            {/* Version Desktop */}
            <table className="w-full table-fixed hidden sm:table">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Utilisateur
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Statut
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Début
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Fin
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Ventes / Charges
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Net
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20" colSpan="3">
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
                        className="hover:bg-gray-50 transition duration-150 cursor-pointer"
                        onClick={(e) => openOrdersModal(shift, e)}
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
                              onClick={(e) => printShift(shift, e)}
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
                        {/* Bouton de suppression du shift */}
                        <td className="px-1 py-2 whitespace-nowrap text-right text-xs font-medium">
                          {!isActive ? (
                            <button
                              onClick={(e) => openDeleteModal(shift, e)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition duration-150 flex items-center"
                              title="Supprimer le shift"
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

            {/* Version Mobile */}
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
                        className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-md transition duration-150 cursor-pointer"
                        onClick={(e) => openOrdersModal(shift, e)}
                      >
                        {/* En-tête avec bouton de rafraîchissement mobile */}
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
                          <div className="flex items-center space-x-2">
                            {renderStatusBadge(shift.ended_at)}
                            {/* Bouton de rafraîchissement pour mobile dans l'en-tête */}
                            {shift === shifts[0] && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  refreshShifts();
                                }}
                                disabled={refreshing || loading}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${
                                  refreshing || loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                                title="Actualiser la liste"
                              >
                                {refreshing || loading ? (
                                  <FaSpinner className="animate-spin w-3.5 h-3.5" />
                                ) : (
                                  <FiRefreshCw className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
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
                              onClick={(e) => printShift(shift, e)}
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
                          
                          {/* Bouton de suppression du shift */}
                          <button
                            onClick={(e) => openDeleteModal(shift, e)}
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
      
      {/* Bouton flottant de rafraîchissement pour mobile */}
      <button
        onClick={refreshShifts}
        disabled={refreshing || loading}
        className="sm:hidden fixed bottom-4 right-4 z-10 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Actualiser"
      >
        {refreshing || loading ? (
          <FaSpinner className="animate-spin w-5 h-5" />
        ) : (
          <FiRefreshCw className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
export default Shifts;