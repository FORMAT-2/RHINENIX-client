import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [isFestival, setIsFestival] = useState(false);

  useEffect(() => {
    api.get('/theme')
      .then(({ data }) => {
        setTheme(data.data);
        const t = data.data;
        if (t?.isFestivalThemeEnabled) {
          const now = new Date();
          const from = t.effectiveFrom ? new Date(t.effectiveFrom) : null;
          const to = t.effectiveTo ? new Date(t.effectiveTo) : null;
          if ((!from || now >= from) && (!to || now <= to)) {
            setIsFestival(true);
            document.body.classList.add('festival-theme');
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isFestival }}>
      {children}
    </ThemeContext.Provider>
  );
}
