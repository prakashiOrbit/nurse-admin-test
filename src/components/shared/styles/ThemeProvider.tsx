// itouch-shared-framework/src/styles/ThemeProvider.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { Theme } from './types';

const ThemeContext = createContext<Theme | undefined>(undefined);

type ThemeProviderProps = {
  theme: Theme;
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
