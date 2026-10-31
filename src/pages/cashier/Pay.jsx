import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api';
import { useOnce } from '../../hooks/useOnce';
import { useShop } from '../../hooks/useShop';

const METHODS = [
  { id: 'cash', label: '💵 Cash' },
  { id: 'khqr', label: '📱 KHQR' },
  { id: 'aba', label: 'ABA' },
  { id: 'acleda', label: 'ACLEDA' },
  { id: 'card', label: 'Card' },
];

export default function Pay() {
  const { id } = useParams(); const nav = useNavigate();
  const shop = useShop(); const cur = shop.currency || '$';
  const [o, setO] = useState(null);
  const [method, setMethod] = useState('cash');
  const [recv, setRecv] = useState('');
  const [disc, setDisc] = useState({ value: '', type: 'amount' });
  const [khqr, setKhqr] = useState(null);
  const [split, setSplit] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => api.get(`/orders/${id}`).then(r => setO(r.data)), [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (method === 'khqr') api.get(`/orders/${id}/khqr`).then(r => setKhqr(r.data)).catch(() => setKhqr(null));
    else setKhqr(null);
  }, [method, id, o?.total]);

  const applyDiscount = useOnce(async () => {
    const v = parseFloat(disc.value);
    if (isNaN(v) || v < 0) return setMsg('បញ្ចូលចំនួនបញ្ចុះតម្លៃត្រឹមត្រូវ');
    await api.put(`/orders/${id}/discount`, { discount: v, discount_type: disc.type });
    setMsg('បានបញ្ចុះតម្លៃ'); setDisc({ value: '', type: disc.type }); load();
  });

  const pay = useOnce(async () => {
    if (method === 'cash') {
      const r = Number(recv);
      if (!r || r < Number(o.total)) return setMsg('ទឹកប្រាក់ទទួលមិនគ្រប់');
    }
    const { data } = await api.post('/payments', {
      order_id: Number(id), method,
      amount_received: method === 'cash' ? Number(recv) : Number(o.total),
    });
    nav(`/receipt/${id}`);
  });

  if (!o) return <p className="p-4 text-center text-stone-500">Loading...</p>;
  const change = method === 'cash' && recv ? Number(recv) - Number(o.total) : 0;

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-stone-50 pb-28">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-bold">💵 Order #{o.id} {o.table_no ? <span className="text-stone-400 text-base">· តុ {o.table_no}</span> : ''}</h1>
        <button onClick={() => setSplit(true)} className="text-xs bg-white border border-stone-200 px-3 py-1.5 rounded-lg font-semibold shadow-sm">✂️ បំបែកវិក្កយបត្រ</button>
      </div>

      {/* Items */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-3">
        {o.items.map(i => (
          <div key={i.id} className="flex justify-between py-1.5 border-b border-dashed border-stone-100 last:border-0">
            <div className="min-w-0">
              <div className="font-medium truncate">{i.name} × {i.qty}</div>
              {i.options && Object.keys(i.options).length > 0 &&
                <div className="text-xs text-stone-400">{Object.values(i.options).join(' · ')}</div>}
              {i.note && <div className="text-xs text-amber-700 italic">📝 {i.note}</div>}
            </div>
            <div className="font-semibold shrink-0 ml-2">{cur}{(i.price * i.qty).toFixed(2)}</div>
          </div>
        ))}
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>{cur}{Number(o.subtotal || o.total).toFixed(2)}</span></div>
          {Number(o.discount) > 0 && <div className="flex justify-between text-red-600"><span>បញ្ចុះតម្លៃ</span><span>−{cur}{Number(o.discount).toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-lg pt-1 border-t"><span>សរុប</span><span className="text-amber-700">{cur}{Number(o.total).toFixed(2)}</span></div>
        </div>
      </div>

      {/* Discount */}
      {o.status !== 'paid' && (
        <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-500">បញ្ចុះតម្លៃ</span>
          <div className="flex rounded-lg overflow-hidden border border-stone-200">
            <button onClick={() => setDisc(d => ({ ...d, type: 'amount' }))} className={`px-2 text-sm ${disc.type === 'amount' ? 'bg-amber-700 text-white' : 'bg-white'}`}>{cur}</button>
            <button onClick={() => setDisc(d => ({ ...d, type: 'percent' }))} className={`px-2 text-sm ${disc.type === 'percent' ? 'bg-amber-700 text-white' : 'bg-white'}`}>%</button>
          </div>
          <input type="number" inputMode="decimal" placeholder="0" value={disc.value}
            onChange={e => setDisc(d => ({ ...d, value: e.target.value }))}
            className="flex-1 min-w-0 border border-stone-200 rounded-lg px-2 py-1.5 text-sm" />
          <button onClick={applyDiscount} className="bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">អនុវត្ត</button>
        </div>
      )}

      {/* Methods */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {METHODS.map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            className={`p-2.5 rounded-xl font-bold text-sm shadow-sm transition ${method === m.id ? 'bg-amber-700 text-white' : 'bg-white text-stone-700'}`}>{m.label}</button>
        ))}
      </div>

      {/* KHQR */}
      {method === 'khqr' && khqr && (
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 text-center">
          <div className="inline-block p-3 bg-white border-2 border-stone-100 rounded-2xl">
            {khqr.image
              ? <img src={khqr.image} alt="KHQR" className="w-[200px] h-[200px] object-contain" />
              : <QRCodeSVG value={khqr.qr} size={200} level="M" />}
          </div>
          <p className="font-bold text-lg mt-2">{cur}{Number(khqr.amount).toFixed(2)}</p>
          <p className="text-xs text-stone-400">ស្កេនដើម្បីបង់តាម ABA/Bakong app រួចបញ្ជាក់ខាងក្រោម</p>
          {khqr.note && <p className="text-[11px] text-amber-600 mt-1">⚠️ {khqr.note}</p>}
        </div>
      )}

      {/* Cash */}
      {method === 'cash' && (
        <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
          <input type="number" inputMode="decimal" placeholder="ទឹកប្រាក់ទទួល $" className="w-full border border-stone-200 rounded-xl p-3 text-lg"
            value={recv} onChange={e => setRecv(e.target.value)} />
          {recv && <p className="mt-2 text-center font-bold text-green-700">អាប់ដាច់: {cur}{Math.max(0, change).toFixed(2)}</p>}
        </div>
      )}

      {msg && <p className="text-center text-sm text-red-600 mb-2">{msg}</p>}

      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto p-3 bg-stone-50">
        <button onClick={pay} className="w-full bg-green-700 text-white p-3.5 rounded-2xl font-bold text-lg shadow-lg active:scale-[.98] transition">
          ✅ Confirm ទូទាត់ — {cur}{Number(o.total).toFixed(2)}
        </button>
      </div>

      {split && <SplitModal order={o} cur={cur} onClose={() => setSplit(false)} onDone={(childId) => { setSplit(false); nav(`/cashier/pay/${childId}`); }} />}
    </div>
  );
}

function SplitModal({ order, cur, onClose, onDone }) {
  const [sel, setSel] = useState([]);
  const toggle = (iid) => setSel(s => s.includes(iid) ? s.filter(x => x !== iid) : [...s, iid]);
  const submit = useOnce(async () => {
    if (!sel.length) return;
    const { data } = await api.post(`/orders/${order.id}/split`, { item_ids: sel });
    onDone(data.child_id);
  });
  const selTotal = order.items.filter(i => sel.includes(i.id)).reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">✂️ បំបែកវិក្កយបត្រ</h3>
          <button onClick={onClose} className="text-stone-400 text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-stone-400 px-4 pt-2">ជ្រើសមុខទំនិញដែលចង់បំបែកទៅវិក្កយបត្រថ្មី (ត្រូវនៅសល់យ៉ាងតិច ១ មុខក្នុង order ដើម)។</p>
        <div className="p-4 space-y-2">
          {order.items.map(i => (
            <label key={i.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${sel.includes(i.id) ? 'border-amber-600 bg-amber-50' : 'border-stone-200'}`}>
              <input type="checkbox" checked={sel.includes(i.id)} onChange={() => toggle(i.id)} className="w-5 h-5 accent-amber-700" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{i.name} × {i.qty}</div>
                {i.options && Object.keys(i.options).length > 0 && <div className="text-xs text-stone-400">{Object.values(i.options).join(' · ')}</div>}
              </div>
              <div className="font-semibold">{cur}{(i.price * i.qty).toFixed(2)}</div>
            </label>
          ))}
        </div>
        <div className="sticky bottom-0 bg-white border-t p-3">
          <button onClick={submit} disabled={!sel.length}
            className="w-full bg-amber-700 text-white rounded-xl py-3 font-bold disabled:opacity-40">
            បំបែក {sel.length} មុខ — {cur}{selTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
