// components/SubscriptionModal.js
import React from 'react';

function SubscriptionModal({ show, message, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
        <div className="p-6 text-center">
          {/* Icon d'alerte */}
          <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto mb-6">
            <svg 
              className="w-10 h-10 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          {/* Titre */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Abonnement Expiré
          </h2>
          
          {/* Message */}
          <p className="text-gray-600 mb-6 text-lg">
            {message || "Votre abonnement a expiré. Veuillez renouveler pour continuer à utiliser l'application."}
          </p>
          
          {/* Détails */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm">
              <span className="font-semibold">Impact :</span> L'accès à certaines fonctionnalités est temporairement restreint.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 font-medium shadow-sm"
            >
              Fermer
            </button>
          
          </div>
          
       
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;