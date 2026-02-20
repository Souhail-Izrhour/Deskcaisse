import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 px-4">
        <div className="from-blue-100 to-indigo-50 p-5 rounded-2xl shadow-lg max-w-md text-center">
          <span className="text-4xl font-bold text-red-600">!</span>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-black font-medium text-m mb-6">
            Vous n’avez pas la permission d’accéder à cette page.<br/>
            Veuillez contacter l’administrateur.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Retour à la page précédente
          </button>
        </div>
      </div>
  );
};

export default AccessDenied;
