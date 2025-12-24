import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header/Header";
import NavBar from "../../components/NavBar/NavBar";
import useAuthStore from "../../store/useAuthStore";

const Layout = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();
  
  // Don't render layout for auth routes
  const isAuthRoute = location.pathname.includes('/auth/');
  if (isAuthRoute) {
    console.log('🔓 Rendering auth route without layout');
    return <Outlet />;
  }
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render layout if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    console.log('❌ Layout: Not authenticated, waiting for redirect');
    return null;
  }

  console.log('✅ Layout: Rendering authenticated layout for role:', user?.roleInfo?.role);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-[auto_1fr] min-h-screen">
        <NavBar />
        <div className="flex flex-col h-screen overflow-y-scroll">
          <Header />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
