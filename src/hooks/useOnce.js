import { useRef } from 'react';
// Anti double-click: ពេល submit ហើយ disable ភ្លាម
export function useOnce(fn) {
  const busy = useRef(false);
  return async (...args) => {
    if (busy.current) return;
    busy.current = true;
    try { return await fn(...args); }
    finally { setTimeout(() => (busy.current = false), 800); }
  };
}
// crypto.randomUUID() ដំណើរការតែលើ HTTPS/localhost — ទូរស័ព្ទតាម http://IP ត្រូវការ fallback
export const newIdemKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'k-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
};
