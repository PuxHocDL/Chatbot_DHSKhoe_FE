// src/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("userToken"));

  useEffect(() => {
    // Lắng nghe thay đổi trong localStorage từ các tab khác
    const handleStorageChange = () => {
      setToken(localStorage.getItem("userToken"));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (newToken) => {
    localStorage.setItem("userToken", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    setToken(null);
  };

  const authInfo = { token, login, logout };

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};