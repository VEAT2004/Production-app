import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext.jsx';

const ROLE_BADGE = {
  owner:   'bg-amber-100 text-amber-800',
  admin:   'bg-indigo-100 text-indigo-700',
  cashier: 'bg-emerald-100 text-emerald-700',
};

export default function Accounts() {
  const { user } = useAuth();
  const [data, setData] = useState({ users: [], me: 0 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [create, setCreate] = useState(null);   // {username,full_name,role,password}
  const [reset, setReset] = useState(null);     // {id,username,password}

  const load = async () => {
    try { const { data: d } = await api.get('/owner/users'); setData(d); }
    catch (e) { setErr(e.response?.data?.error || e.message); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (u) => {
    setBusy(true); setErr('');
    try {
      await api.put('/owner/users', { id: u.id, is_active: u.is_active ? 0 : 1 });
      await load();
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  const submitCreate = async () => {
    setBusy(true); setErr('');
    try {
      await api.post('/owner/users', create);
      setCreate(null); await load();
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  const submitReset = async () => {
    setBusy(true); setErr('');
    try {
      await api.put('/owner/users', { id: reset.id, password: reset.password });
      setReset(null); await load();
    } catch (e) { setErr(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold">👥 គណនី Admin & Staff</h1>
          <p className="text-sm text-stone-500">គ្រប់គរងគណនីដែលចូលប្រព័ន្ធ — បង្កើត បិទ/បើក និង reset password</p>
        </div>
        <button onClick={() => setCreate({ username: '', full_name: '', role: 'cashier', password: '' })}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700">+ បង្កើតគណនី</button>
      </div>

      {err && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Username</th>
              <th className="text-left px-4 py-3">ឈ្មោះ</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">ស្ថានភាព</th>
              <th className="text-left px-4 py-3">បង្កើតនៅ</th>
              <th className="text-right px-4 py-3">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.users.map((u) => (
              <tr key={u.id} className={u.id === data.me ? 'bg-amber-50/60' : ''}>
                <td className="px-4 py-3 font-semibold">
                  {u.username}
                  {u.id === data.me && <span className="ml-2 text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full">អ្នក</span>}
                </td>
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                    {u.is_active ? 'កំពុងបើក' : 'បានបិទ'}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">{String(u.created_at || '').slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setReset({ id: u.id, username: u.username, password: '' })}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 font-semibold">🔑 Reset PW</button>
                    <button onClick={() => toggle(u)} disabled={busy || u.id === data.me}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold disabled:opacity-40 ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                      {u.is_active ? 'បិទ' : 'បើក'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {create && (
        <Modal title="បង្កើតគណនីថ្មី" onClose={() => setCreate(null)}>
          <div className="space-y-3">
            <L label="Username"><input className={INP} value={create.username} onChange={(e) => setCreate({ ...create, username: e.target.value })} placeholder="username" /></L>
            <L label="ឈ្មោះពេញ"><input className={INP} value={create.full_name} onChange={(e) => setCreate({ ...create, full_name: e.target.value })} placeholder="Full name" /></L>
            <L label="Role">
              <select className={INP} value={create.role} onChange={(e) => setCreate({ ...create, role: e.target.value })}>
                <option value="cashier">cashier</option>
                <option value="admin">admin</option>
              </select>
            </L>
            <L label="Password (≥6)"><input type="password" className={INP} value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} placeholder="••••••" /></L>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setCreate(null)} className="flex-1 py-2 rounded-lg border border-stone-200 font-semibold text-stone-600">បោះបង់</button>
              <button onClick={submitCreate} disabled={busy} className="flex-1 py-2 rounded-lg bg-amber-600 text-white font-semibold disabled:opacity-50">បង្កើត</button>
            </div>
          </div>
        </Modal>
      )}

      {reset && (
        <Modal title={`🔑 Reset password — ${reset.username}`} onClose={() => setReset(null)}>
          <div className="space-y-3">
            <L label="Password ថ្មី (≥6)"><input type="password" autoFocus className={INP} value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} placeholder="••••••" /></L>
            <p className="text-xs text-stone-500">ការ reset នឹងលុប QR token ដែលកំពុងមានរបស់គណនីនេះ។</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setReset(null)} className="flex-1 py-2 rounded-lg border border-stone-200 font-semibold text-stone-600">បោះបង់</button>
              <button onClick={submitReset} disabled={busy || reset.password.length < 6} className="flex-1 py-2 rounded-lg bg-amber-600 text-white font-semibold disabled:opacity-50">Reset</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const INP = 'w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-200';

function L({ label, children }) {
  return <label className="block"><span className="block text-xs font-semibold text-stone-500 mb-1">{label}</span>{children}</label>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <div className="pop-in w-full max-w-sm card p-5" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
