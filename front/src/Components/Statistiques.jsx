import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import NotificationModal from "../Modals/NotificationModal";
import { 
  FiDollarSign, 
  FiShoppingBag,
  FiCalendar,
  FiUser,
  FiPackage
} from "react-icons/fi";
import { 
  FaSpinner,
  FaReceipt
} from "react-icons/fa";
import { FaTriangleExclamation } from "react-icons/fa6";

function Statistiques() {
  const { shiftActive } = useOutletContext();
  
  const [commandes, setCommandes] = useState([]);
  const [shiftStats, setShiftStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setFetching] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  const {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  } = useErrorHandler();

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

  const fetchCurrentShiftStats = useCallback(async () => {
    if (!shiftActive) {
      setShiftStats(null);
      setCommandes([]);
      setLoading(false);
      return;
    }
    
    setFetching(true);
    try {
      const response = await AxiosClient.get("/shifts/currentStats");
      setShiftStats(response.data);
      setCommandes(response.data.commandes || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setShiftStats(null);
        setCommandes([]);
      } else {
        console.error("Erreur fetch shift stats:", error);
        showNotification("error", "Erreur lors du chargement des commandes", error);
      }
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, [shiftActive, showNotification]);

  useEffect(() => {
    setLoading(true);
    fetchCurrentShiftStats();
  }, [fetchCurrentShiftStats]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2) + ' DH';
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'espèce':
        return <FiDollarSign className="w-4 h-4" />;
      case 'carte':
        return <FaReceipt className="w-4 h-4" />;
      default:
        return <FiShoppingBag className="w-4 h-4" />;
    }
  };

  const printShiftReport = () => {
    try {
      // Appeler l'API pour générer le rapport de shift
      AxiosClient.post(`/shifts/${shiftStats.shift_id}/print`)
        .then(response => {
          showNotification("success", "Rapport de shift généré avec succès");
        })
        .catch(error => {
          showNotification("error", "Erreur lors de la génération du rapport de shift", error);
        });
    } catch (error) {
      showNotification("error", "Erreur lors de la génération du rapport de shift", error);
    }
  };

  const totalCharges = shiftStats?.charges_details?.reduce(
    (sum, charge) => sum + parseFloat(charge.amount || 0),
    0
  ) || 0;

  const getPaymentMethodText = (method) => {
    switch(method) {
      case 'espèce':
        return 'Espèces';
      case 'carte':
        return 'Carte bancaire';
      default:
        return method;
    }
  };

  // Calculer les totaux
  const totalVentes = commandes.reduce((sum, cmd) => sum + parseFloat(cmd.totalOrder || 0), 0);
  const nombreCommandes = commandes.length;

  return (
    <div className="min-h-screen bg-blue-100 pt-2 px-1 sm:px-4 md:px-4 pb-3 sm:pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto">
        
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

        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-2 mb-2 sm:mb-3 inline-block">
          <p className="text-gray-600 text-sm sm:text-base">
            Vous trouvez ici les statistiques détaillées du shift en cours.
          </p>
        </div>

        {/* Conteneur principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm">
          <div className="max-h-[75vh] overflow-y-auto rounded-2xl">
            {!shiftActive && !loading ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl flex items-center justify-center">
                    <FaTriangleExclamation className="w-10 h-10 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Shift non démarré</h3>
                <p className="text-gray-500 mb-6">
                  Démarrez un shift pour voir les commandes.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl">
                {/* Version Desktop */}
                <table className="w-full hidden sm:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commande
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Articles
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type de paiement
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
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
                            <p className="text-gray-600">Chargement des commandes...</p>
                          </div>
                        </td>
                      </tr>
                    ) : commandes.length === 0 ? (
                      // Message quand il n'y a pas de commandes
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
                              <FiShoppingBag className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande pour ce shift</h3>
                            <p className="text-gray-500">Les commandes apparaîtront ici lorsqu'elles seront créées.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Afficher les commandes
                      commandes.map((commande, index) => (
                        <tr key={index + 1} className="hover:bg-gray-50 transition duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <FiShoppingBag className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {index + 1}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {commande.order_items?.map((item, itemIndex) => (
                                <div key={item.id || itemIndex} className="flex items-center">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                                  <span className="text-sm text-gray-700">
                                    {item.quantity}x {item.product_name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {formatAmount(item.unit_price)}/u
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-green-600">
                              {formatAmount(commande.totalOrder)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <div className="p-1 bg-gray-100 rounded mr-2">
                                  {getPaymentMethodIcon(commande.payment_method)}
                                </div>
                                {getPaymentMethodText(commande.payment_method)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">
                                {formatDate(commande.created_at)}
                              </span>
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
                      <p className="text-gray-600">Chargement des commandes...</p>
                    </div>
                  ) : commandes.length === 0 ? (
                    // Message quand il n'y a pas de commandes (mobile)
                    <div className="text-center py-16 px-4">
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center">
                          <FiShoppingBag className="w-10 h-10 text-blue-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande pour ce shift</h3>
                      <p className="text-gray-500">Les commandes apparaîtront ici lorsqu'elles seront créées.</p>
                    </div>
                  ) : (
                    // Afficher les commandes (mobile)
                    <div className="space-y-4 p-4">
                      {commandes.map((commande, index) => (
                        <div key={index + 1} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-150">
                          {/* En-tête de la commande */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <FiShoppingBag className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {index + 1}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(commande.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {formatAmount(commande.totalOrder)}
                            </div>
                          </div>

                          {/* Statut et paiement */}
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <div className="p-1 bg-gray-100 rounded mr-2">
                                {getPaymentMethodIcon(commande.payment_method)}
                              </div>
                              {getPaymentMethodText(commande.payment_method)}
                            </div>
                          </div>

                          {/* Liste des articles */}
                          <div className="mb-4">
                            <div className="text-xs font-medium text-gray-500 mb-2">ARTICLES</div>
                            <div className="space-y-2">
                              {commande.order_items?.map((item, itemIndex) => (
                                <div key={item.id || itemIndex} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                  <div className="flex items-center">
                                    <FiPackage className="w-3 h-3 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-700">
                                      {item.quantity}x {item.product_name}
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatAmount(item.total_row)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Utilisateur */}
                          {shiftStats?.user && (
                            <div className="flex items-center text-xs text-gray-500 border-t pt-3">
                              <FiUser className="w-3 h-3 mr-1" />
                              <span>
                                Par {shiftStats.user.prenom} {shiftStats.user.nom}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résumé total sur une seule ligne */}
        {!loading && commandes.length > 0 && (
          <div className="mt-2 w-full bg-white rounded-2xl px-6 py-2 shadow-sm flex justify-between items-center">
            <div className="text-center">
              <p className="text-sm text-gray-500">Nombre de commandes</p>
              <p className="text-xl font-bold text-gray-900">{nombreCommandes}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total des ventes</p>
              <p className="text-xl font-bold text-green-600">{formatAmount(totalVentes)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total des charges</p>
              <p className="text-xl font-bold text-red-600">{formatAmount(totalCharges)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Net</p>
              <p className="text-xl font-bold text-blue-600">{formatAmount(totalVentes - totalCharges)}</p>
            </div>
            <div className="text-center">
              <button onClick={printShiftReport} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-150">
                Imprimer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Statistiques;