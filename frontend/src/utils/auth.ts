export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const getCurrentUser =
  (): CurrentUser | null => {
    const user = localStorage.getItem("user");

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  };

export const getUserRole = (): string | null => {
  const user = getCurrentUser();

  return user?.role || null;
};

export const hasRole = (
  allowedRoles: string[]
): boolean => {
  const role = getUserRole();

  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};