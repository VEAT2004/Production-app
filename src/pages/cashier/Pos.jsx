import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext.jsx';
import { useOnce, newIdemKey } from '../../hooks/useOnce';
import { useShop } from '../../hooks/useShop';
import { playChime, notify, ensureNotifyPermission } from '../../sound';

const STATUS_LABEL = { pending: 'រងចាំ', preparing: 'កំពុងរៀបចំ', served: 'បានបម្រើ', paid: 'ជោគជ័យ' };
const NEXT = { pending: 'preparing', preparing: 'served' };
const COLS = [['pending', 'រងចាំ', 'bg-amber-500'], ['preparing', 'កំពុងរៀបចំ', 'bg-blue-500'], ['served', 'បានបម្រើ', 'bg-emerald-500']];

function Thumb({ src, name, cls = 'w-full h-24' }) {
  if (src) return <img src={src} alt={name} className={`${cls} object-contain rounded-t-xl bg-stone-100`} loading="lazy" />;
  return <div className={`${cls} rounded-t-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-3xl`}>☕</div>;
}

function unitPrice(product, options) {
  let p = Number(product.price) || 0;
  const cfg = product.options || {};
  for (const g of Object.keys(options || {})) {
    const hit = (cfg[g] || []).find(c => c.label === options[g]);
    if (hit) p += Number(hit.add) || 0;
  }
  return Math.round(p * 100) / 100;
}

export default function Pos() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const shop = useShop();
  const cur = shop.currency || '$';

  const [mode, setMode] = useState('pos');            // 'pos' | 'orders'
  const [menu, setMenu] = useState(null);
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState('');
  const [cat, setCat] = useState('all');
  const [lines, setLines] = useState([]);
  const [editing, setEditing] = useState(null);
  const idemKey = useRef(newIdemKey()).current;
  const seq = useRef(1);

  const [orders, setOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [sel, setSel] = useState(null);               // selected order id (orders mode)
  const [detail, setDetail] = useState(null);
  const [sound, setSound] = useState(() => localStorage.getItem('sound') !== '0');
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(new Date());
  const seenOrders = useRef(null);
  const seenCalls = useRef(null);

  useEffect(() => {
    fetch('/api/menu/public').then(r => r.json()).then(setMenu).catch(() => {});
    api.get('/tables').then(r => setTables(r.data)).catch(() => setTables([]));
    ensureNotifyPermission();
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const load = async () => {
    try {
      const [o, c] = await Promise.all([
        api.get('/cashier/orders'),
        api.get('/service-calls?status=new').catch(() => ({ data: [] })),
      ]);
      const oIds = new Set(o.data.map(x => x.id));
      const cIds = new Set(c.data.map(x => x.id));
      if (seenOrders.current !== null) {
        const fresh = o.data.filter(x => !seenOrders.current.has(x.id));
        if (fresh.length && sound) {
          playChime('order');
          notify('Order ថ្មី!', fresh.map(f => `#${f.id} ${f.table_no ? 'តុ ' + f.table_no : ''}`).join(', '));
          setToast(`🔔 Order ថ្មី: ${fresh.map(f => '#' + f.id).join(', ')}`);
          setTimeout(() => setToast(''), 4000);
        }
      }
      if (seenCalls.current !== null) {
        const freshCalls = c.data.filter(x => !seenCalls.current.has(x.id));
        if (freshCalls.length && sound) {
          playChime('call');
          notify(freshCalls[0].type === 'bill' ? 'សុំវិក្កយបត្រ' : 'ហៅបុគ្គលិក',
            freshCalls.map(f => `${f.type === 'bill' ? '🧾' : '🔔'} តុ ${f.table_no || '?'}`).join(', '));
        }
      }
      seenOrders.current = oIds;
      seenCalls.current = cIds;
      setOrders(o.data);
      setCalls(c.data);
    } catch { /* transient */ }
  };
  useEffect(() => { load(); const t = setInterval(load, 7000); return () => clearInterval(t); }, [sound]);

  useEffect(() => {
    if (mode !== 'orders' || !sel) { setDetail(null); return; }
    api.get(`/orders/${sel}`).then(r => setDetail(r.data)).catch(() => setDetail(null));
  }, [mode, sel]);

  const total = useMemo(() => lines.reduce((s, l) => s + l.unit * l.qty, 0), [lines]);
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const saveLine = (product, qty, options, note, lineKey) => {
    const unit = unitPrice(product, options);
    if (lineKey) setLines(ls => ls.map(l => l.key === lineKey ? { ...l, qty, options, note, unit } : l));
    else setLines(ls => [...ls, { key: 'l' + (seq.current++), product, qty, options, note, unit }]);
    setEditing(null);
  };
  const changeQty = (key, d) => setLines(ls => ls.map(l => l.key === key ? { ...l, qty: Math.max(0, l.qty + d) } : l).filter(l => l.qty > 0));
  const removeLine = (key) => setLines(ls => ls.filter(l => l.key !== key));

  const submit = useOnce(async () => {
    const items = lines.map(l => ({ product_id: l.product.id, qty: l.qty, options: l.options, note: l.note || undefined }));
    if (!items.length) return;
    const { data } = await api.post('/orders', { items, table_id: tableId || null, idempotency_key: idemKey, order_type: 'direct' });
    setLines([]); setTableId('');
    nav(`/cashier/pay/${data.order_id}`);
  });

  const toggleSound = () => { const v = !sound; setSound(v); localStorage.setItem('sound', v ? '1' : '0'); if (v) playChime('order'); };
  const setStatus = async (o, status) => { await api.put(`/orders/${o.id}/status`, { status }); load(); if (sel === o.id) setDetail(d => d ? { ...d, status } : d); };
  const [confirmCancel, setConfirmCancel] = useState(null);
  const doCancel = async (o) => {
    await api.put(`/orders/${o.id}/status`, { status: 'cancelled' });
    if (sel === o.id) setSel(null);
    setConfirmCancel(null);
    load();
  };
  const resolveCall = async (c) => { await api.put('/service-calls', { id: c.id, status: 'done' }); load(); };

  const cats = menu?.categories || [];
  const prods = (menu?.products || []).filter(p => cat === 'all' || p.category_id === Number(cat));
  const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-stone-100">
      {/* ===== TOP BAR ===== */}
      <header className="shrink-0 bg-stone-900 text-white px-3 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {shop.shop_logo
            ? <img src={shop.shop_logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
            : <span className="w-8 h-8 grid place-items-center rounded-lg bg-amber-600 text-lg">☕</span>}
          <div className="leading-tight hidden sm:block">
            <div className="font-bold text-sm truncate">{shop.shop_name}</div>
            <div className="text-[10px] text-stone-400">POS TERMINAL</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-stone-800 rounded-xl p-1">
          <button onClick={() => setMode('pos')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${mode === 'pos' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>🧾 POS</button>
          <button onClick={() => setMode('orders')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${mode === 'orders' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:bg-stone-700'}`}>
            📋 Orders
            {orders.length > 0 && <span className="text-[10px] bg-white/20 rounded-full px-1.5 py-0.5">{orders.length}</span>}
          </button>
          <button onClick={() => setMode('orders')} title="សំណើសេវា"
            className={`px-2.5 py-1.5 rounded-lg text-sm font-semibold relative ${calls.length ? 'bg-red-600 text-white animate-pulse' : 'text-stone-300 hover:bg-stone-700'}`}>
            🔔{calls.length > 0 && <span className="ml-1 text-[10px]">{calls.length}</span>}
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-lg font-bold tabular-nums text-amber-400 hidden md:block">{clock}</span>
          <button onClick={toggleSound} title="បិទ/បើកសំឡេង"
            className={`w-9 h-9 rounded-lg text-base ${sound ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-400'}`}>
            {sound ? '🔔' : '🔕'}
          </button>
          <span className="text-sm text-stone-300 hidden sm:block">{user?.name || 'Cashier'}</span>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10 hover:border-red-400/70 text-sm font-semibold"><span className="leading-none">⏻</span> Logout</button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* CENTER */}
        <div className="flex-1 lg:overflow-auto p-3">
          {mode === 'pos' ? (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                <button onClick={() => setCat('all')}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${cat === 'all' ? 'bg-amber-700 text-white' : 'bg-white text-stone-600'}`}>ទាំងអស់</button>
                {cats.map(c => (
                  <button key={c.id} onClick={() => setCat(c.id)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${cat === c.id ? 'bg-amber-700 text-white' : 'bg-white text-stone-600'}`}>{c.name}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {prods.map(p => {
                  const soldOut = p.in_stock === false;
                  return (
                    <button key={p.id} disabled={soldOut} onClick={() => setEditing({ product: p, lineKey: null })}
                      className={`bg-white rounded-xl shadow-sm overflow-hidden text-left border border-stone-100 transition ${soldOut ? 'opacity-50' : 'hover:shadow-md active:scale-[.97]'}`}>
                      <Thumb src={p.image} name={p.name} />
                      <div className="p-2.5">
                        <div className="font-semibold text-sm truncate">{p.name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-amber-700 font-bold text-sm">{cur}{Number(p.price).toFixed(2)}</span>
                          {p.options && Object.keys(p.options).length > 0 && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">ជម្រើស</span>}
                        </div>
                        {soldOut && <div className="text-[10px] text-red-600 mt-1">អស់ស្តុក</div>}
                      </div>
                    </button>
                  );
                })}
                {!prods.length && <p className="text-stone-400 col-span-full text-center py-10">គ្មានទំនិញក្នុងប្រភេទនេះ</p>}
              </div>
            </>
          ) : (
            <>
              {calls.length > 0 && (
                <div className="mb-3 grid sm:grid-cols-2 gap-2">
                  {calls.map(c => (
                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl shadow-sm border-l-4 ${c.type === 'bill' ? 'bg-blue-50 border-blue-500' : 'bg-amber-50 border-amber-500'}`}>
                      <div className="text-sm">
                        <b>{c.type === 'bill' ? '🧾 សុំវិក្កយបត្រ' : '🔔 ហៅបុគ្គលិក'}</b>
                        <span className="text-stone-500"> — តុ {c.table_no || '?'}</span>
                      </div>
                      <button onClick={() => resolveCall(c)} className="bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-sm font-semibold">✓ រួចរាល់</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                {COLS.map(([st, label, dot]) => {
                  const list = orders.filter(o => o.status === st);
                  return (
                    <div key={st} className="bg-stone-200/60 rounded-2xl p-2">
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        <span className="font-bold text-sm text-stone-700">{label}</span>
                        <span className="ml-auto text-xs bg-white rounded-full px-2 py-0.5 text-stone-500">{list.length}</span>
                      </div>
                      <div className="space-y-2 min-h-[80px]">
                        {list.map(o => (
                          <button key={o.id} onClick={() => setSel(o.id)}
                            className={`w-full text-left bg-white rounded-xl p-3 shadow-sm border-2 transition ${sel === o.id ? 'border-amber-500' : 'border-transparent hover:border-stone-300'}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold">#{o.id}</span>
                              <span className="text-amber-700 font-bold text-sm">{cur}{Number(o.total).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                              <span>{o.table_no ? 'តុ ' + o.table_no : 'ផ្ទាល់'}</span>
                              {Number(o.discount) > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">−{cur}{Number(o.discount).toFixed(2)}</span>}
                            </div>
                            {o.customer_name && (
                              <div className="mt-1 text-xs font-semibold text-stone-700 truncate">👤 {o.customer_name}</div>
                            )}
                          </button>
                        ))}
                        {!list.length && <p className="text-center text-stone-400 text-xs py-6">ទទេ</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL */}
        <aside className="shrink-0 w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col lg:overflow-hidden">
          {mode === 'pos' ? (
            <>
              <div className="p-3 border-b border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold">🛒 កន្ត្រក <span className="text-stone-400 text-sm">({count})</span></h2>
                  {lines.length > 0 && <button onClick={() => setLines([])} className="text-xs text-red-500">សម្អាត</button>}
                </div>
                <select className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-sm" value={tableId} onChange={e => setTableId(e.target.value)}>
                  <option value="">— គ្មានតុ (Take away) —</option>
                  {tables.map(t => <option key={t.id} value={t.id}>តុ {t.table_no}</option>)}
                </select>
              </div>
              <div className="flex-1 lg:overflow-auto p-3">
                {lines.length === 0 && <p className="text-stone-400 text-center py-10 text-sm">ជ្រើសទំនិញដើម្បីចាប់ផ្តើម</p>}
                {lines.map(l => (
                  <div key={l.key} className="flex gap-2 items-start bg-stone-50 rounded-xl p-2.5 mb-2">
                    <img src={l.product.image} alt="" className="w-11 h-11 rounded-lg object-contain bg-stone-200 shrink-0"
                      onError={e => { e.target.style.visibility = 'hidden'; }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{l.product.name}</div>
                      {Object.keys(l.options || {}).length > 0 && <div className="text-[11px] text-stone-400 truncate">{Object.values(l.options).join(' · ')}</div>}
                      {l.note && <div className="text-[11px] text-amber-700 italic truncate">📝 {l.note}</div>}
                      <div className="text-amber-700 font-bold text-sm">{cur}{(l.unit * l.qty).toFixed(2)}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 bg-white rounded-full border border-stone-200 px-1">
                        <button onClick={() => changeQty(l.key, -1)} className="w-6 h-6 font-bold text-stone-500">−</button>
                        <span className="w-5 text-center text-sm font-bold">{l.qty}</span>
                        <button onClick={() => changeQty(l.key, 1)} className="w-6 h-6 font-bold text-amber-700">+</button>
                      </div>
                      <button onClick={() => setEditing({ product: l.product, lineKey: l.key })} className="text-[10px] text-stone-400 underline">កែ</button>
                      <button onClick={() => removeLine(l.key)} className="text-[10px] text-red-400">លុប</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-stone-100">
                <div className="flex justify-between font-bold text-lg mb-2"><span>សរុប</span><span className="text-amber-700">{cur}{total.toFixed(2)}</span></div>
                <button onClick={submit} disabled={!lines.length}
                  className="w-full bg-amber-700 text-white rounded-xl py-3 font-bold disabled:opacity-40 active:scale-[.98] transition">
                  បង្កើត Order → ទូទាត់
                </button>
              </div>
            </>
          ) : (
            <OrderDetail detail={detail} cur={cur} sel={sel}
              onPay={(id) => nav(`/cashier/pay/${id}`)}
              onStatus={setStatus} onCancel={setConfirmCancel}
              onClose={() => setSel(null)} />
          )}
        </aside>
      </div>

      {editing && (
        <Customize product={editing.product} lineKey={editing.lineKey} existing={lines.find(l => l.key === editing.lineKey)}
          cur={cur} onClose={() => setEditing(null)} onSave={saveLine} />
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={() => setConfirmCancel(null)}>
          <div className="pop-in w-full max-w-xs card p-5 text-center" onMouseDown={(e) => e.stopPropagation()}>
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="font-bold mb-1">បោះបង់ Order #{confirmCancel.id}?</h3>
            <p className="text-sm text-stone-500 mb-4">សកម្មភាពនេះមិនអាចត្រឡប់វិញទេ។</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmCancel(null)} className="flex-1 py-2 rounded-lg border border-stone-200 font-semibold text-stone-600">ទេ</button>
              <button onClick={() => doCancel(confirmCancel)} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold">បោះបង់</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 inset-x-0 max-w-md mx-auto px-6 z-40">
          <div className="bg-stone-800 text-white text-sm text-center rounded-xl py-3 px-4 shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}

function OrderDetail({ detail, cur, sel, onPay, onStatus, onCancel, onClose }) {
  if (!sel) return <div className="flex-1 grid place-items-center p-6 text-center text-stone-400 text-sm">ជ្រើសរើស order មួយពី board<br />ដើម្បីមើលលម្អិត</div>;
  if (!detail) return <div className="flex-1 grid place-items-center p-6 text-stone-400 text-sm">Loading...</div>;
  return (
    <div className="flex-1 flex flex-col lg:overflow-hidden">
      <div className="p-3 border-b border-stone-100 flex items-center justify-between">
        <div>
          <div className="font-bold">Order #{detail.id}</div>
          <div className="text-xs text-stone-500">{detail.table_no ? 'តុ ' + detail.table_no : 'ផ្ទាល់/Take away'} · {STATUS_LABEL[detail.status] || detail.status}</div>
          {detail.customer_name && (
            <div className="text-xs font-semibold text-stone-700 mt-0.5">👤 {detail.customer_name}</div>
          )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200">✕</button>
      </div>
      <div className="flex-1 lg:overflow-auto p-3 space-y-2">
        {(detail.items || []).map((it, i) => (
          <div key={i} className="flex justify-between text-sm bg-stone-50 rounded-lg p-2">
            <span className="min-w-0">
              <span className="truncate block">{it.qty}× {it.product_name || it.name}
                {it.options && Object.keys(it.options).length > 0 && <span className="text-[11px] text-stone-400"> ({Object.values(it.options).join(', ')})</span>}
              </span>
              {it.note && <span className="block text-[11px] text-amber-700 italic mt-0.5">📝 {it.note}</span>}
            </span>
            <span className="font-semibold shrink-0 ml-2">{cur}{(Number(it.price) * it.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-stone-100 space-y-2">
        {Number(detail.discount) > 0 && (
          <div className="flex justify-between text-sm text-red-600"><span>បញ្ចុះតម្លៃ</span><span>−{cur}{Number(detail.discount).toFixed(2)}</span></div>
        )}
        <div className="flex justify-between font-bold text-lg"><span>សរុប</span><span className="text-amber-700">{cur}{Number(detail.total).toFixed(2)}</span></div>
        {(detail.status === 'served' || detail.status === 'paid') ? (
          <>
            <div className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-xl py-3 font-bold">✅ កម្មង់រួចរាល់ — ជោគជ័យ</div>
            {detail.status === 'served'
              ? <button onClick={() => onPay(detail.id)} className="w-full bg-amber-700 text-white rounded-xl py-3 font-bold">💳 ទូទាត់</button>
              : <a href={`/receipt/${detail.id}`} target="_blank" rel="noreferrer" className="block w-full text-center bg-stone-800 text-white rounded-xl py-3 font-bold">🧾 វិក្កយបត្រ</a>}
          </>
        ) : (
          <>
            <button onClick={() => onPay(detail.id)} className="w-full bg-amber-700 text-white rounded-xl py-3 font-bold">💳 ទូទាត់</button>
            <div className="flex gap-2">
              {NEXT[detail.status] && (
                <button onClick={() => onStatus(detail, NEXT[detail.status])} className="flex-1 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-sm font-semibold">→ {STATUS_LABEL[NEXT[detail.status]]}</button>
              )}
              <button onClick={() => onCancel(detail)} className="flex-1 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold">✕ បោះបង់</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Customize({ product, lineKey, existing, cur, onClose, onSave }) {
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
          {product.image
            ? <img src={product.image} alt={product.name} className="w-full h-40 object-contain rounded-t-3xl bg-stone-100" />
            : <div className="w-full h-32 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-4xl rounded-t-3xl">☕</div>}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full text-stone-600 text-xl shadow">×</button>
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold">{product.name}</h3>
          {product.description && <p className="text-sm text-stone-500 mb-2">{product.description}</p>}
          {groups.map(g => (
            <div key={g} className="mt-3">
              <div className="text-sm font-semibold text-stone-600 mb-1.5 capitalize">{g}</div>
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
            <div className="text-sm font-semibold text-stone-600 mb-1.5">ចំណាំ</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="បន្ថែមចំណាំ..."
              className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-sm" />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3 bg-stone-100 rounded-full px-2 py-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 text-lg font-bold text-stone-600">−</button>
              <span className="w-6 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 text-lg font-bold text-amber-700">+</button>
            </div>
            <div className="font-bold text-amber-700 text-lg">{cur}{(unit * qty).toFixed(2)}</div>
          </div>
          <button onClick={() => onSave(product, qty, sel, note, lineKey)}
            className="w-full mt-4 bg-amber-700 text-white rounded-xl py-3 font-bold text-lg active:scale-[.98] transition">
            {lineKey ? 'កែជម្រើស' : 'បន្ថែមទៅកន្ត្រក'} · {cur}{(unit * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
