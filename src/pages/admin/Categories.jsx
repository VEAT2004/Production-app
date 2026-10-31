import { useEffect, useState } from 'react';
import api from '../../api';
export default function Categories() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const load = () => api.get('/admin/categories').then(r=>setList(r.data));
  useEffect(() => { load(); }, []);
  const add = async () => { if(!name) return; await api.post('/admin/categories',{name}); setName(''); load(); };
  const del = async c => { await api.delete('/admin/categories',{data:{id:c.id}}); load(); };
  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-3">Categories</h1>
      <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-2">
        <input placeholder="ឈ្មោះ category ថ្មី" className="border p-2 rounded flex-1" value={name} onChange={e=>setName(e.target.value)}/>
        <button onClick={add} className="bg-amber-700 text-white px-4 rounded font-bold">+</button>
      </div>
      {list.map(c=>(
        <div key={c.id} className="bg-white p-3 rounded-xl shadow mb-2 flex justify-between">
          <span>{c.name}</span>
          <button onClick={()=>del(c)} className="text-red-600 text-sm">លុប</button>
        </div>
      ))}
    </div>
  );
}
