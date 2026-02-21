import React, { useState, useEffect } from 'react';
import AxiosClient from "../Services/AxiosClient";

export default function Settings() {
  const [settings, setSettings] = useState({
    ticket_footer_message: '',
    show_logo_on_ticket: true,
    ticket_type: 'normal',
    logo: null
  });
  
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Charger les paramètres au montage du composant
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await AxiosClient.get('/ticket-settings');
      setSettings(response.data);
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement des paramètres');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleFooterUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await AxiosClient.put('/ticket-settings/footer', {
        ticket_footer_message: settings.ticket_footer_message
      });
      
      setSettings(prev => ({
        ...prev,
        ticket_footer_message: response.data.ticket_footer_message
      }));
      
      showMessage('success', 'Footer mis à jour avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour du footer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLogo = async (value) => {
    try {
      const response = await AxiosClient.put('/ticket-settings/logo-toggle', {
        show_logo_on_ticket: value
      });
      
      setSettings(prev => ({
        ...prev,
        show_logo_on_ticket: response.data.show_logo_on_ticket
      }));
      
      showMessage('success', 'Affichage du logo mis à jour');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleTypeUpdate = async (type) => {
    try {
      const response = await AxiosClient.put('/ticket-settings/type', {
        ticket_type: type
      });
      
      setSettings(prev => ({
        ...prev,
        ticket_type: response.data.ticket_type
      }));
      
      showMessage('success', 'Type de ticket mis à jour');
    } catch (error) {
      showMessage('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedLogo(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!selectedLogo) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('logo', selectedLogo);

    try {
      const response = await AxiosClient.post('/ticket-settings/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSettings(prev => ({
        ...prev,
        logo: response.data.logo
      }));
      
      setSelectedLogo(null);
      setPreviewLogo(null);
      showMessage('success', 'Logo uploadé avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'upload du logo');
    } finally {
      setLoading(false);
    }
  };

  const getLogoUrl = () => {
    if (settings.logo) {
      return `${AxiosClient.defaults.baseURL}/storage/${settings.logo}`;
    }
    return null;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Paramètres des tickets</h1>

      {/* Message de notification */}
      {message.text && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section Logo */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Logo</h2>
        
        {/* Affichage du logo actuel */}
        {settings.logo && !previewLogo && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Logo actuel :</p>
            <img 
              src={getLogoUrl()} 
              alt="Logo" 
              className="max-h-20 object-contain"
            />
          </div>
        )}

        {/* Upload de nouveau logo */}
        <form onSubmit={handleLogoUpload}>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="mb-2"
            disabled={loading}
          />
          
          {previewLogo && (
            <div className="mb-2">
              <p className="text-sm text-gray-600">Nouveau logo :</p>
              <img src={previewLogo} alt="Preview" className="max-h-20 object-contain" />
            </div>
          )}
          
          <button
            type="submit"
            disabled={!selectedLogo || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            {loading ? 'Upload...' : 'Uploader le logo'}
          </button>
        </form>

        {/* Toggle affichage logo */}
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.show_logo_on_ticket}
              onChange={(e) => handleToggleLogo(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Afficher le logo sur les tickets</span>
          </label>
        </div>
      </div>

      {/* Section Footer */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Message de pied de page</h2>
        <form onSubmit={handleFooterUpdate}>
          <textarea
            value={settings.ticket_footer_message || ''}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              ticket_footer_message: e.target.value
            }))}
            className="w-full p-2 border rounded mb-2"
            rows="3"
            placeholder="Entrez le message de pied de page..."
            maxLength="255"
          />
          <p className="text-sm text-gray-500 mb-2">
            {settings.ticket_footer_message?.length || 0}/255 caractères
          </p>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            Mettre à jour le footer
          </button>
        </form>
      </div>

      {/* Section Type de ticket */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Type de ticket</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="normal"
              checked={settings.ticket_type === 'normal'}
              onChange={(e) => handleTypeUpdate(e.target.value)}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <span>Ticket normal</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="double"
              checked={settings.ticket_type === 'double'}
              onChange={(e) => handleTypeUpdate(e.target.value)}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <span>Ticket double</span>
          </label>
        </div>
      </div>
    </div>
  );
}