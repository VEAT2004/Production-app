import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dict } from '../i18n';

const Ctx = createContext({ lang: 'km', setLang: () => {}, t: (k) => k });

export function LangProvider({ children, initial = 'km' }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || initial || 'km');

  useEffect(() => {
    // Sync when shop.default_language loads after mount.
    if (!localStorage.getItem('lang') && initial) setLangState(initial);
  }, [initial]);

  const setLang = useCallback((l) => {
    const next = l === 'en' ? 'en' : 'km';
    localStorage.setItem('lang', next);
    setLangState(next);
  }, []);

  const t = useCallback(
    (key) => (dict[lang] && dict[lang][key]) || dict.en[key] || key,
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
