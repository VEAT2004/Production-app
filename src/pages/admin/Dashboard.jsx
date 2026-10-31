import { useEffect, useState } from 'react';
import api from '../../api';
export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/admin/dashboard').then(r=>setD(r.data)); }, []);
  if (!d) return <p>Loading...</p>;
  const Card = ({t,v}) => <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex-1 min-w-[150px]">
    <p className="text-stone-500 text-sm font-medium">{t}</p>
    <p className="text-3xl font-extrabold tracking-tight tabular-nums mt-1">{v}</p></div>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Overview</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <Card t="ចំណូលថ្ងៃនេះ" v={`$${d.today_revenue}`}/>
        <Card t="Order ថ្ងៃនេះ" v={d.today_orders}/>
        <Card t="កំពុងរងចាំ" v={d.pending}/>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="font-bold mb-2 text-lg">ទំនិញលក់ដាច់បំផុត</h3>
          {d.top_products.map(p=><p key={p.name} className="py-2 border-b border-stone-100 last:border-0 text-[15px]">{p.name} — <b className="tabular-nums">{p.qty}</b></p>)}
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
          <h3 className="font-bold mb-2 text-lg">Order ថ្មីៗ</h3>
          {d.recent_orders.map(o=><p key={o.id} className="py-2 border-b border-stone-100 last:border-0 text-[15px]">#{o.id} {o.table_no||'Direct'} ${o.total} <b>{o.status}</b></p>)}
        </div>
      </div>
    </div>
  );
}
