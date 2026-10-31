import { useEffect, useState } from 'react';
import api from '../../api';

const STATUS = {
  pending: ['រងចាំ', 'bg-amber-100 text-amber-800'],
  preparing: ['កំពុងរៀបចំ', 'bg-blue-100 text-blue-800'],
  served: ['បានបម្រើ', 'bg-green-100 text-green-800'],
  paid: ['រួចរាល់', 'bg-stone-200 text-stone-700'],
  cancelled: ['បោះបង់', 'bg-red-100 text-red-700'],
};
const NEXT = { pending: 'preparing', preparing: 'served', served: 'paid' };
const FILTERS = [['', 'ទាំងអស់'], ['pending', 'រងចាំ'], ['preparing', 'កំពុងរៀបចំ'], ['served', 'បានបម្រើ'], ['paid', 'រួចរាល់'], ['cancelled', 'បោះបង់']];

export default function Orders() {
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/admin/orders', { params: { status: status || undefined, limit: 100 } })
    .then(r => setRows(r.data)).catch(() => setRows([]));
  useEffect(() => { load(); }, [status]);

  const toggle = async (id) => {
    if (openId === id) { setOpenId(null); setDetail(null); return; }
    setOpenId(id); setDetail(null);
    const { data } = await api.get('/admin/orders', { params: { id } }).catch(() => ({ data: null }));
    setDetail(data);
  };

  const changeStatus = async (o, next) => {
    setBusy(true);
    await api.put(`/orders/${o.id}/status`, { status: next }).catch(e => alert(e.response?.data?.error || e.message));
    setBusy(false);
    load();
    if (openId === o.id) { const { data } = await api.get('/admin/orders', { params: { id: o.id } }); setDetail(data); }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Orders</h1>
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-4 w-fit flex-wrap">
        {FILTERS.map(([f, l]) => (
          <button key={f} onClick={() => setStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${status === f ? 'bg-white shadow text-amber-700' : 'text-stone-500'}`}>{l}</button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map(o => {
          const [sl, sc] = STATUS[o.status] || ['—', 'bg-stone-100'];
          const open = openId === o.id;
          return (
            <div key={o.id} className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
              <button onClick={() => toggle(o.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-stone-50">
                <div className="font-bold">#{o.id}</div>
                <div className="text-sm text-stone-500 w-24 shrink-0">{o.table_no ? 'តុ ' + o.table_no : (o.order_type === 'qr' ? 'QR' : 'ផ្ទាល់')}</div>
                <div className="flex-1 min-w-0 text-sm text-stone-600 truncate">{o.items_summary || `${o.item_count} ឯកតា`}</div>
                {Number(o.discount) > 0 && <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">−${Number(o.discount).toFixed(2)}</span>}
                <div className="text-amber-700 font-bold w-20 text-right">${Number(o.total).toFixed(2)}</div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${sc}`}>{sl}</span>
                <span className="text-stone-400">{open ? '▲' : '▼'}</span>
              </button>

              {open && (
                <div className="border-t border-stone-100 p-3 bg-stone-50">
                  <div className="text-xs text-stone-500 mb-2">
                    បង្កើត: {new Date(o.created_at.replace(' ', 'T')).toLocaleString()}
                    {o.paid_at && <> · បង់: {new Date(o.paid_at.replace(' ', 'T')).toLocaleString()}</>}
                    {o.parent_id && <> · បំបែកពី #{o.parent_id}</>}
                  </div>
                  {!detail ? <p className="text-sm text-stone-400">Loading…</p> : (
                    <div className="bg-white rounded-lg border border-stone-100 divide-y divide-stone-100 mb-3">
                      {(detail.items || []).map(i => (
                        <div key={i.id} className="flex items-center gap-2 p-2.5 text-sm">
                          {i.image
                            ? <img src={i.image} alt="" className="w-9 h-9 rounded-lg object-contain bg-stone-100" />
                            : <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">☕</div>}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{i.name} × {i.qty}</div>
                            {i.options && <div className="text-[11px] text-stone-400 truncate">{Object.values(i.options).join(' · ')}</div>}
                            {i.note && <div className="text-[11px] text-amber-700 italic truncate">📝 {i.note}</div>}
                          </div>
                          <div className="font-semibold text-amber-700">${(Number(i.price) * i.qty).toFixed(2)}</div>
                        </div>
                      ))}
                      <div className="flex justify-between p-2.5 text-sm">
                        <span className="text-stone-500">Subtotal</span><span>${(Number(detail.subtotal) > 0 ? Number(detail.subtotal) : Number(detail.total) + Number(detail.discount || 0)).toFixed(2)}</span>
                      </div>
                      {Number(detail.discount) > 0 && (
                        <div className="flex justify-between p-2.5 text-sm text-red-600">
                          <span>បញ្ចុះតម្លៃ</span><span>−${Number(detail.discount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between p-2.5 font-bold">
                        <span>សរុប</span><span className="text-amber-700">${Number(detail.total).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {NEXT[o.status] && o.status !== 'paid' && (
                      <button disabled={busy} onClick={() => changeStatus(o, NEXT[o.status])}
                        className="text-xs bg-amber-700 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50">→ {STATUS[NEXT[o.status]][0]}</button>
                    )}
                    {o.status !== 'paid' && o.status !== 'cancelled' && (
                      <button disabled={busy} onClick={() => changeStatus(o, 'cancelled')}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50">✕ បោះបង់</button>
                    )}
                    {o.status === 'paid' && (
                      <a href={`/receipt/${o.id}`} target="_blank" rel="noreferrer"
                        className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg font-semibold">🧾 វិក្កយបត្រ</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!rows.length && <p className="text-stone-400 text-center py-10">មិនមាន order</p>}
      </div>
    </div>
  );
}
