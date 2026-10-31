import { useEffect, useState } from 'react';
// Shop branding (name / theme color / receipt footer) from Admin → Design
const DEFAULTS = { shop_name: 'IT Coffee', theme_color: '#B45309', receipt_footer: 'Thank you! Visit again.',
  shop_logo: '', shop_address: '', shop_phone: '', currency: '$', default_language: 'km', printer_size: '80', new_order_sound: '1', site_url: '' };
let shop = { ...DEFAULTS };
let started = false;
const subs = new Set();

function applyTheme(c) {
  if (!/^#[0-9a-fA-F]{6}$/.test(c || '')) return;
  let el = document.getElementById('shop-theme');
  if (!el) { el = document.createElement('style'); el.id = 'shop-theme'; document.head.appendChild(el); }
  el.textContent =
    `.bg-amber-600,.bg-amber-700,.bg-amber-800{background-color:${c}!important}` +
    `.text-amber-700{color:${c}!important}`;
}

export async function refreshShop() {
  try {
    const r = await fetch('/api/settings/public');
    const d = await r.json();
    const next = { ...DEFAULTS };
    for (const k of Object.keys(DEFAULTS)) if (d[k]) next[k] = d[k];
    shop = next;
    applyTheme(shop.theme_color);
    document.title = shop.shop_name;
    subs.forEach(fn => fn(shop));
  } catch { /* keep defaults */ }
}

export function useShop() {
  const [s, setS] = useState(shop);
  useEffect(() => {
    subs.add(setS);
    if (!started) { started = true; refreshShop(); }
    return () => { subs.delete(setS); };
  }, []);
  return s;
}
