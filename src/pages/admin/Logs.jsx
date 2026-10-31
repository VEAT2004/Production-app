import { useEffect, useState } from 'react';
import api from '../../api';

const ACTION_LABEL = {
  'product.create': 'បង្កើតទំនិញ', 'product.update': 'កែទំនិញ', 'product.delete': 'លុបទំនិញ',
  'product.disable': 'បិទលក់ទំនិញ', 'stock.update': 'បញ្ចូលស្តុក', 'upload_image': 'បញ្ចូលរូបភាព',
  'order.status': 'ប្តូរស្ថានភាព order', 'order.cancel': 'បោះបង់ order', 'order.delete': 'លុប order',
  'payment.create': 'ទូទាត់', 'settings.update': 'កែការកំណត់',
};

export default function Logs() {
  const [data, setData] = useState({ logs: [], total: 0 });
  const [action, setAction] = useState('');
  const [limit] = useState(100);

  const load = () => api.get('/admin/logs', { params: { action: action || undefined, limit } })
    .then(r => setData(r.data)).catch(() => setData({ logs: [], total: 0 }));
  useEffect(() => { load(); }, [action]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h1 className="text-xl font-bold">កំណត់ហេតុបុគ្គលិក</h1>
        <input value={action} onChange={e => setAction(e.target.value)} placeholder="ស្វែងរក action…"
          className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white w-48" />
      </div>
      <p className="text-xs text-stone-400 mb-3">សរុប {data.total} កំណត់ហេតុ (បង្ហាញ {data.logs.length} ថ្មីបំផុត)</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs">
            <tr>
              <th className="text-left p-3">ពេលវេលា</th>
              <th className="text-left p-3">បុគ្គលិក</th>
              <th className="text-left p-3">សកម្មភាព</th>
              <th className="text-left p-3">ព័ត៌មានលម្អិត</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map(l => (
              <tr key={l.id} className="border-t border-stone-100 align-top">
                <td className="p-3 text-stone-500 whitespace-nowrap text-xs">{new Date(l.created_at.replace(' ', 'T')).toLocaleString()}</td>
                <td className="p-3">
                  <span className="font-medium">{l.full_name || l.username || '—'}</span>
                  {l.role && <span className="ml-1 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">{l.role}</span>}
                </td>
                <td className="p-3"><span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full">{ACTION_LABEL[l.action] || l.action}</span></td>
                <td className="p-3 text-stone-600 text-xs">{l.detail}</td>
              </tr>
            ))}
            {!data.logs.length && <tr><td colSpan={4} className="p-8 text-center text-stone-400">មិនមានកំណត់ហេតុ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
