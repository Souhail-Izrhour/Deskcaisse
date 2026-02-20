// hooks/useErrorHandler.js
import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleError = useCallback((error) => {
    console.error("Erreur:", error);
    
    const errorMsg = error.response?.data?.message || error.message || "Une erreur est survenue";
    
    // Vérifier si l'erreur concerne l'abonnement expiré
    if (errorMsg.toLowerCase().includes("abonnement") && 
        errorMsg.toLowerCase().includes("expiré")) {
      setErrorMessage(errorMsg);
      setShowSubscriptionModal(true);
      return true; // Retourne true si c'est une erreur d'abonnement
    }
    
    return false; // Retourne false si ce n'est pas une erreur d'abonnement
  }, []);

  const closeSubscriptionModal = useCallback(() => {
    setShowSubscriptionModal(false);
    setErrorMessage('');
  }, []);

  return {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  };
}; 