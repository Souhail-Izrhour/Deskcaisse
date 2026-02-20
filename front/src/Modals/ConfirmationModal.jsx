// Modals/ConfirmationModal.jsx
import React from "react";
import { FiX, FiUser, FiPackage, FiGrid, FiTrash2, FiTruck } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";
import { HiOutlineExclamationCircle } from "react-icons/hi";

// Mapping des icônes par type d'élément
const ITEM_ICONS = {
  user: FiUser,
  product: FiPackage,
  category: FiGrid,
  fournisseur: FiTruck,
  default: FiTrash2
};

// Mapping des couleurs par type d'élément
const ITEM_COLORS = {
  user: "indigo",
  product: "blue",
  category: "green",
  fournisseur: "orange",
  default: "gray"
};

function ConfirmationModal({
  show,
  title = "Confirmer la suppression",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
  item = null,
  itemType = "user", // 'user', 'product', 'category', etc.
  warningText = "Cette action est irréversible.",
  showWarning = true,

}) {
  if (!show) return null;

  // Déterminer l'icône et la couleur en fonction du type
  const IconComponent = ITEM_ICONS[itemType] || ITEM_ICONS.default;
  const color = ITEM_COLORS[itemType] || ITEM_COLORS.default;
  
  // Classes CSS dynamiques pour les couleurs
  const iconBgClass = `bg-${color}-100`;
  const iconTextClass = `text-${color}-600`;
  const itemBgClass = `bg-${color}-50`;
  
  // Rendu conditionnel des détails de l'item
  const renderItemDetails = () => {
    if (!item) return null;
    
    let displayName = "";
    let subText = "";
    
    switch(itemType) {
      case 'user':
        displayName = item.prenom && item.nom ? `${item.prenom} ${item.nom}` : item.nom || item.email || "Utilisateur";
        subText = item.email || "";
        if (item.role) {
          subText += subText ? ` • ${item.role === 'admin' ? 'Administrateur' : 'Serveur'}` : item.role;
        }
        break;
        
      case 'product':
        displayName = item.nom || item.name || item.titre || "Produit";
        if (item.prix) subText = `${item.prix} €`;
        if (item.code) subText = subText ? `${item.code} • ${subText}` : item.code;
        break;
        
      case 'category':
        displayName = item.nom || item.name || "Catégorie";
        if (item.description) subText = item.description;
        break;

      case 'fournisseur':
        displayName = item.nom || item.name || "Fournisseur";
        if (item.contact) subText = item.contact;
        break;
        
      default:
        // Générique : on essaie de trouver un nom ou titre
        displayName = item.nom || item.name || item.titre || item.title || "Élément";
        if (item.description) subText = item.description;
        break;
    }
    
    return (
      <div className={`${itemBgClass} rounded-lg p-3 sm:p-4 mb-4 sm:mb-6`}>
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 h-12 w-12 ${iconBgClass} rounded-lg flex items-center justify-center`}>
            <IconComponent className={`w-6 h-6 ${iconTextClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            {displayName && (
              <div className="text-sm font-medium text-gray-900">
                {displayName}
              </div>
            )}
            {subText && (
              <div className="text-xs text-gray-400 mt-1">
                {subText}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-md mx-2 transform transition-all">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition duration-150 p-1 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
              <HiOutlineExclamationCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
          
          <p className="text-center text-gray-700 mb-2 text-sm sm:text-base">
            {message}
          </p>
          
          {renderItemDetails()}

          {showWarning && warningText && (
            <p className="text-center text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">
              {warningText}
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-150 disabled:opacity-50 order-2 sm:order-1`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2`}
            >
              {loading && (
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;

//j ai mis la couleur de text en black au lieu de white pour le bouton de confirmation juste au cas ou l affichage de la couleur rouge ne marcherait pas