import React, { createContext, useState, useEffect } from 'react';
import axiosClient from "../axiosClient.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        console.log("[Auth] Attempt restore login");

        axiosClient.get("/api/users/profile")
            .then(res => {
                console.log("[Auth] Login restored:", res.data);
                setUser(res.data);
            })
            .catch(err => {
                console.log("[Auth] Restore failed:", err.response?.status, err.response?.data);
                setUser(null);
            });
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
