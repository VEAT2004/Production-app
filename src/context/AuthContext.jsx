import { createContext, useContext, useState } from 'react';
const Ctx = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const login = (token) => {
    const [,b] = token.split('.');
    const u = JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/')));
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };
  const logout = () => { localStorage.clear(); setUser(null); };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
