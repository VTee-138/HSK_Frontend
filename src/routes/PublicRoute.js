import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { checkJwtExistsAndExpired } from "../services/AuthService";

function PrivateRoute() {
  const auth = checkJwtExistsAndExpired();
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  // Render the child components if authenticated
  return <Outlet />;
}

export default PrivateRoute;
