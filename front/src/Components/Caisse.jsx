import React, { useEffect, useState } from "react";
import Panier from "./Panier";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import NotificationModal from "../Modals/NotificationModal";
import { FaShoppingCart, FaPlus, FaSpinner, FaArrowLeft , FaProductHunt, FaImage } from "react-icons/fa";
import { useOutletContext } from "react-router-dom";

export default function Caisse() {
  const [categories, setCategories] = useState([]);
  const [panier, setPanier] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [validating, setValidating] = useState(false);
  const { shiftActive, startShift } = useOutletContext();


  // État pour la notification (seulement pour erreurs importantes)
  const [notification, setNotification] = useState({
    show: false,
    type: "error",
    message: "",
    duration: 3000
  });

  // Utilisation du hook d'erreur
  const {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  } = useErrorHandler();

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const showNotification = (type, message, error = null) => {
    if (error && handleError(error)) {
      return;
    }
    setNotification({
      show: true,
      type,
      message,
      duration: 2000
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await AxiosClient.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
      showNotification("error", "Erreur lors du chargement", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  // ➕ Ajouter produit au panier (sans notification)
  const ajouterAuPanier = (produit) => {
    if (validating) return; // empêcher ajout pendant validation
    setPanier(prev => {
      const exist = prev.find(p => p.id === produit.id);
      if (exist) {
        return prev.map(p =>
          p.id === produit.id
            ? { ...p, quantite: p.quantite + 1 }
            : p
        );
      }
      return [...prev, { ...produit, quantite: 1 }];
    });
  };

  // ➖ Diminuer quantité (sans notification)
  const diminuerQuantite = (produitId) => {
    setPanier(prev => {
      const produit = prev.find(p => p.id === produitId);
      if (produit.quantite > 1) {
        return prev.map(p =>
          p.id === produitId
            ? { ...p, quantite: p.quantite - 1 }
            : p
        );
      } else {
        return prev.filter(p => p.id !== produitId);
      }
    });
  };

  // 🗑️ Supprimer du panier (sans notification)
  const supprimerDuPanier = (produitId) => {
    setPanier(prev => prev.filter(p => p.id !== produitId));
  };

  // ✅ Valider la commande
  const validerCommande = async () => {
    if (panier.length === 0) {
      showNotification("error", "Le panier est vide");
      return;
    }
    setValidating(true);

    // Construire le payload selon le format requis
    const payload = {
      items: panier.map(item => ({
        id: item.id,
        quantity: item.quantite
      })),
      totalOrder: panier.reduce((sum, p) => sum + parseFloat(p.price) * p.quantite, 0),
      payment_method: "espèce" // ou variable dynamique si tu veux gérer d'autres moyens de paiement
    };

    try {
      await AxiosClient.post("/orders", payload);
      showNotification("success", "Commande validée");
      setPanier([]); // vider le panier après validation
      
      setTimeout(() => {
        setSelectedCategory(null);
      }, 100);
    } catch (error) {
      console.error("Erreur validation commande:", error);

      const backendMessage =
        error.response?.data?.message ||
        "Erreur lors de la validation de la commande";

      showNotification("error", backendMessage, error);
    } finally {
      setValidating(false);
    }
  };

  // Vider le panier (sans notification)
  const viderPanier = () => {
    if (panier.length === 0) return;
    setPanier([]);
  };

  const totalPanier = panier.reduce((sum, p) => sum + parseFloat(p.price) * p.quantite, 0);

  return (
    <div className="h-screen overflow-auto bg-blue-100">
      {/* Modal d'abonnement expiré */}
      <SubscriptionModal
        show={showSubscriptionModal}
        message={errorMessage}
        onClose={closeSubscriptionModal}
      />
      
      {/* Notification Modal (seulement pour erreurs importantes) */}
      <NotificationModal
        show={notification.show}
        type={notification.type}
        message={notification.message}
        duration={notification.duration}
        onClose={closeNotification}
      />

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Section gauche - Catégories/Produits */}
          <div className="lg:w-2/3">
            {/* Bouton retour si catégorie sélectionnée */}
            {selectedCategory && (
              <button
                onClick={handleBackToCategories}
                className="mb-4 flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <FaArrowLeft className="mr-2" />
                Retour aux catégories
              </button>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : (
              <>
                {/* Vue Catégories */}
                {!selectedCategory && (
                  <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-5 gap-1 max-h-[90vh] overflow-y-auto pr-2">
                    {categories.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="bg-white rounded-lg shadow border cursor-pointer hover:shadow-md transition"
                      >
                        <div className="h-32 overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
                          {cat.image_url ? (
                            <img 
                              src={cat.image_url} 
                              alt={cat.name}
                              className="w-full h-full object-cover "
                            />
                          ) : (
                            <FaImage className="text-blue-100 w-12 h-12" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-gray-800 text-sm truncate">
                            {cat.name}
                          </h3>
                        
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Vue Produits */}
                {selectedCategory && (
                  <>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      {selectedCategory.name}
                    </h2>

                    {!selectedCategory.products || selectedCategory.products.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg shadow">
                        <FaShoppingCart className="w-12 h-12 text-blue-100 mx-auto mb-3" />
                        <p className="text-gray-500">Aucun produit dans cette catégorie</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-5  gap-1 max-h-[80vh] overflow-y-auto pr-2">
                        {(selectedCategory.products || []).map(prod => (
                          <div
                            key={prod.id}
                            onClick={() => ajouterAuPanier(prod)}
                            className="bg-white rounded-lg shadow border cursor-pointer hover:shadow-md transition"
                          >
                            <div className="h-24 flex items-center justify-center bg-gray-100 rounded-t-lg">
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt={prod.name}
                                  className="w-full h-full object-cover rounded-t-lg"
                                />
                              ) : (
                                <FaProductHunt className="text-blue-100 w-12 h-12" />
                              )}
                            </div>

                            <div className="p-1">
                              <h3 className="font-medium text-gray-800 text-sm truncate">
                                {prod.name}
                              </h3>

                              <div className="flex items-center justify-between mt-1 ">
                                <span className="text-blue-600 font-bold text-xs">
                                  {parseFloat(prod.price).toFixed(2)} DH
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    ajouterAuPanier(prod);
                                  }}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-1 rounded-full"
                                >
                                  <FaPlus className="w-2 h-2" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Section droite - Panier */}
          <div className="lg:w-1/3 lg:ml-auto">
            <Panier 
              panier={panier}
              onDiminuerQuantite={diminuerQuantite}
              onAjouterQuantite={ajouterAuPanier}
              onSupprimer={supprimerDuPanier}
              onValiderCommande={validerCommande}
              onViderPanier={viderPanier}
              total={totalPanier}
              validating={validating}
              shiftActive={shiftActive}
              // startShift={startShift}
            />
          </div>
        </div>
      </div>
    </div>
  );
}