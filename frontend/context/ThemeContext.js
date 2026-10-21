import React, { createContext, useContext, useState, useMemo } from 'react';
import { brand, lightSurface, darkSurface } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const colors = useMemo(
    () => ({ ...brand, ...(mode === 'dark' ? darkSurface : lightSurface) }),
    [mode]
  );
  const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}