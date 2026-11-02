import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session: if no token exists, log in as default Admin
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!token) {
          const res = await api.login("admin", "admin123");
          setUser(res.user);
          setToken(res.access_token);
        } else {
          const profile = await api.getCurrentUser();
          setUser(profile);
        }
      } catch (err) {
        console.warn("Auto-login fallback:", err);
        // Fallback login
        try {
          const res = await api.login("admin", "admin123");
          setUser(res.user);
          setToken(res.access_token);
        } catch (e) {
          console.error("Auth init failed:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: UserRole) => {
    let username = "admin";
    let password = "admin123";
    if (targetRole === "Fraud Investigator") {
      username = "investigator";
      password = "investigator123";
    } else if (targetRole === "Claims Officer") {
      username = "claimsofficer";
      password = "officer123";
    }

    try {
      const res = await api.login(username, password);
      setUser(res.user);
      setToken(res.access_token);
    } catch (e) {
      console.error("Role switch error:", e);
    }
  };

  const currentRole: UserRole = user?.role || "Admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        token,
        loading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
