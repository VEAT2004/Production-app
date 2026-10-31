import { useEffect, useState } from 'react';
import api from '../../api';

const GROUPS = [['day', 'តាមថ្ងៃ'], ['month', 'តាមខែ'], ['product', 'តាមទំនិញ']];

function fmt(n) { return Number(n || 0).toFixed(2); }

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const [group, setGroup] = useState('day');
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setBusy(true);
    api.get('/admin/reports', { params: { group, from, to } })
      .then(r => setData(r.data)).catch(() => setData(null)).finally(() => setBusy(false));
  };
  useEffect(() => { load(); }, [group, from, to]);

  const exportExcel = async () => {
    try {
      const res = await api.get('/admin/reports/export', { params: { group, from, to }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-${group}-${from}_to_${to}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export បរាជ័យ'); }
  };

  const series = data?.series || [];
  const maxRev = Math.max(1, ...series.map(s => Number(s.revenue || 0)));
  const isProduct = group === 'product';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-xl font-bold">របាយការណ៍លក់</h1>
        <button onClick={exportExcel} className="bg-green-700 text-white px-4 py-2 rounded-xl font-bold shadow text-sm">
          ⬇ Export to Excel
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-3 rounded-xl shadow-sm mb-4 flex flex-wrap items-end gap-3">
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          {GROUPS.map(([g, l]) => (
            <button key={g} onClick={() => setGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${group === g ? 'bg-white shadow text-amber-700' : 'text-stone-500'}`}>{l}</button>
          ))}
        </div>
        <label className="text-sm">
          <span className="block text-xs text-stone-500 mb-1">ពីថ្ងៃ</span>
          <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
            className="border border-stone-200 rounded-lg p-2 bg-stone-50" />
        </label>
        <label className="text-sm">
          <span className="block text-xs text-stone-500 mb-1">ដល់ថ្ងៃ</span>
          <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)}
            className="border border-stone-200 rounded-lg p-2 bg-stone-50" />
        </label>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card label="ចំណូលសរុប" value={`$${fmt(data.summary.revenue)}`} accent />
          <Card label="ចំនួន Order" value={data.summary.orders} />
          <Card label="មធ្យមភាគ/Order" value={`$${fmt(data.summary.avg_order)}`} />
          <Card label="បញ្ចុះតម្លៃសរុប" value={`$${fmt(data.summary.discounts)}`} />
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <h3 className="font-bold mb-3 text-sm text-stone-600">{isProduct ? 'ចំណូលតាមទំនិញ' : 'ចំណូលតាមពេលវេលា'}</h3>
        {busy && <p className="text-stone-400 text-sm">Loading…</p>}
        {!busy && !series.length && <p className="text-stone-400 text-sm py-6 text-center">គ្មានទិន្នន័យក្នុងអំឡុងពេលនេះ</p>}
        {!busy && series.length > 0 && (
          <div className="space-y-2">
            {series.map((s, i) => {
              const label = isProduct ? s.name : s.period;
              const rev = Number(s.revenue || 0);
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-28 shrink-0 text-xs text-stone-600 truncate">{label}</div>
                  <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(8, (rev / maxRev) * 100)}%` }}>
                      <span className="text-[10px] text-white font-bold">${fmt(rev)}</span>
                    </div>
                  </div>
                  {!isProduct && <div className="w-16 text-right text-xs text-stone-400">{s.orders} order</div>}
                  {isProduct && <div className="w-16 text-right text-xs text-stone-400">{s.qty} ឯកតា</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs">
            <tr>
              <th className="text-left p-3">{isProduct ? 'ទំនិញ' : (group === 'month' ? 'ខែ' : 'ថ្ងៃ')}</th>
              {!isProduct && <th className="text-right p-3">Orders</th>}
              {isProduct && <th className="text-right p-3">បរិមាណ</th>}
              <th className="text-right p-3">ចំណូល</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s, i) => (
              <tr key={i} className="border-t border-stone-100">
                <td className="p-3 font-medium">{isProduct ? s.name : s.period}</td>
                <td className="p-3 text-right text-stone-500">{isProduct ? s.qty : s.orders}</td>
                <td className="p-3 text-right font-bold text-amber-700">${fmt(s.revenue)}</td>
              </tr>
            ))}
            {!series.length && <tr><td colSpan={3} className="p-6 text-center text-stone-400">—</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div className={`p-4 rounded-xl shadow-sm ${accent ? 'bg-amber-700 text-white' : 'bg-white'}`}>
      <p className={`text-xs ${accent ? 'text-amber-100' : 'text-stone-500'}`}>{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
