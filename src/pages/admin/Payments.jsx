import { useEffect, useState } from 'react';
import api from '../../api';
export default function Payments() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/admin/payments').then(r=>setList(r.data)); }, []);
  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Payment History</h1>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-100"><tr><th className="p-2">#</th><th>តុ</th><th>Total</th><th>Method</th><th>Cashier</th><th>ពេល</th></tr></thead>
          <tbody>{list.map(p=>(
            <tr key={p.id} className="border-t"><td className="p-2">{p.order_id}</td><td>{p.table_no||'Direct'}</td>
            <td>${p.total}</td><td>{p.method}</td><td>{p.cashier}</td><td>{p.created_at}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
