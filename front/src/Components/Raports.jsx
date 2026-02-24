import React, { useEffect, useState, useCallback } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import NotificationModal from "../Modals/NotificationModal";
import { 
  FiCalendar, 
  FiFilter, 
  FiPrinter, 
  FiUser, 
  FiTrendingUp, 
  FiTrendingDown,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw
} from "react-icons/fi";
import { FaSpinner, FaPrint } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";

function Raports() {
  // ========== STATE ==========
  const [shifts, setShifts] = useState([]);
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    user_id: "",
    order_by: "started_at",
    order_dir: "desc"
  });
  
  // États pour les dates (pour DatePicker)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
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

  // ========== CHARGEMENT DE TOUS LES SHIFTS ==========
  const fetchAllShifts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AxiosClient.get("/shifts");
      const shiftsData = Array.isArray(data.data) ? data.data : data;
      
      // Trier par date de début décroissante (plus récent d'abord)
      const sortedShifts = [...shiftsData].sort((a, b) => {
        const dateA = new Date(a.started_at);
        const dateB = new Date(b.started_at);
        return dateB - dateA;
      });
      
      setShifts(sortedShifts);
      setFilteredShifts(sortedShifts); // Initialiser les filtres avec tous les shifts
    } catch (error) {
      console.error("Erreur chargement shifts:", error);
      showNotification("error", "Erreur lors du chargement des rapports", error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Charger les utilisateurs pour le filtre
  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await AxiosClient.get("/users");
      // Filtrer pour n'avoir que les utilisateurs qui ont des shifts
      const usersWithShifts = data.data?.filter(user => 
        shifts.some(shift => shift.user_id === user.id)
      ) || [];
      setUsers(usersWithShifts);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  }, [shifts]);

  useEffect(() => {
    fetchAllShifts();
  }, [fetchAllShifts]);

  useEffect(() => {
    if (shifts.length > 0) {
      fetchUsers();
    }
  }, [shifts, fetchUsers]);

  // ========== GESTION DES FILTRES ==========
  const applyFilters = useCallback(() => {
    let filtered = [...shifts];
    
    // Filtre par date de début
    if (filters.start_date) {
      const startDateObj = new Date(filters.start_date);
      startDateObj.setHours(0, 0, 0, 0);
      filtered = filtered.filter(shift => {
        const shiftDate = new Date(shift.started_at);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate >= startDateObj;
      });
    }
    
    // Filtre par date de fin
    if (filters.end_date) {
      const endDateObj = new Date(filters.end_date);
      endDateObj.setHours(23, 59, 59, 999);
      filtered = filtered.filter(shift => {
        const shiftDate = new Date(shift.started_at);
        return shiftDate <= endDateObj;
      });
    }
    
    // Filtre par utilisateur
    if (filters.user_id) {
      filtered = filtered.filter(shift => shift.user_id === parseInt(filters.user_id));
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aValue = a[filters.order_by];
      let bValue = b[filters.order_by];
      
      if (filters.order_by === 'started_at' || filters.order_by === 'ended_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      
      if (filters.order_dir === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredShifts(filtered);
  }, [shifts, filters]);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [filters, applyFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setFilters(prev => ({ 
      ...prev, 
      start_date: date ? date.toISOString().split('T')[0] : "" 
    }));
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setFilters(prev => ({ 
      ...prev, 
      end_date: date ? date.toISOString().split('T')[0] : "" 
    }));
  };

  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      order_by: column,
      order_dir: prev.order_by === column && prev.order_dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      user_id: "",
      order_by: "started_at",
      order_dir: "desc"
    });
    setStartDate(null);
    setEndDate(null);
    setFilteredShifts(shifts); // Revenir à tous les shifts
  };

  // ========== IMPRESSION ==========
  const printPeriodReport = async () => {
    if (!filters.start_date || !filters.end_date) {
      showNotification("warning", "Veuillez sélectionner une période");
      return;
    }

    setPrinting(true);
    try {
      await AxiosClient.post("/shifts/print-period", filters);
      showNotification("success", "Rapport de période imprimé avec succès");
    } catch (error) {
      console.error("Erreur impression rapport:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'impression";
      showNotification("error", errorMsg, error);
    } finally {
      setPrinting(false);
    }
  };

  // ========== FORMATAGE ==========
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

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2) + " DH";
  };

  const getUserName = (shift) => {
    return shift.user ? `${shift.user.prenom} ${shift.user.nom}` : `Utilisateur ${shift.user_id}`;
  };

  const getSortIcon = (column) => {
    if (filters.order_by !== column) return null;
    return filters.order_dir === 'asc' ? 
      <FiArrowUp className="w-4 h-4 ml-1" /> : 
      <FiArrowDown className="w-4 h-4 ml-1" />;
  };

  const calculateNet = (ventes, charges) => {
    return parseFloat(ventes || 0) - parseFloat(charges || 0);
  };

  const getTotals = () => {
    const totalVentes = filteredShifts.reduce((sum, s) => sum + parseFloat(s.ventes || 0), 0);
    const totalCharges = filteredShifts.reduce((sum, s) => sum + parseFloat(s.charges || 0), 0);
    const totalNet = totalVentes - totalCharges;
    
    return { totalVentes, totalCharges, totalNet };
  };

  const totals = getTotals();

  return (
    <div className="min-h-screen bg-blue-100 pt-2 px-1 sm:px-4 md:px-4 pb-3 sm:pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto">
        
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

        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Rapports</h1>
              <p className="text-gray-600">
                {filteredShifts.length} shift{filteredShifts.length > 1 ? 's' : ''} affiché{filteredShifts.length > 1 ? 's' : ''}
                {filteredShifts.length !== shifts.length && ` (${shifts.length} au total)`}
              </p>
            </div>
            <button
              onClick={fetchAllShifts}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-150"
              title="Rafraîchir"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex items-center mb-4">
            <FiFilter className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            {(filters.start_date || filters.end_date || filters.user_id) && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Filtres actifs
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date de début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  locale={fr}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Sélectionner une date"
                  isClearable
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  locale={fr}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Sélectionner une date"
                  isClearable
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sélection utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serveur
              </label>
              <select
                name="user_id"
                value={filters.user_id}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les serveurs</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end space-x-2">
              <button
                onClick={resetFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-150"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Résumé et bouton impression */}
        {filteredShifts.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Résumé</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Shifts</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredShifts.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total ventes</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalVentes)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total charges</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalCharges)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net</p>
                    <p className={`text-2xl font-bold ${totals.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totals.totalNet)}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={printPeriodReport}
                disabled={printing || !filters.start_date || !filters.end_date}
                className={`px-6 py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                  printing || !filters.start_date || !filters.end_date
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={!filters.start_date || !filters.end_date ? "Sélectionnez une période" : ""}
              >
                {printing ? (
                  <FaSpinner className="animate-spin w-5 h-5 mr-2" />
                ) : (
                  <FiPrinter className="w-5 h-5 mr-2" />
                )}
                {printing ? 'Impression...' : 'Imprimer la période'}
              </button>
            </div>
          </div>
        )}

        {/* Tableau des shifts */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('started_at')}
                  >
                    <div className="flex items-center">
                      Début
                      {getSortIcon('started_at')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ended_at')}
                  >
                    <div className="flex items-center">
                      Fin
                      {getSortIcon('ended_at')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('user_id')}
                  >
                    <div className="flex items-center">
                      Serveur
                      {getSortIcon('user_id')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charges
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaSpinner className="animate-spin h-10 w-10 text-blue-600 mb-4" />
                        <p className="text-gray-600">Chargement des rapports...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                          <FiCalendar className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun shift trouvé</h3>
                        <p className="text-gray-500">Ajustez vos filtres pour voir les résultats</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => {
                    const net = calculateNet(shift.ventes, shift.charges);
                    
                    return (
                      <tr key={shift.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(shift.started_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {shift.ended_at ? formatDateTime(shift.ended_at) : 
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              En cours
                            </span>
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FiUser className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {getUserName(shift)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {shift.duration || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <FiTrendingUp className="w-4 h-4 text-green-500 mr-2" />
                            {formatCurrency(shift.ventes)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <FiTrendingDown className="w-4 h-4 text-red-500 mr-2" />
                            {formatCurrency(shift.charges)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            net >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {net >= 0 ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
                            {formatCurrency(net)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              
              {/* Pied de tableau avec totaux */}
              {filteredShifts.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-sm font-semibold text-gray-900">
                      Totaux ({filteredShifts.length} shift{filteredShifts.length > 1 ? 's' : ''})
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(totals.totalVentes)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      {formatCurrency(totals.totalCharges)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <span className={totals.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(totals.totalNet)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Raports;