import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { hasRole } from "../utils/auth";

interface RoleRouteProps {
  allowedRoles: string[];
}

function RoleRoute({
  allowedRoles,
}: RoleRouteProps) {
  if (!hasRole(allowedRoles)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

export default RoleRoute;