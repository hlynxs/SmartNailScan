
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Login: save user information and the backend token
  const login = (userData) => {
    setUser(userData);
  };

  // Logout: clear the logged-in user and token
  const logout = () => {
    setUser(null);
  };

  // Update user profile information
  const updateUser = (fields) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...fields };
    });
  };

  // Get the authentication token saved during login
  const token = user?.token || null;

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
