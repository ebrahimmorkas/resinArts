import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext.jsx";

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Role-based authorization
  if (allowedRole && user.role !== allowedRole) {
    // Redirect admins trying to access '/' to '/admin/admin'
    if (user.role === "admin" && allowedRole === "user") {
      return <Navigate to="/admin/panel" replace />;
    }
    // Redirect customers trying to access '/admin/admin' to '/'
    if (user.role === "user" && allowedRole === "admin") {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}