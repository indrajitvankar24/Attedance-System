import React, { createContext, useContext, useState, useCallback } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

/**
 * Wraps the app and exposes: user, token, login(), signup(), logout(), loading.
 * Persists the JWT + user profile in localStorage so refreshing the page
 * doesn't log the user out.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("mis_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const persistSession = (token, userData) => {
    localStorage.setItem("mis_token", token);
    localStorage.setItem("mis_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/login", { username, password });
      persistSession(res.data.token, res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/signup", payload);
      persistSession(res.data.token, res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Signup failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mis_token");
    localStorage.removeItem("mis_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
