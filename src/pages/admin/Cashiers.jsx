import { useEffect, useState } from 'react';
import api from '../../api';
import { QRCodeSVG } from 'qrcode.react';
export default function Cashiers() {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ username:'', password:'', full_name:'' });
  const load = () => api.get('/admin/cashiers').then(r=>setList(r.data));
  useEffect(() => { load(); }, []);
  const add = async () => { await api.post('/admin/cashiers', f); setF({username:'',password:'',full_name:''}); load(); };
  const [staffQR, setStaffQR] = useState(null);
  const genQR = async c => {
    const { data } = await api.post('/admin/staff-qr', { user_id: c.id });
    setStaffQR({ name: c.full_name, token: data.qr_token });
  };
  const del = async c => {
    const pin = prompt('Owner PIN (សម្រាប់ action សំខាន់):');
    await api.delete('/admin/cashiers', { data: { id: c.id, owner_pin: pin } }); load();
  };
  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Cashiers</h1>
      <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-wrap gap-2">
        <input placeholder="Username" className="border p-2 rounded" value={f.username} onChange={e=>setF({...f,username:e.target.value})}/>
        <input placeholder="Password" type="password" className="border p-2 rounded" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
        <input placeholder="ឈ្មោះពេញ" className="border p-2 rounded" value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/>
        <button onClick={add} className="bg-amber-700 text-white px-4 rounded font-bold">+ បង្កើត</button>
      </div>
      {list.map(c=>(
        <div key={c.id} className="bg-white p-3 rounded-xl shadow mb-2 flex justify-between items-center">
          <span>{c.full_name} <span className="text-stone-400">(@{c.username})</span></span>
          <span>
            <button onClick={()=>genQR(c)} className="text-amber-700 text-sm mr-3">📱 Staff QR</button>
            <button onClick={()=>del(c)} className="text-red-600 text-sm">លុប</button>
          </span>
        </div>
      ))}
      {staffQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={()=>setStaffQR(null)}>
          <div className="bg-white p-6 rounded-2xl text-center" onClick={e=>e.stopPropagation()}>
            <p className="font-bold mb-2">📱 Staff QR — {staffQR.name}</p>
            <div className="flex justify-center"><QRCodeSVG value={staffQR.token} size={200}/></div>
            <p className="text-xs text-stone-500 mt-2">Expiry 60s • ប្រើបានតែ 1 ដង • Cashier scan ដើម្បី login</p>
          </div>
        </div>
      )}
    </div>
  );
}
