import React from "react";
import { BrowserRouter as Router, Routes, Route, redirect } from "react-router-dom";


// Pages publiques
import Login from "./Components/Login";

// Layout
import Layout from "./Components/Layout";

// Pages POS
import Caisse from "./Components/Caisse";
import Charges from "./Components/Charges";
import Statistiques from "./Components/Statistiques";
import Shifts from "./Components/Shifts";
import Raports from "./Components/Raports";
import Utilisateurs from "./Components/Utilisateurs";
import Produits from "./Components/Produits";
import Categories from "./Components/Categories";
import Fournisseurs from "./Components/Fournisseurs";
import Settings from "./Components/Settings";

// Sécurité
import ProtectedRoute from "./Services/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        

        {/* POS : admin + serveur */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={["admin", "serveur"]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Caisse />} />
          <Route path="charges" element={<Charges />} />
          <Route path="statistiques" element={<Statistiques />} />

          {/* ADMIN */}
          <Route
            path="shifts"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Shifts />
              </ProtectedRoute>
            }
          />
          <Route
            path="raports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Raports />
              </ProtectedRoute>
            }
          />
          <Route
            path="utilisateurs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Utilisateurs />
              </ProtectedRoute>
            }
          />
          <Route
            path="produits"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Produits />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="fournisseurs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Fournisseurs />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            } 
            />
        </Route>

        {/* SUPER ADMIN */}
        <Route
          path="/super"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <div>Super Admin Dashboard 
                <button onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}>Logout</button>
              </div>
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}


export default App;
