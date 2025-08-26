// src/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // <-- Phải có dòng import này

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // State phải là 'user', không phải 'token'
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const token = localStorage.getItem("userToken");
            if (token) {
                // Phải giải mã token ở đây
                const decodedUser = jwtDecode(token);
                setUser({ username: decodedUser.sub, role: decodedUser.role });
            }
        } catch (error) {
            console.error("Token không hợp lệ.", error);
            setUser(null);
        } finally {
            setIsLoading(false);

        }
    }, []);

    const login = (token) => {
        localStorage.setItem("userToken", token);
        // Và giải mã token khi login
        const decodedUser = jwtDecode(token);
        setUser({ username: decodedUser.sub, role: decodedUser.role });
    };

    const logout = () => {
        localStorage.removeItem("userToken");
        setUser(null);
    };

    // Cung cấp 'user' object, không phải 'token'
    const value = { user, login, logout, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};