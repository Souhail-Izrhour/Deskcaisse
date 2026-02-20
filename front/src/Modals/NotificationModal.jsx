// Modals/NotificationModal.jsx
import React, { useEffect } from "react";
import { FiCheck, FiAlertCircle, FiInfo } from "react-icons/fi";
import { FaTimes } from "react-icons/fa";

function NotificationModal({
  show,
  type = "info", // 'success', 'error', 'info'
  title = "",
  message = "",
  duration = 5000, // durée en ms
  position = "top-right", // 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'
  onClose
}) {
  // Auto-fermeture après la durée spécifiée
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  // Configuration basée sur le type
  const config = {
    success: {
      bgColor: "bg-green-50 border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-400",
      icon: FiCheck,
      title: title || "Succès"
    },
    error: {
      bgColor: "bg-red-50 border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-400",
      icon: FiAlertCircle,
      title: title || "Erreur"
    },
    info: {
      bgColor: "bg-blue-50 border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-400",
      icon: FiInfo,
      title: title || "Information"
    }
  };

  const { bgColor, textColor, iconColor, icon: Icon, title: defaultTitle } = config[type] || config.info;

  // Classes de position
  const positionClasses = {
    "top-left": "top-3 left-3",
    "top-center": "top-3 left-1/2 transform -translate-x-1/2",
    "top-right": "top-3 right-3",
    "bottom-left": "bottom-3 left-3",
    "bottom-center": "bottom-3 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-3 right-3"
  };

  const positionClass = positionClasses[position] || positionClasses["top-right"];

  return (
    <div className={`fixed ${positionClass} z-50 max-w-sm w-full sm:w-auto`}>
      <div className={`${bgColor} border rounded-lg shadow-lg p-3 sm:p-4 transform transition-all duration-300 ease-in-out`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="ml-2 sm:ml-3 flex-1 min-w-0">
            {defaultTitle && (
              <h3 className={`text-xs sm:text-sm font-semibold ${textColor} mb-1`}>
                {defaultTitle}
              </h3>
            )}
            {message && (
              <p className={`text-xs sm:text-sm ${textColor} ${defaultTitle ? '' : 'font-medium'}`}>
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`ml-2 flex-shrink-0 ${iconColor} hover:opacity-70 transition duration-150 p-1 rounded-full hover:bg-white hover:bg-opacity-20`}
          >
            <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
        
        {/* Barre de progression pour l'auto-fermeture */}
        {duration > 0 && (
          <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                type === 'success' ? 'bg-green-400' : 
                type === 'error' ? 'bg-red-400' : 'bg-blue-400'
              } animate-progress`}
              style={{ 
                animationDuration: `${duration}ms`,
                animationTimingFunction: 'linear'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationModal;