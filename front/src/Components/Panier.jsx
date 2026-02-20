import React from "react";
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaExclamationTriangle } from "react-icons/fa";
import { BsReceipt } from "react-icons/bs";

export default function Panier({ 
  panier, 
  onDiminuerQuantite, 
  onAjouterQuantite, 
  onSupprimer,
  onValiderCommande,
  validating,
  shiftActive,
  // startShift
}) {
  const total = panier.reduce((sum, p) => sum + parseFloat(p.price) * p.quantite, 0);

  // Hauteur pour 3 items (chaque item ~80px + margin)
  const maxHeight = 5 * 75; // px

  return (
    <div className="bg-white rounded-2xl shadow border flex flex-col" style={{ minHeight: "180px" }}>
      {/* En-tête du panier - inchangé */}
      <div className="p-4 border-b bg-blue-50 rounded-t-2xl">
        <div className="flex items-center">
          <FaShoppingCart className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-bold text-gray-800">Panier</h3>
          <span className="ml-auto text-sm text-gray-600">{panier.length} article(s)</span>
        </div>
                
        {/* Message d'alerte si pas de shift actif
        {!shiftActive && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <FaExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Shift non démarré</p>
                <p className="text-xs text-red-600 mt-1">
                  Vous devez démarrer un shift avant de valider une commande.
                </p>
                <button
                  onClick={startShift}
                  className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium px-3 py-1 rounded transition duration-200"
                >
                  Démarrer le shift
                </button>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Liste des articles */}
      <div
        className={`flex-1 p-4 ${validating ? 'opacity-50' : ''}`}
        style={{
          maxHeight: panier.length > 3 ? `${maxHeight}px` : "auto",
          overflowY: panier.length > 3 ? "auto" : "visible"
        }}
      >
        {panier.length === 0 ? (
          <div className="text-center py-8">
            <FaShoppingCart className="w-10 h-10 text-blue-100 mx-auto mb-3" />
            <p className="text-gray-500">Panier vide</p>
          </div>
        ) : (
          panier.map(item => (
            <div key={item.id} className="mb-3 bg-gray-50 rounded p-3 border">
              <div className="flex items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-600">
                    {parseFloat(item.price).toFixed(2)} DH × {item.quantite}
                  </p>
                </div>
                <span className="font-bold text-blue-600">
                  {(parseFloat(item.price) * item.quantite).toFixed(2)} DH
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onDiminuerQuantite(item.id)}
                    disabled={validating}
                    className={`w-7 h-7 flex items-center justify-center rounded ${
                      validating 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <FaMinus className="w-3 h-3" />
                  </button>
                  
                  <span className="w-7 text-center font-medium">{item.quantite}</span>
                  
                  <button
                    onClick={() => onAjouterQuantite(item)}
                    disabled={validating}
                    className={`w-7 h-7 flex items-center justify-center rounded ${
                      validating 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    <FaPlus className="w-3 h-3" />
                  </button>
                </div>
                
                <button
                  onClick={() => onSupprimer(item.id)}
                  disabled={validating}
                  className={`p-1 ${
                    validating 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-500 hover:text-red-700'
                  }`}
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>        

      {/* Total et validation */}
      {panier.length > 0 && (
        <div className="p-4 border-t bg-white rounded-2xl">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-lg text-blue-600">{total.toFixed(2)} DH</span>
            </div>
            
            <button
              onClick={onValiderCommande}
              disabled={validating || !shiftActive}
              className={`
                w-full 
                ${!shiftActive ? 'bg-gray-300 cursor-not-allowed' : 
                  validating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                text-white font-medium py-3 rounded flex items-center justify-center transition
                ${(validating || !shiftActive) ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Validation en cours...
                </>
              ) : !shiftActive ? (
                <>
                  <FaExclamationTriangle className="w-5 h-5 mr-2" />
                  Shift non démarré
                </>
              ) : (
                <>
                  <BsReceipt className="w-5 h-5 mr-2" />
                  Valider la commande
                </>
              )}
            </button>
            
            {/* Message explicatif sous le bouton */}
            {!shiftActive && panier.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Cliquez sur "Démarrer le shift" dans le menu latéral pour activer la validation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}