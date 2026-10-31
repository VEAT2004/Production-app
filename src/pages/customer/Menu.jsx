import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { useOnce, newIdemKey } from '../../hooks/useOnce';
import { useShop } from '../../hooks/useShop';
import { useLang } from '../../context/LangContext.jsx';

// Fallback product image (coffee cup on a warm gradient)
function Thumb({ src, name, big }) {
  const cls = big ? 'w-full h-40' : 'w-16 h-16';
  if (src) return <img src={src} alt={name} className={`${cls} object-contain rounded-xl bg-stone-100`} loading="lazy" />;
  return (
    <div className={`${cls} rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-2xl`}>☕</div>
  );
}

function unitPrice(product, options) {
  let p = Number(product.price) || 0;
  const cfg = product.options || {};
  for (const g of Object.keys(options || {})) {
    const choices = cfg[g] || [];
    const hit = choices.find(c => c.label === options[g]);
    if (hit) p += Number(hit.add) || 0;
  }
  return Math.round(p * 100) / 100;
}

export default function Menu() {
  const { token } = useParams();
  const shop = useShop();
  const { t, lang, setLang } = useLang();
  const cur = shop.currency || '$';

  const [data, setData] = useState(null);
  const [lines, setLines] = useState([]);          // [{key, product, qty, options, note, unit}]
  const [name, setName] = useState('');
  const [done, setDone] = useState(null);
  const [editing, setEditing] = useState(null);     // product being customized
  const [editLineKey, setEditLineKey] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const idemKey = useRef(newIdemKey());
  const seq = useRef(1);

  useEffect(() => {
    api.get(`/menu/${token}`).then(r => setData(r.data)).catch(() => alert(t('invalid_qr')));
    // apply shop default language if the user hasn't chosen one
    if (!localStorage.getItem('lang')) {
      api.get('/settings/public').then(r => { if (r.data.default_language) setLang(r.data.default_language); }).catch(()=>{});
    }
  }, [token]);

  const total = useMemo(() => lines.reduce((s, l) => s + l.unit * l.qty, 0), [lines]);
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  const openCustomize = (product, lineKey = null) => { setEditing(product); setEditLineKey(lineKey); };

  const saveLine = (product, qty, options, note, lineKey) => {
    const unit = unitPrice(product, options);
    if (lineKey) {
      setLines(ls => ls.map(l => l.key === lineKey ? { ...l, qty, options, note, unit } : l));
    } else {
      setLines(ls => [...ls, { key: 'l' + (seq.current++), product, qty, options, note, unit }]);
    }
    setEditing(null); setEditLineKey(null); setCartOpen(true);
  };

  const changeQty = (key, delta) => {
    setLines(ls => ls.map(l => l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l)
                    .filter(l => l.qty > 0));
  };
  const removeLine = (key) => setLines(ls => ls.filter(l => l.key !== key));

  const serviceCall = useOnce(async (type) => {
    try {
      await api.post('/service-calls', { table_token: token, type, order_id: done?.order_id ?? null });
      showToast(type === 'staff' ? t('call_staff_ok') : t('bill_ok'));
    } catch { showToast('⚠️'); }
  });

  const placeOrder = useOnce(async () => {
    const items = lines.map(l => ({ product_id: l.product.id, qty: l.qty, options: l.options, note: l.note || undefined }));
    if (!items.length) return showToast(t('select_items_first'));
    const { data: res } = await api.post('/orders', {
      table_token: token, customer_name: name, items, idempotency_key: idemKey.current, order_type: 'qr',
    });
    setLines([]); setCartOpen(false); setDone(res);
    idemKey.current = newIdemKey(); // fresh key so the guest can place another order
  });

  if (done) return <OrderDone id={done.order_id} total={done.total} cur={cur} onMore={() => setDone(null)} serviceCall={serviceCall} t={t} />;
  if (!data) return <p className="p-8 text-center text-stone-500">{t('loading')}</p>;

  const cats = data.categories || [];

  return (
    <div className="max-w-md mx-auto pb-28 bg-stone-50 min-h-screen" dir="ltr">
      {/* Header */}
      <header className="bg-amber-700 text-white px-4 pt-4 pb-3 sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          {shop.shop_logo
            ? <img src={shop.shop_logo} alt="logo" className="w-10 h-10 rounded-full object-cover bg-white/20" />
            : <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">☕</div>}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{shop.shop_name}</h1>
            <p className="text-xs opacity-85">{t('scan_order')} · {t('no_login')}</p>
          </div>
          <button onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
            className="shrink-0 text-xs font-semibold bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg">
            {lang === 'km' ? 'EN' : 'ខ្មែរ'}
          </button>
        </div>
      </header>

      {/* Quick service actions */}
      <div className="grid grid-cols-2 gap-2 p-3">
        <button onClick={() => serviceCall('staff')}
          className="flex items-center justify-center gap-2 bg-white rounded-xl py-3 shadow-sm border border-stone-200 active:scale-95 transition font-medium">
          🔔 {t('call_staff')}
        </button>
        <button onClick={() => serviceCall('bill')}
          className="flex items-center justify-center gap-2 bg-white rounded-xl py-3 shadow-sm border border-stone-200 active:scale-95 transition font-medium">
          🧾 {t('request_bill')}
        </button>
      </div>

      {/* Menu */}
      {cats.map(c => {
        const prods = (data.products || []).filter(p => p.category_id === c.id);
        if (!prods.length) return null;
        return (
          <section key={c.id} className="px-3 mb-2">
            <h2 className="font-bold text-stone-700 mb-2 mt-2">{c.name}</h2>
            {prods.map(p => {
              const soldOut = p.in_stock === false;
              return (
                <button key={p.id} disabled={soldOut} onClick={() => openCustomize(p)}
                  className={`w-full bg-white p-3 rounded-2xl shadow-sm mb-2 flex gap-3 items-center text-left border border-stone-100 ${soldOut ? 'opacity-50' : 'active:scale-[.98]'} transition`}>
                  <Thumb src={p.image} name={p.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-800 truncate">{p.name}</div>
                    {p.description && <div className="text-xs text-stone-400 truncate">{p.description}</div>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-amber-700 font-bold">{cur}{Number(p.price).toFixed(2)}</span>
                      {p.options && Object.keys(p.options).length > 0
                        && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">{t('options')}</span>}
                      {soldOut && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{t('sold_out')}</span>}
                    </div>
                  </div>
                  <div className="text-amber-700 text-xl font-bold">+</div>
                </button>
              );
            })}
          </section>
        );
      })}

      {/* Cart bar */}
      {count > 0 && (
        <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto p-3 z-20">
          <button onClick={() => setCartOpen(true)}
            className="w-full bg-amber-700 text-white rounded-2xl px-4 py-3.5 shadow-lg flex items-center justify-between font-bold active:scale-[.98] transition">
            <span className="flex items-center gap-2">
              <span className="bg-white/25 rounded-full w-6 h-6 flex items-center justify-center text-sm">{count}</span>
              {t('cart')}
            </span>
            <span>{cur}{total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-30 flex items-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('cart')}</h3>
              <button onClick={() => setCartOpen(false)} className="text-stone-400 text-2xl leading-none">×</button>
            </div>
            {lines.length === 0 && <p className="p-6 text-center text-stone-400">{t('empty_cart')}</p>}
            <div className="p-3">
              {lines.map(l => (
                <div key={l.key} className="flex gap-3 items-start bg-stone-50 rounded-xl p-3 mb-2">
                  <Thumb src={l.product.image} name={l.product.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{l.product.name}</div>
                    {Object.keys(l.options || {}).length > 0 &&
                      <div className="text-xs text-stone-500">{Object.entries(l.options).map(([g, v]) => `${g}: ${v}`).join(' · ')}</div>}
                    {l.note && <div className="text-xs text-amber-700 italic">📝 {l.note}</div>}
                    <div className="text-amber-700 font-bold text-sm mt-0.5">{cur}{(l.unit * l.qty).toFixed(2)}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 bg-white rounded-full border px-1">
                      <button onClick={() => changeQty(l.key, -1)} className="w-7 h-7 text-lg font-bold text-stone-600">−</button>
                      <span className="w-5 text-center font-bold text-sm">{l.qty}</span>
                      <button onClick={() => changeQty(l.key, 1)} className="w-7 h-7 text-lg font-bold text-amber-700">+</button>
                    </div>
                    <button onClick={() => openCustomize(l.product, l.key)} className="text-[11px] text-stone-500 underline">{t('update_item')}</button>
                    <button onClick={() => removeLine(l.key)} className="text-[11px] text-red-500">{t('remove')}</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white border-t p-3">
              <input placeholder={t('your_name')} className="w-full border border-stone-200 rounded-xl p-2.5 mb-2 bg-stone-50"
                value={name} onChange={e => setName(e.target.value)} />
              <div className="flex justify-between font-bold mb-2 px-1"><span>{t('total')}</span><span className="text-amber-700">{cur}{total.toFixed(2)}</span></div>
              <button onClick={placeOrder} className="w-full bg-amber-700 text-white rounded-xl py-3 font-bold text-lg active:scale-[.98] transition">
                {t('order_now')} — {cur}{total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize modal */}
      {editing && (
        <Customize product={editing} lineKey={editLineKey} existing={lines.find(l => l.key === editLineKey)}
          cur={cur} t={t} onClose={() => { setEditing(null); setEditLineKey(null); }} onSave={saveLine} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 inset-x-0 max-w-md mx-auto px-6 z-40">
          <div className="bg-stone-800 text-white text-sm text-center rounded-xl py-3 px-4 shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

function Customize({ product, lineKey, existing, cur, t, onClose, onSave }) {
  const cfg = product.options || {};
  const groups = Object.keys(cfg);
  const [sel, setSel] = useState(() => existing?.options || groups.reduce((a, g) => (a[g] = cfg[g][0]?.label, a), {}));
  const [qty, setQty] = useState(existing?.qty || 1);
  const [note, setNote] = useState(existing?.note || '');
  const unit = unitPrice(product, sel);

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <Thumb src={product.image} name={product.name} big />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full text-stone-600 text-xl shadow">×</button>
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold">{product.name}</h3>
          {product.description && <p className="text-sm text-stone-500 mb-2">{product.description}</p>}

          {groups.map(g => (
            <div key={g} className="mt-3">
              <div className="text-sm font-semibold text-stone-600 mb-1.5">{t(g) !== g ? t(g) : g}</div>
              <div className="flex flex-wrap gap-2">
                {(cfg[g] || []).map(c => {
                  const active = sel[g] === c.label;
                  return (
                    <button key={c.label} onClick={() => setSel(s => ({ ...s, [g]: c.label }))}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${active ? 'bg-amber-700 text-white border-amber-700' : 'bg-white border-stone-200 text-stone-700'}`}>
                      {c.label}{c.add > 0 ? ` (+${cur}${Number(c.add).toFixed(2)})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-4">
            <div className="text-sm font-semibold text-stone-600 mb-1.5">{t('note')}</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder={t('note_ph')} className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-sm" />
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3 bg-stone-100 rounded-full px-2 py-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 text-lg font-bold text-stone-600">−</button>
              <span className="w-6 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 text-lg font-bold text-amber-700">+</button>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-400">{cur}{unit.toFixed(2)} {t('each')}</div>
              <div className="font-bold text-amber-700 text-lg">{cur}{(unit * qty).toFixed(2)}</div>
            </div>
          </div>

          <button onClick={() => onSave(product, qty, sel, note, lineKey)}
            className="w-full mt-4 bg-amber-700 text-white rounded-xl py-3 font-bold text-lg active:scale-[.98] transition">
            {lineKey ? t('update_item') : t('add_to_cart')} · {cur}{(unit * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDone({ id, total, cur, onMore, serviceCall, t }) {
  const [st, setSt] = useState('pending');
  useEffect(() => {
    const load = () => fetch(`/api/order-status/${id}`).then(r => r.json()).then(d => setSt(d.status)).catch(() => {});
    load(); const timer = setInterval(load, 5000); return () => clearInterval(timer);
  }, [id]);
  const icon = { pending: '🟠', preparing: '🟡', served: '🟢', paid: '✅', cancelled: '❌' };
  return (
    <div className="max-w-md mx-auto p-6 text-center min-h-screen bg-stone-50">
      <div className="bg-white rounded-3xl shadow-sm p-6 mt-8">
        <div className="text-5xl mb-2">✅</div>
        <h2 className="text-2xl font-bold text-green-700 mb-1">{t('order_success')}</h2>
        <p className="text-stone-500">{t('order_no')}{id} — {cur}{Number(total).toFixed(2)}</p>
        <div className="mt-5 bg-stone-50 rounded-2xl p-4">
          <div className="text-2xl">{icon[st] || '🟠'}</div>
          <div className="font-bold text-lg mt-1">{t('st_' + st) || st}</div>
          <div className="text-stone-400 text-xs mt-1">{t('auto_update')}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button onClick={() => serviceCall('staff')} className="bg-white border border-stone-200 rounded-xl py-2.5 font-medium">🔔 {t('call_staff')}</button>
          <button onClick={() => serviceCall('bill')} className="bg-white border border-stone-200 rounded-xl py-2.5 font-medium">🧾 {t('request_bill')}</button>
        </div>
        <button onClick={onMore} className="w-full mt-3 bg-amber-700 text-white rounded-xl py-3 font-bold">{t('order_more')}</button>
      </div>
    </div>
  );
}
