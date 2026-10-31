import { useEffect, useState } from 'react';
import api from '../../api';

function Bar({ pct, color = 'bg-emerald-500' }) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${p}%` }} /></div>;
}

function Stat({ label, value, tone }) {
  const tones = { ok: 'text-emerald-600', warn: 'text-amber-600', bad: 'text-red-600', normal: 'text-stone-800' };
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-100">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tones[tone] || tones.normal}`}>{value}</p>
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-stone-100 last:border-0 text-sm">
      <span className="text-stone-500">{k}</span>
      <span className={`font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{v ?? '—'}</span>
    </div>
  );
}

export default function Overview() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [ago, setAgo] = useState(0);

  const load = () => api.get('/owner/status').then(r => { setD(r.data); setErr(''); setAgo(0); })
    .catch(e => setErr(e.response?.data?.error || e.message));
  useEffect(() => { load(); const t = setInterval(() => setAgo(a => a + 1), 1000); return () => clearInterval(t); }, []);

  if (err) return <div className="p-6"><p className="text-red-600">មិនអាចទាក់ទង server: {err}</p><button onClick={load} className="mt-2 bg-stone-800 text-white px-4 py-2 rounded-lg">ព្យាយាមម្តងទៀត</button></div>;
  if (!d) return <p className="p-6 text-stone-400">Loading server status…</p>;

  const s = d.server, db = d.database, st = d.stats;
  const diskPct = s.disk?.used_pct;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">🖥️ Server Status</h1>
          <p className="text-xs text-stone-400">ធ្វើបច្ចុប្បន្នភាព {ago}s មុន · {s.server_time}</p>
        </div>
        <button onClick={load} className="bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow">↻ Refresh</button>
      </div>

      {/* Alerts */}
      <div className="space-y-2 mb-4">
        {!s.db_ok && <Alert tone="bad">🔴 Database មិនអាចទាក់ទងបាន!</Alert>}
        {st.errors_24h > 0 && <Alert tone="warn">⚠️ មាន error {st.errors_24h} ក្នុង 24 ម៉ោងចុងក្រោយ — មើលផ្នែក Errors</Alert>}
        {st.low_stock > 0 && <Alert tone="warn">📉 ទំនិញ {st.low_stock} អស់ស្តុក ឬបិទលក់</Alert>}
        {st.open_service_calls > 0 && <Alert tone="info">🔔 សំណើអតិថិជន {st.open_service_calls} មិនទាន់ដោះស្រាយ</Alert>}
        {s.db_ok && st.errors_24h === 0 && st.low_stock === 0 && <Alert tone="ok">✅ ប្រព័ន្ធដំណើរការល្អ</Alert>}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Server */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-100">
          <h3 className="font-bold text-stone-700 mb-2">Server</h3>
          <Row k="Software" v={s.software} mono />
          <Row k="OS" v={s.os} />
          <Row k="PHP" v={s.php_version} mono />
          <Row k="Host" v={s.host} mono />
          <Row k="Timezone" v={s.timezone} mono />
          <Row k="Memory (PHP)" v={`${s.memory_usage_mb} MB`} />
          <Row k="Load avg" v={s.load_avg ? s.load_avg.join(' / ') : 'N/A'} mono />
          <div className="mt-3">
            <div className="flex justify-between text-xs text-stone-500 mb-1">
              <span>Disk បានប្រើ</span>
              <span>{diskPct != null ? `${diskPct}% · ${(s.disk.free_mb/1024).toFixed(1)}GB free / ${(s.disk.total_mb/1024).toFixed(1)}GB` : '—'}</span>
            </div>
            <Bar pct={diskPct} color={diskPct > 90 ? 'bg-red-500' : diskPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'} />
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-stone-100">
          <h3 className="font-bold text-stone-700 mb-2">Database</h3>
          <Row k="Status" v={s.db_ok ? <span className="text-emerald-600 font-bold">● Online</span> : <span className="text-red-600 font-bold">● Offline</span>} />
          <Row k="Version" v={s.db_version} mono />
          <Row k="Database" v={db.name} mono />
          <Row k="Tables" v={db.tables} />
          <Row k="Size" v={`${db.size_mb} MB`} />
        </div>
      </div>

      {/* Business stats */}
      <h3 className="font-bold text-stone-700 mb-2">ស្ថិតិអាជីវកម្ម</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="អ្នកប្រើ (active)" value={`${st.active_users}/${st.users}`} />
        <Stat label="ទំនិញ" value={st.products} />
        <Stat label="Order ថ្ងៃនេះ" value={st.orders_today} />
        <Stat label="ចំណូលថ្ងៃនេះ" value={`$${Number(st.revenue_today).toFixed(2)}`} tone="ok" />
        <Stat label="Errors 24h" value={st.errors_24h} tone={st.errors_24h > 0 ? 'bad' : 'ok'} />
        <Stat label="សំណើមិនទាន់ដោះ" value={st.open_service_calls} tone={st.open_service_calls > 0 ? 'warn' : 'ok'} />
        <Stat label="ស្តុកត្រូវបន្ថែម" value={st.low_stock} tone={st.low_stock > 0 ? 'warn' : 'ok'} />
      </div>
    </div>
  );
}

function Alert({ tone, children }) {
  const map = { bad: 'bg-red-50 text-red-700 border-red-200', warn: 'bg-amber-50 text-amber-800 border-amber-200', info: 'bg-blue-50 text-blue-700 border-blue-200', ok: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return <div className={`px-4 py-2.5 rounded-xl border text-sm font-medium ${map[tone]}`}>{children}</div>;
}
