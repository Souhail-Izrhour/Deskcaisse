import React, { useState, useRef, useEffect } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { FiEye, FiEyeOff, FiLock, FiMail, FiLogIn, FiCheckCircle, FiShield, FiZap } from "react-icons/fi";
import { MdOutlineKeyboard } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AxiosClient from "../Services/AxiosClient";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inputName, setInputName] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCommercial, setShowCommercial] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true); // ⚡ Nouvel état
  const navigate = useNavigate();

  const keyboard = useRef(null);
  const formRef = useRef(null);

  const onChangeInput = (input) => {
    if (inputName === "email") setEmail(input);
    if (inputName === "password") setPassword(input);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        formRef.current &&
        !formRef.current.contains(e.target) &&
        !e.target.closest(".hg-button")
      ) {
        setShowKeyboard(false);
        setInputName(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Cacher le texte commercial quand le clavier apparaît
    if (showKeyboard) {
      setShowCommercial(false);
    }
  }, [showKeyboard]);

  useEffect(() => {
    // Réafficher le texte commercial quand le clavier disparaît
    if (!showKeyboard && !inputName) {
      const timer = setTimeout(() => {
        setShowCommercial(true);
      }, 500); // Après la fin de la transition
      return () => clearTimeout(timer);
    }
  }, [showKeyboard, inputName]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess(false);
  setLoading(true);

  try {
    const { data } = await AxiosClient.post("/login", { email, password });

    // Token uniquement
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user_role", data.user.role);

    setSuccess(true);

    // 🔀 REDIRECTION SELON LE RÔLE
    switch (data.user.role) {
      case "super_admin":
        navigate("/super");
        break;

      case "admin":
        navigate("/pos");
        break;
      case "serveur":
        navigate("/pos");
        break;
      default:
        navigate("/login"); // utilisateur normal
        localStorage.clear();
        break;
    }

  } catch (err) {
    setError(err.response?.data?.message || "Erreur lors de la connexion");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const role = localStorage.getItem("user_role");

    if (token && role) {
      switch (role) {
        case "super_admin":
          navigate("/super");
          break;
        case "admin":
        case "serveur":
          navigate("/pos");
          break;
        default:
          localStorage.clear();
          break;
      }
    }
    setCheckingAuth(false);
  }, [navigate]);

  // ⚠️ Si on est encore en train de vérifier, ne rien rendre
  if (checkingAuth) return null;

  return (
    <div className="min-h-screen bg-sky-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="relative w-full max-w-6xl h-auto lg:h-[400px] flex items-center">
        
        {/* TEXTE COMMERCIAL HlassTech - À GAUCHE (UNIQUEMENT SUR GRANDS ÉCRANS) */}
        <div
          className={`
            hidden lg:block
            absolute lg:relative
            w-full lg:w-1/2
            transition-all duration-500 ease-in-out
            ${showCommercial && !showKeyboard 
              ? "lg:opacity-100 lg:translate-x-0" 
              : "lg:opacity-0 lg:translate-x-[-100%]"
            }
            ${showKeyboard ? "pointer-events-none" : "pointer-events-auto"}
            z-0
            p-4 lg:p-8
            flex flex-col justify-center
          `}
        >
         <div className="bg-gradient-to-br from-blue-100 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-100">
  {/* Header */}
  <div className="flex items-center gap-3 mb-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-800">HlassTech POS</h1>
      <p className="text-blue-600 font-medium">Votre succès, notre technologie</p>
    </div>
  </div>

  {/* Texte officiel / présentation */}
  <p className="text-gray-700 text-sm mb-6">
    HlassTech POS est le système <span className="font-semibold">original et officiel</span> de notre entreprise, conçu et développé <span className="font-semibold">par notre équipe interne</span>. 
    Chaque fonctionnalité a été pensée pour répondre aux besoins réels des commerces modernes, avec une attention particulière à la <span className="font-semibold">performance</span>, à la <span className="font-semibold">simplicité d’utilisation</span> et à la <span className="font-semibold">sécurité</span>. 
    En choisissant HlassTech POS, vous utilisez une solution <span className="font-semibold">100% développée par nous</span>, adaptée à vos opérations quotidiennes et à l’évolution de votre entreprise.
  </p>

  {/* Features */}
  <div className="space-y-4">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
        <FiZap className="text-blue-600" size={16} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">Performance optimale</h3>
        <p className="text-gray-600 text-sm">Interface fluide et réactive pour une productivité maximale</p>
      </div>
    </div>

    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
        <FiCheckCircle className="text-green-600" size={16} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">Simplicité d'utilisation</h3>
        <p className="text-gray-600 text-sm">Design intuitif pour une prise en main immédiate</p>
      </div>
    </div>

    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-1">
        <FiShield className="text-purple-600" size={16} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">Sécurité renforcée</h3>
        <p className="text-gray-600 text-sm">Protection avancée de vos données sensibles</p>
      </div>
    </div>
  </div>

 
</div>

        </div>

        {/* FORMULAIRE - À DROITE */}
        <div
          ref={formRef}
          className={`
            relative lg:absolute top-0 lg:top-1/2 lg:-translate-y-1/2
            w-full max-w-md lg:max-w-sm
            bg-blue-100 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200
            transition-all duration-500 ease-in-out
            ${showKeyboard 
              ? "lg:translate-x-[-5%] lg:left-0" 
              : "lg:translate-x-0 lg:right-0"
            }
            mx-auto lg:mx-0
            z-10
          `}
        >
          {/* Header avec logo HlassTech */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
             
              <h1 className="text-3xl font-bold text-gray-800"> Espace de connexion</h1>
            </div>
            <p className="text-gray-600">Connectez-vous !</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" size={18} />
                </div>
                <input
                  type="email"
                  placeholder="exemple@hlass.tech"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    keyboard.current?.setInput(e.target.value);
                  }}
                  onFocus={() => {
                    setInputName("email");
                    setShowKeyboard(true);
                    keyboard.current?.setInput(email);
                  }}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    keyboard.current?.setInput(e.target.value);
                  }}
                  onFocus={() => {
                    setInputName("password");
                    setShowKeyboard(true);
                    keyboard.current?.setInput(password);
                  }}
                  className="w-full pl-10 pr-12 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connexion...
                </>
              ) : (
                <>
                  <FiLogIn size={18} />
                  Se connecter
                </>
              )}
            </button>

          </form>
        {/* Message d'erreur */}
            {error && (
             <div className="mt-6 bg-red-50 border border-red-200  rounded-lg p-1 animate-pulse">
               <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}
          {/* Message de succès */}
          {success && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-1 animate-pulse">
              <p className="text-green-600 text-sm text-center font-medium">
               Connexion réussie !
              </p>
            </div>
          )}
        </div>

        {/* CLAVIER VIRTUEL - À DROITE (apparaît à droite) */}
        <div
          className={`
            absolute top-0 lg:top-1/2 lg:-translate-y-1/2
            w-full max-w-xl lg:max-w-xl
            bg-blue-100 rounded-xl shadow-lg border border-gray-200 p-4 md:p-6
            transition-all duration-500 ease-in-out
            ${showKeyboard 
              ? "lg:opacity-100 lg:translate-x-0 right-0" 
              : "lg:opacity-0 lg:translate-x-full right-0"
            }
            left-1/2 lg:left-auto lg:right-0
            -translate-x-1/2 lg:translate-x-0
            z-0
          `}
        >
          {showKeyboard && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MdOutlineKeyboard className="text-blue-600" size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Clavier virtuel - {inputName === "email" ? "Email" : "Mot de passe"}
                  </span>
                </div>
                <button
                  onClick={() => setShowKeyboard(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-x-auto">
                <Keyboard
                  keyboardRef={(r) => (keyboard.current = r)}
                  inputName={inputName}
                  onChange={onChangeInput}
                  layout={{
                    default: [
                      "1 2 3 4 5 6 7 8 9 0",
                      "q w e r t y u i o p",
                      "a s d f g h j k l",
                      "z x c v b n m @ .",
                      "{space} {bksp}",
                    ],
                  }}
                  display={{
                    "{bksp}": "⌫",
                    "{space}": "Espace",
                  }}
                  theme="hg-theme-default"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;