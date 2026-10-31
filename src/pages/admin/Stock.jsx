import { useEffect, useState } from 'react';
import api from '../../api';

const FILTERS = [['alert', 'ត្រូវបន្ថែម'], ['out', 'អស់ស្តុក'], ['low', 'ស្តុកទាប'], ['all', 'ទាំងអស់']];
const STATUS = {
  out: ['អស់ស្តុក', 'bg-red-100 text-red-700'],
  low: ['ស្តុកទាប', 'bg-amber-100 text-amber-700'],
  ok: ['គ្រប់គ្រាន់', 'bg-green-100 text-green-700'],
  untracked: ['អត់តាមដាន', 'bg-stone-100 text-stone-500'],
};

export default function Stock() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('alert');
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get('/admin/stock', { params: { filter } }).then(r => setRows(r.data)).catch(() => setRows([]));
  useEffect(() => { load(); }, [filter]);

  const restock = async (p, delta) => {
    const cur = p.stock_qty === null ? 0 : Number(p.stock_qty);
    const next = Math.max(0, cur + delta);
    setBusyId(p.id);
    await api.put('/admin/stock', { id: p.id, stock_qty: next }).catch(() => {});
    setBusyId(null);
    load();
  };
  const setQty = async (p, val) => {
    setBusyId(p.id);
    await api.put('/admin/stock', { id: p.id, stock_qty: val === '' ? null : Number(val) }).catch(() => {});
    setBusyId(null);
    load();
  };
  const toggleAvail = async (p) => {
    setBusyId(p.id);
    await api.put('/admin/stock', { id: p.id, is_available: p.is_available ? 0 : 1 }).catch(() => {});
    setBusyId(null);
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">គ្រប់គ្រងស្តុក</h1>
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-4 w-fit flex-wrap">
        {FILTERS.map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === f ? 'bg-white shadow text-amber-700' : 'text-stone-500'}`}>{l}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs">
            <tr>
              <th className="text-left p-3">ទំនិញ</th>
              <th className="text-left p-3">ប្រភេទ</th>
              <th className="text-center p-3">ស្ថានភាព</th>
              <th className="text-center p-3">ស្តុក</th>
              <th className="text-center p-3">បន្ថែម/បន្ថយ</th>
              <th className="text-center p-3">ការលក់</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const [sl, sc] = STATUS[p.status] || STATUS.untracked;
              return (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-stone-500">{p.category || '—'}</td>
                  <td className="p-3 text-center"><span className={`text-[11px] px-2 py-0.5 rounded-full ${sc}`}>{sl}</span></td>
                  <td className="p-3 text-center">
                    <input type="number" value={p.stock_qty ?? ''} placeholder="—"
                      onChange={e => setQty(p, e.target.value)} disabled={busyId === p.id}
                      className="w-20 border border-stone-200 rounded-lg px-2 py-1 text-center bg-stone-50" />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => restock(p, -1)} disabled={busyId === p.id} className="w-8 h-8 rounded-lg bg-stone-100 font-bold disabled:opacity-40">−</button>
                      <button onClick={() => restock(p, 1)} disabled={busyId === p.id} className="w-8 h-8 rounded-lg bg-stone-100 font-bold text-amber-700 disabled:opacity-40">+</button>
                      <button onClick={() => restock(p, 10)} disabled={busyId === p.id} className="px-2 h-8 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold disabled:opacity-40">+10</button>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleAvail(p)} disabled={busyId === p.id}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.is_available ? 'មានលក់' : 'បិទលក់'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={6} className="p-8 text-center text-stone-400">គ្មានទំនិញក្នុងបញ្ជីនេះ 🎉</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-400 mt-2">ចំណាំ: ស្តុកទទេ (—) មានន័យថាមិនតាមដានស្តុក — ទំនិញនឹងមិនបង្ហាញ «អស់ស្តុក» ទេ។</p>
    </div>
  );
}
