import { Navigate } from "react-router-dom";
import AccessDenied from "../Components/AccessDenied";

const ProtectedRoute = ({  allowedRoles, children }) => {
  const userRole = localStorage.getItem("user_role");
  if (!userRole) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <AccessDenied />;
  }

  return children;
};

export default ProtectedRoute;
