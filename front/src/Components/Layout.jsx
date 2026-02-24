import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { FiShoppingCart, FiSettings, FiPlay, FiTrendingUp, FiStopCircle, FiUsers, FiClock, FiPackage, FiGrid, FiTruck, FiFileText, FiDollarSign, FiLogOut, FiX, FiMenu, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import AxiosClient from "../Services/AxiosClient";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";

function Layout() {
  const role = localStorage.getItem("user_role");
  const [activePath, setActivePath] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(true);
  
  // Nouveaux états pour les chargements
  const [isEndingShift, setIsEndingShift] = useState(false);
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // États pour les modaux
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

 const handleLogout = async () => {
  if (isLoggingOut) return; // Empêcher les clics multiples
  
  setIsLoggingOut(true);
  try {
    // Appel API pour la déconnexion côté serveur
    await AxiosClient.post("/logout");
    console.log("Déconnexion réussie côté serveur");
    showNotification("success", "Succès", "Déconnexion réussie");
  } catch (error) {
    console.error("Erreur lors de la déconnexion côté serveur:", error);
    showNotification(
      "error",
      "Erreur",
      "Erreur lors de la déconnexion, mais vous serez redirigé"
    );
  } finally {
    // Nettoyage du localStorage
    localStorage.clear();
    // Redirection vers la page de login
    navigate("/");
    setIsLoggingOut(false);
  }
};
  // Détecter si on est sur mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
        setShowMobileMenu(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const checkActiveShift = async () => {
      try {
        const response = await AxiosClient.get("/shifts/hasActiveShift");

        if (response.data.active) {
          setShiftActive(true);
        } else {
          setShiftActive(false);
        }
      } catch (error) {
        console.error("Erreur vérification shift actif :", error);
      } finally {
        setShiftLoading(false);
      }
    };

    checkActiveShift();
  }, []);

  const handleNavClick = (path) => {
    setActivePath(path);
    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setShowMobileMenu(!showMobileMenu);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Fonction pour afficher les notifications
  const showNotification = (type, title, message, duration = 5000) => {
    setNotification({
      show: true,
      type,
      title,
      message,
      duration
    });
  };

  // Fermeture de la notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const startShift = async () => {
    if (isStartingShift) return; // Empêcher les clics multiples
    
    setIsStartingShift(true);
    try {
      const response = await AxiosClient.post("/shifts/start");
      console.log("Shift démarré :", response.data);
      setShiftActive(true);
      showNotification("success", "Succès", "Shift démarré avec succès");
    } catch (error) {
      console.error("Erreur start shift :", error.response?.data || error.message);
      showNotification(
        "error",
        "Erreur",
        error.response?.data?.message || "Impossible de démarrer le shift"
      );
    } finally {
      setIsStartingShift(false);
    }
  };

  const endShift = async () => {
    if (isEndingShift) return; // Empêcher les clics multiples
    
    setIsEndingShift(true);
    try {
      const response = await AxiosClient.post("/shifts/end");
      console.log("Shift terminé :", response.data);
      showNotification("success", "Succès", "Shift terminé avec succès");
      setShiftActive(false);
      setShowEndShiftModal(false);
    } catch (error) {
      console.error("Erreur end shift :", error.response?.data || error.message);
      showNotification(
        "error",
        "Erreur",
        error.response?.data?.message || "Impossible de terminer le shift"
      );
    } finally {
      setIsEndingShift(false);
      setShowEndShiftModal(false);
    }
  };

  // Fonction pour ouvrir la confirmation de fin de shift
  const openEndShiftConfirmation = () => {
    setShowEndShiftModal(true);
  };

  const menuItems = [
    { path: "/pos", label: "Caisse", icon: <FiShoppingCart />, color: "text-blue-600", bgColor: "hover:bg-blue-50" },
    { path: "/pos/charges", label: "Charges", icon: <FiDollarSign />, color: "text-green-600", bgColor: "hover:bg-green-50" },
    { path: "/pos/statistiques", label: "Statistiques", icon: <FiTrendingUp />, color: "text-purple-600", bgColor: "hover:bg-purple-50" },
  ];

  const adminItems = [
    { path: "/pos/shifts", label: "Shifts", icon: <FiClock />, color: "text-amber-600", bgColor: "hover:bg-amber-50" },
    { path: "/pos/produits", label: "Produits", icon: <FiPackage />, color: "text-emerald-600", bgColor: "hover:bg-emerald-50" },
    { path: "/pos/categories", label: "Catégories", icon: <FiGrid />, color: "text-pink-600", bgColor: "hover:bg-pink-50" },
    { path: "/pos/fournisseurs", label: "Fournisseurs", icon: <FiTruck />, color: "text-orange-600", bgColor: "hover:bg-orange-50" },
    { path: "/pos/raports", label: "Rapports", icon: <FiFileText />, color: "text-red-600", bgColor: "hover:bg-red-50" },
    { path: "/pos/utilisateurs", label: "Utilisateurs", icon: <FiUsers />, color: "text-indigo-600", bgColor: "hover:bg-indigo-50" },
    { path: "/pos/settings", label: "Paramètres", icon: <FiSettings />, color: "text-gray-600", bgColor: "hover:bg-gray-50" },
  ];

  // Rendu pour la version desktop (sidebar masquée - icônes seulement)
  const renderCollapsedIcons = () => (
    <div className="fixed left-0 top-0 h-full w-16 bg-gradient-to-b from-white to-blue-200 border-r border-gray-200 z-40 flex flex-col rounded-r-3xl">
      {/* Bouton toggle */}
      <div className="p-3 border-b border-gray-200 flex justify-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
          title="Développer le menu"
        >
          <FiChevronRight size={15} className="text-gray-600" />
        </button>
      </div>

      {/* Navigation avec icônes seulement */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="mb-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                title={item.label}
              >
                <div className={item.color}>
                  {React.cloneElement(item.icon, { size: 20 })}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {role === "admin" && (
          <div className="mb-1">
            <div className="space-y-1">
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  title={item.label}
                >
                  <div className={item.color}>
                    {React.cloneElement(item.icon, { size: 16 })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer (collapsed) */}
      <div className="p-1 border-t border-gray-200">
        {/* Spinner de chargement */}
        {shiftLoading ? (
          <div className="w-full p-3 flex items-center justify-center mb-2">
            <FaSpinner className="animate-spin text-gray-400" size={20} />
          </div>
        ) : (
          <>
            {!shiftActive && (
              <button
                onClick={startShift}
                disabled={isStartingShift}
                className={`w-full p-3 rounded-xl hover:bg-gray-200 text-green-700 transition-all duration-200 flex items-center justify-center mb-2 ${
                  isStartingShift ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isStartingShift ? "Démarrage en cours..." : "Démarrer le shift"}
              >
                {isStartingShift ? (
                  <FaSpinner className="animate-spin" size={20} />
                ) : (
                  <FiPlay size={20} />
                )}
              </button>
            )}

            {shiftActive && (
              <button
                onClick={openEndShiftConfirmation}
                disabled={isEndingShift}
                className={`w-full p-3 rounded-xl hover:bg-gray-200 text-red-700 transition-all duration-200 flex items-center justify-center mb-2 ${
                  isEndingShift ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isEndingShift ? "Terminaison en cours..." : "Terminer le shift"}
              >
                {isEndingShift ? (
                  <FaSpinner className="animate-spin" size={20} />
                ) : (
                  <FiStopCircle size={20} />
                )}
              </button>
            )}
          </>
        )}
        {!shiftLoading && !shiftActive && (
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full p-3 rounded-xl hover:bg-gray-200 text-gray-700 transition-all duration-200 flex items-center justify-center"
            title="Déconnexion"
          >
            <FiLogOut size={20} />
          </button>
        )}
      </div>
    </div>
  );

  // Rendu pour la version desktop complète
  const renderDesktopSidebar = () => (
    <aside className={`flex flex-col h-screen bg-gradient-to-b from-white to-blue-200 border-r border-gray-200 transition-all duration-300 rounded-r-3xl ${isCollapsed ? 'w-16' : 'w-48'}`}>
      {/* Layout avec bouton toggle */}
      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-extralight text-cyan-900">HLassTech - POS</h1>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
          title={isCollapsed ? "Développer" : "Réduire"}
        >
          {isCollapsed ? (
            <FiChevronRight size={20} className="text-gray-600" />
          ) : (
            <FiChevronLeft size={18} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {!isCollapsed ? (
          <>
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Navigation
              </h3>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <div className={`${item.color}`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {activePath === item.path && (
                      <div className="ml-auto w-1 h-1 bg-blue-500 rounded-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {role === "admin" && (
              <div className="mb-0">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  Administration
                </h3>
                <div className="space-y-1">
                  {adminItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className={item.color}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {activePath === item.path && (
                        <div className="ml-auto w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                title={item.label}
              >
                <div className={item.color}>
                  {React.cloneElement(item.icon, { size: 22 })}
                </div>
              </Link>
            ))}

            {role === "admin" && (
              <div className="space-y-4 mt-6">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    title={item.label}
                  >
                    <div className={item.color}>
                      {React.cloneElement(item.icon, { size: 22 })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer avec bouton déconnexion */}
      <div className={`border-t border-gray-200 ${isCollapsed ? 'p-1' : 'p-2'}`}>
        {/* Spinner de chargement pour desktop */}
        {shiftLoading ? (
          <div className={`w-full ${isCollapsed ? 'p-3 justify-center' : 'py-2 px-2 justify-center gap-3'} flex items-center bg-gray-100 text-gray-400 rounded-xl font-medium group mb-2`}>
            {!isCollapsed ? (
              <>
                <FaSpinner className="animate-spin" size={18} />
                <span className="ml-2">Vérification...</span>
              </>
            ) : (
              <FaSpinner className="animate-spin" size={20} />
            )}
          </div>
        ) : (
          <>
            {!shiftActive && (
              <button 
                onClick={startShift} 
                disabled={isStartingShift}
                className={`w-full ${isCollapsed ? 'p-3 justify-center' : 'py-2 px-2 justify-center gap-3'} flex items-center bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-all duration-200 font-medium group mb-2 ${
                  isStartingShift ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isCollapsed ? (isStartingShift ? "Démarrage..." : "Démarrer le shift") : ""}
              >
                {isStartingShift ? (
                  <>
                    <FaSpinner className="animate-spin text-green-500" size={isCollapsed ? 20 : 18} />
                    {!isCollapsed && <span>Démarrage...</span>}
                  </>
                ) : (
                  <>
                    <FiPlay className="text-green-500 group-hover:text-green-600 transition-colors" size={isCollapsed ? 20 : 18} />
                    {!isCollapsed && (
                      <span className="group-hover:text-green-600 transition-colors">Démarrer le shift</span>
                    )}
                  </>
                )}
              </button>
            )}

            {shiftActive && (
              <button 
                onClick={openEndShiftConfirmation} 
                disabled={isEndingShift}
                className={`w-full ${isCollapsed ? 'p-3 justify-center' : 'py-2 px-2 justify-center gap-3'} flex items-center bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all duration-200 font-medium group mb-2 ${
                  isEndingShift ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isCollapsed ? (isEndingShift ? "Terminaison..." : "Terminer le shift") : ""}
              >
                {isEndingShift ? (
                  <>
                    <FaSpinner className="animate-spin text-red-500" size={isCollapsed ? 20 : 18} />
                    {!isCollapsed && <span>Terminaison...</span>}
                  </>
                ) : (
                  <>
                    <FiStopCircle className="text-red-500 group-hover:text-red-600 transition-colors" size={isCollapsed ? 20 : 18} />
                    {!isCollapsed && (
                      <span className="group-hover:text-red-600 transition-colors">Terminer le shift</span>
                    )}
                  </>
                )}
              </button>
            )}
          </>
        )}
        {!shiftLoading && !shiftActive && (
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full ${isCollapsed ? 'p-3 justify-center' : 'py-2 px-2 justify-center gap-3'} flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium group`}
            title={isCollapsed ? "Déconnexion" : ""}
          >
            <FiLogOut className="text-gray-500 group-hover:text-red-500 transition-colors" size={isCollapsed ? 20 : 18} />
            {!isCollapsed && (
              <span className="group-hover:text-red-600 transition-colors">Déconnexion</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );

  // Rendu pour la version mobile
  const renderMobileLayout = () => (
    <>
      {/* Barre du haut mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-40 flex items-center justify-between px-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
        >
          <FiMenu size={24} className="text-gray-600" />
        </button>

        {/* Titre/Logo */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-blue-800">HlassTech</h1>
        </div>

        {/* Bouton de déconnexion mobile */}
        {!shiftLoading && !shiftActive && (
          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            <FiLogOut size={20} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Overlay pour menu mobile */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside className={`md:hidden fixed left-0 top-0 h-full bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-xl z-40 transform transition-transform duration-300 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} w-72`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Menu</h1>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Navigation
            </h3>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <div className={`${item.color}`}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {activePath === item.path && (
                    <div className="ml-auto w-1 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {role === "admin" && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Administration
              </h3>
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${activePath === item.path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <div className={item.color}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {activePath === item.path && (
                      <div className="ml-auto w-1 h-1 bg-blue-500 rounded-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {/* Spinner de chargement pour mobile */}
          {shiftLoading ? (
            <div className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-100 text-gray-400 rounded-xl font-medium mb-2">
              <FaSpinner className="animate-spin" size={18} />
              <span>Vérification...</span>
            </div>
          ) : (
            <>
              {!shiftActive && (
                <button
                  onClick={startShift}
                  disabled={isStartingShift}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-all duration-200 font-medium mb-2 ${
                    isStartingShift ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isStartingShift ? (
                    <>
                      <FaSpinner className="animate-spin text-green-500" size={18} />
                      <span>Démarrage...</span>
                    </>
                  ) : (
                    <>
                      <FiPlay className="text-green-500" size={18} />
                      <span>Démarrer le shift</span>
                    </>
                  )}
                </button>
              )}

              {shiftActive && (
                <button
                  onClick={openEndShiftConfirmation}
                  disabled={isEndingShift}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all duration-200 font-medium mb-2 ${
                    isEndingShift ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isEndingShift ? (
                    <>
                      <FaSpinner className="animate-spin text-red-500" size={18} />
                      <span>Terminaison...</span>
                    </>
                  ) : (
                    <>
                      <FiStopCircle className="text-red-500" size={18} />
                      <span>Terminer le shift</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
          {!shiftLoading && !shiftActive && (
            <button
              onClick={() => {
                setShowLogoutModal(true);
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium"
            >
              <FiLogOut className="text-gray-500" size={18} />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );

  // Rendu principal
  return (
    <div className="flex h-screen bg-blue-100">
      {/* Sidebar selon le type d'appareil */}
      {isMobile ? (
        renderMobileLayout()
      ) : isCollapsed ? (
        renderCollapsedIcons()
      ) : (
        renderDesktopSidebar()
      )}

      {/* Contenu principal */}
      <div
        className={`flex-1 overflow-auto ${
          isMobile
            ? 'pt-16'
            : isCollapsed
              ? 'ml-14'
              : 'ml-0'
        }`}
      >
        <Outlet context={{ shiftActive, /*startShift*/ }} />
      </div>

      {/* Modal de confirmation de déconnexion */}
     <ConfirmationModal
      show={showLogoutModal}
      title="Déconnexion"
      message="Êtes-vous sûr de vouloir vous déconnecter ?"
      confirmText="Déconnexion"
      cancelText="Annuler"
      loading={isLoggingOut} // Ajoutez cette ligne
      onConfirm={() => {
        handleLogout();
        // Ne pas fermer le modal ici, il sera fermé après l'API
      }}
      onCancel={() => {
        if (!isLoggingOut) {
          setShowLogoutModal(false);
        }
      }}
      type="warning"
    />

      {/* Modal de confirmation pour arrêter le shift */}
      <ConfirmationModal
        show={showEndShiftModal}
        title="Terminer le Shift"
        message="Êtes-vous sûr de vouloir terminer ce shift ?"
        confirmText="Terminer le Shift"
        cancelText="Annuler"
        loading={isEndingShift} // Passer l'état de chargement au modal
        onConfirm={endShift}
        onCancel={() => {
          if (!isEndingShift) {
            setShowEndShiftModal(false);
          }
        }}
        type="info"
      />

      {/* Modal de notification */}
      <NotificationModal
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={notification.duration}
        onClose={closeNotification}
      />
    </div>
  );
}

export default Layout;