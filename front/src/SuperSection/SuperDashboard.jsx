import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiUsers, FiPlusCircle, FiHome } from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";

export default function SuperDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header avec titre et bouton logout */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md">
                <FaBuilding className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Super Admin Dashboard
                </h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition duration-200 text-sm font-medium border border-red-200 hover:border-red-300 shadow-sm"
            >
              <FiLogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Section Actions principales */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
            Actions rapides
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Carte Ajouter un tenant */}
            <Link to="/super/Tenant" className="group">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                    <FiPlusCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      Gerer les tenants
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                     Ajouter, Reactiver ou désactiver les tenants  </p>
                    <div className="mt-3 text-xs text-blue-600 font-medium flex items-center">
                      Créer maintenant
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
  
            {/* Carte Voir tous les utilisateurs */}
            <Link to="/super/Allusers" className="group">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-200">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                      Voir tous les utilisateurs
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Gérer les utilisateurs de tous les tenants
                    </p>
                    <div className="mt-3 text-xs text-green-600 font-medium flex items-center">
                      Accéder à la liste
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Section Informations supplémentaires (optionnel) */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center">
            <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
            Informations système
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <FiHome className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600">Version</p>
                <p className="font-medium text-gray-900">1.0.0</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <FaBuilding className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600">Developper par La Startup → Hlasstech </p>
                <p className="font-medium text-gray-900"><a href="https://www.hlasstech.com" target="_blank" rel="noopener noreferrer">www.hlasstech.com</a></p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <FiUsers className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <p className="text-gray-600">Dernière connexion</p>
                <p className="font-medium text-gray-900">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (optionnel) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          © {new Date().getFullYear()} hlasstech. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}