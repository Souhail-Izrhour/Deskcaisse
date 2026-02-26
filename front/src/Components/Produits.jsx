import React, { useEffect, useState, useCallback, useRef } from "react";
import AxiosClient from "../Services/AxiosClient";
import { useErrorHandler } from "../hooks/useErrorHandler";
import SubscriptionModal from "../Modals/SubscriptionModal";
import ConfirmationModal from "../Modals/ConfirmationModal";
import NotificationModal from "../Modals/NotificationModal";
import VirtualKeyboard from "../Modals/VirtualKeyboard";
import { FiEdit2, FiTrash2, FiX, FiPackage, FiImage, FiUpload, FiTag } from "react-icons/fi";
import { FaSpinner, FaPlus, FaBox, FaTags } from "react-icons/fa";

function Produits() {
  const [produits, setProduits] = useState([]);
  const [allProduits, setAllProduits] = useState([]); // Stocker tous les produits
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [editData, setEditData] = useState({
    id: null,
    name: "",
    price: "",
    stock: "",
    barcode: "",
    category_id: "",
    image: null,
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    barcode: "",
    category_id: "",
    image: null,
  });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // États pour les filtres
  const [filters, setFilters] = useState({
    category_id: "",
    search: "",
  });

  // État pour la notification
  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    duration: 5000
  });

  // --- clavier virtuel ---
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputName, setInputName] = useState(null);
  const [keyboardInput, setKeyboardInput] = useState("");
  const formRef = useRef();
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Utilisation du hook d'erreur
  const {
    handleError,
    showSubscriptionModal,
    errorMessage,
    closeSubscriptionModal
  } = useErrorHandler();

  // Fonction de notification améliorée avec gestion d'erreur
  const showNotification = useCallback((type, message, error = null, title = "", duration = 5000) => {
    if (error && handleError(error)) {
      // Si c'est une erreur d'abonnement, ne pas afficher la notification normale
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

  // Fermeture de la notification
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  // Gestion du clavier virtuel
  const handleKeyboardChange = useCallback((input) => {
    setKeyboardInput(input);
    
    if (inputName === "name") {
      isEditing 
        ? setEditData(prev => ({ ...prev, name: input }))
        : setNewProduct(prev => ({ ...prev, name: input }));
    } else if (inputName === "barcode") {
      isEditing 
        ? setEditData(prev => ({ ...prev, barcode: input }))
        : setNewProduct(prev => ({ ...prev, barcode: input }));
    }
  }, [inputName, isEditing]);

  const handleKeyPress = useCallback((button) => {
    if (button === "{bksp}") {
      const currentValue = isEditing 
        ? editData[inputName] || ""
        : newProduct[inputName] || "";
      
      const newValue = currentValue.slice(0, -1);
      setKeyboardInput(newValue);
      
      if (inputName) {
        if (isEditing) {
          setEditData(prev => ({ ...prev, [inputName]: newValue }));
        } else {
          setNewProduct(prev => ({ ...prev, [inputName]: newValue }));
        }
      }
    } else if (button === "{space}") {
      const newValue = keyboardInput + " ";
      setKeyboardInput(newValue);
      
      if (inputName) {
        if (isEditing) {
          setEditData(prev => ({ ...prev, [inputName]: newValue }));
        } else {
          setNewProduct(prev => ({ ...prev, [inputName]: newValue }));
        }
      }
    }
  }, [inputName, isEditing, editData, newProduct, keyboardInput]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        formRef.current &&
        !formRef.current.contains(event.target) &&
        !event.target.closest(".hg-button")
      ) {
        setShowKeyboard(false);
        setInputName(null);
        setKeyboardInput("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch produits avec AxiosClient et gestion d'erreur
  const fetchProduits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AxiosClient.get("/products");
      const produitsData = response.data.data;
      setAllProduits(produitsData); // Stocker tous les produits
      setProduits(produitsData); // Initialiser avec tous les produits
    } catch (error) {
      console.error("Erreur fetch produits:", error);
      showNotification("error", "Erreur lors du chargement des produits", error);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Fetch catégories
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await AxiosClient.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
      showNotification("error", "Erreur lors du chargement des catégories", error);
    } finally {
      setLoadingCategories(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchProduits();
    fetchCategories();
  }, [fetchProduits, fetchCategories]);

  // Fonction pour filtrer les produits
  const filterProducts = useCallback(() => {
    let filtered = [...allProduits];

    // Filtrer par catégorie
    if (filters.category_id) {
      filtered = filtered.filter(product => 
        product.category_id.toString() === filters.category_id
      );
    }

    // Filtrer par recherche
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm))
      );
    }

    setProduits(filtered);
  }, [allProduits, filters]);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  // Gestion de l'upload d'image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation de la taille (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        showNotification("error", "L'image ne doit pas dépasser 2MB", null, "Erreur de validation", 6000);
        return;
      }

      // Validation du type
      if (!file.type.startsWith('image/')) {
        showNotification("error", "Veuillez sélectionner une image valide", null, "Erreur de validation", 6000);
        return;
      }

      setImageFile(file);
      
      // Prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = useCallback(() => {
    setNewProduct({
      name: "",
      price: "",
      stock: "",
      barcode: "",
      category_id: "",
      image: null,
    });
    setEditData({
      id: null,
      name: "",
      price: "",
      stock: "",
      barcode: "",
      category_id: "",
      image: null,
    });
    setImagePreview(null);
    setImageFile(null);
    setShowModal(false);
    setIsEditing(false);
    setShowKeyboard(false);
    setInputName(null);
    setKeyboardInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditData({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      stock: product.stock?.toString() || "0",
      barcode: product.barcode || "",
      category_id: product.category_id.toString(),
      image: product.image
    });
    if (product.image_url) {
      setImagePreview(product.image_url);
    }
    setImageFile(null);
    setIsEditing(true);
    setShowModal(true);
  };

  // Gestion des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Recherche avec debounce
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  }, []);

  // Ajouter un produit avec AxiosClient et gestion d'erreur
  const addProduct = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', parseFloat(newProduct.price));
      formData.append('stock', parseInt(newProduct.stock) || 0);
      formData.append('category_id', newProduct.category_id);
      if (newProduct.barcode) formData.append('barcode', newProduct.barcode);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await AxiosClient.post("/products", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showNotification("success", "Produit ajouté avec succès");
      resetForm();
      // Rafraîchir les produits
      fetchProduits();
    } catch (error) {
      console.error("Erreur add produit:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de l'ajout";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
    }
  };

  // Modifier un produit avec AxiosClient et gestion d'erreur
  const updateProduct = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('price', parseFloat(editData.price));
      formData.append('stock', parseInt(editData.stock) || 0);
      formData.append('category_id', editData.category_id);
      formData.append('_method', 'PUT'); // Pour Laravel
      if (editData.barcode) formData.append('barcode', editData.barcode);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await AxiosClient.post(`/products/${editData.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showNotification("success", "Produit modifié avec succès");
      resetForm();
      // Rafraîchir les produits
      fetchProduits();
    } catch (error) {
      console.error("Erreur update produit:", error);
      const errorMsg = error.response?.data?.message || "Erreur lors de la modification";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setProductToDelete(null);
    setShowDeleteModal(false);
  };

  // Supprimer un produit avec AxiosClient et gestion d'erreur
  const deleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setLoading(true);
      await AxiosClient.delete(`/products/${productToDelete.id}`);
      showNotification("success", "Produit supprimé avec succès");
      // Rafraîchir les produits
      fetchProduits();
    } catch (error) {
      console.error("Erreur delete produit:", error);
      const errorMsg = error.response?.data?.message || "Impossible de supprimer";
      showNotification("error", errorMsg, error);
    } finally {
      setLoading(false);
      closeDeleteModal();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateProduct();
    } else {
      addProduct();
    }
  };

  const handleInputFocus = (field) => {
    // Ne pas afficher le clavier virtuel sur mobile
    if (isMobile) return;
    
    setInputName(field);
    setShowKeyboard(true);
    const currentValue = isEditing ? editData[field] || "" : newProduct[field] || "";
    setKeyboardInput(currentValue);
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    
    if (isEditing) {
      setEditData(prev => ({ ...prev, [field]: value }));
    } else {
      setNewProduct(prev => ({ ...prev, [field]: value }));
    }
    
    if (inputName === field) {
      setKeyboardInput(value);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Formatage du prix
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2).replace('.', ',') + ' dh';
  };

  return (
    <div className="min-h-screen bg-blue-100 pt-2 px-1 sm:px-4 md:px-4 pb-3 sm:pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Modal d'abonnement expiré */}
        <SubscriptionModal
          show={showSubscriptionModal}
          message={errorMessage}
          onClose={closeSubscriptionModal}
        />
        
        {/* Modal de confirmation de suppression */}
        <ConfirmationModal
          show={showDeleteModal}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer ce produit ?"
          confirmText="Supprimer"
          cancelText="Annuler"
          loading={loading}
          item={productToDelete}
          onConfirm={deleteProduct}
          onCancel={closeDeleteModal}
        />
        
        {/* Notification réutilisable */}
        <NotificationModal
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={closeNotification}
        />

        {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gestion des Produits</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Organisez votre inventaire de produits</p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition duration-200 flex items-center justify-center text-xs sm:text-sm shadow-sm hover:shadow-md"
            >
              <FaPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">Ajouter un produit</span>
              <span className="xs:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[80vh] overflow-y-auto">
            {/* Version Desktop */}
            <table className="w-full hidden sm:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                        <p className="text-gray-600">Chargement des produits...</p>
                      </div>
                    </td>
                  </tr>
                ) : produits.length === 0 ? (
                  // Message quand il n'y a pas de produits
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
                          <FaBox className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {filters.search || filters.category_id 
                            ? "Aucun produit ne correspond à vos critères" 
                            : "Aucun produit trouvé"}
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {filters.search || filters.category_id 
                            ? "Essayez de modifier vos critères de recherche." 
                            : "Commencez par ajouter votre premier produit."}
                        </p>
                        {!(filters.search || filters.category_id) && (
                          <button
                            onClick={openAddModal}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md"
                          >
                            <FaPlus className="w-5 h-5 mr-2" />
                            Ajouter un produit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Afficher les produits
                  produits.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.image_url ? (
                            <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-200 shadow-sm">
                              <FiPackage className="w-6 h-6 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {product.category?.name || 'Non catégorisé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center"
                          >
                            <FiEdit2 className="w-4 h-4 mr-1" />
                            Modifier
                          </button>
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center"
                          >
                            <FiTrash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </button>
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
                  <p className="text-gray-600">Chargement des produits...</p>
                </div>
              ) : produits.length === 0 ? (
                // Message quand il n'y a pas de produits (mobile)
                <div className="text-center py-16 px-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center">
                      <FaBox className="w-10 h-10 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filters.search || filters.category_id 
                      ? "Aucun produit ne correspond à vos critères" 
                      : "Aucun produit trouvé"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {filters.search || filters.category_id 
                      ? "Essayez de modifier vos critères de recherche." 
                      : "Commencez par ajouter votre premier produit."}
                  </p>
                  {!(filters.search || filters.category_id) && (
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-sm hover:shadow-md"
                    >
                      <FaPlus className="w-5 h-5 mr-2" />
                      Ajouter un produit
                    </button>
                  )}
                </div>
              ) : (
                // Afficher les produits (mobile)
                <div className="space-y-4 p-0">
                  {produits.map((product) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-150">
                      <div className="flex items-start space-x-4 mb-4">
                        {product.image_url ? (
                          <div className="flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-200 shadow-sm">
                            <FiPackage className="w-8 h-8 text-blue-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-gray-900 mb-1">
                            {product.name}
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {product.category?.name || 'Non catégorisé'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150 flex items-center justify-center"
                        >
                          <FiEdit2 className="w-4 h-4 mr-2" />
                          Modifier
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150 flex items-center justify-center"
                        >
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Ajout/Modification */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div ref={formRef} className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-4xl mx-2 transform transition-all max-h-[90vh] overflow-y-auto">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {isEditing ? "Modifier le produit" : "Ajouter un produit"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition duration-150 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Section Image */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image du produit
                      </label>
                      
                      {/* Zone d'upload */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition duration-150"
                      >
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Prévisualisation"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage();
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition duration-150"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="py-8">
                            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Cliquez pour uploader une image
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, JPEG jusqu'à 2MB
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Section Informations */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du produit *
                      </label>
                      <input
                        type="text"
                        value={isEditing ? editData.name : newProduct.name}
                        onChange={(e) => handleInputChange(e, "name")}
                        onFocus={() => handleInputFocus("name")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                        required
                        maxLength={150}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={isEditing ? editData.price : newProduct.price}
                          onChange={(e) => handleInputChange(e, "price")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie *
                      </label>
                      <select
                        value={isEditing ? editData.category_id : newProduct.category_id}
                        onChange={(e) => handleInputChange(e, "category_id")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-sm sm:text-base"
                        required
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Image actuelle (mode édition) */}
                    {isEditing && editData.image && !imagePreview && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image actuelle
                        </label>
                        <div className="relative">
                          <img
                            src={editData.image_url}
                            alt="Image actuelle"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition duration-150"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            Cette image sera remplacée si vous uploadez une nouvelle image
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clavier virtuel réutilisable - seulement sur desktop */}
                {showKeyboard && !isMobile && (
                  <div className="mt-4 border-t pt-4">
                    <VirtualKeyboard
                      inputName={inputName}
                      inputValue={keyboardInput}
                      onChange={handleKeyboardChange}
                      onKeyPress={handleKeyPress}
                      onHide={() => {
                        setShowKeyboard(false);
                        setInputName(null);
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-150 order-2 sm:order-1"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || 
                      (!isEditing && (!newProduct.name || !newProduct.price || !newProduct.category_id)) || 
                      (isEditing && (!editData.name || !editData.price || !editData.category_id))
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center order-1 sm:order-2"
                  >
                    {loading && (
                      <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    )}
                    {isEditing ? "Mettre à jour" : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Produits;