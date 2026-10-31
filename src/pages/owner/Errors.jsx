import { useEffect, useState } from 'react';
import api from '../../api';

const LEVEL = {
  error: ['Error', 'bg-red-100 text-red-700 border-red-200'],
  warning: ['Warning', 'bg-amber-100 text-amber-800 border-amber-200'],
  info: ['Info', 'bg-blue-100 text-blue-700 border-blue-200'],
};
const FILTERS = [['', 'ទាំងអស់'], ['error', 'Error'], ['warning', 'Warning'], ['info', 'Info']];

export default function Errors() {
  const [data, setData] = useState({ logs: [], summary_7d: [] });
  const [level, setLevel] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);

  const load = () => api.get('/owner/errors', { params: { level: level || undefined, limit: 200 } })
    .then(r => setData(r.data)).catch(() => setData({ logs: [], summary_7d: [] }));
  useEffect(() => { load(); }, [level]);

  const clear = async (olderThanDays) => {
    const msg = olderThanDays ? `លុប error ចាស់ជាង ${olderThanDays} ថ្ងៃ?` : 'លុប error log ទាំងអស់?';
    if (!confirm(msg)) return;
    setBusy(true);
    await api.delete('/owner/errors', { data: olderThanDays ? { older_than_days: olderThanDays } : {} }).catch(() => {});
    setBusy(false);
    load();
  };

  const counts = Object.fromEntries((data.summary_7d || []).map(s => [s.level, s.c]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h1 className="text-xl font-bold">🐞 Error / Bug Monitor</h1>
        <div className="flex gap-2">
          <button onClick={() => clear(7)} disabled={busy} className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg font-semibold disabled:opacity-50">លុប &gt;7 ថ្ងៃ</button>
          <button onClick={() => clear(0)} disabled={busy} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-semibold disabled:opacity-50">លុបទាំងអស់</button>
        </div>
      </div>

      {/* 7-day summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {['error', 'warning', 'info'].map(lv => (
          <div key={lv} className={`rounded-xl border p-3 ${LEVEL[lv][1]}`}>
            <p className="text-xs opacity-80">7 ថ្ងៃ · {LEVEL[lv][0]}</p>
            <p className="text-2xl font-bold">{counts[lv] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-4 w-fit">
        {FILTERS.map(([f, l]) => (
          <button key={f} onClick={() => setLevel(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${level === f ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}>{l}</button>
        ))}
      </div>

      {/* Log list */}
      <div className="space-y-2">
        {data.logs.map(e => {
          const [ll, lc] = LEVEL[e.level] || LEVEL.info;
          const isOpen = open === e.id;
          return (
            <div key={e.id} className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : e.id)} className="w-full flex items-start gap-3 p-3 text-left hover:bg-stone-50">
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-bold ${lc}`}>{ll}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.message}</div>
                  <div className="text-[11px] text-stone-400 truncate">{e.endpoint || '—'} · {new Date(e.created_at.replace(' ', 'T')).toLocaleString()}{e.username ? ` · ${e.username}` : ''}</div>
                </div>
                <span className="text-stone-400">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-stone-100 p-3 bg-stone-50 text-xs space-y-2">
                  <div><span className="text-stone-500">Message:</span><pre className="whitespace-pre-wrap font-mono bg-white rounded-lg p-2 border border-stone-200 mt-1">{e.message}</pre></div>
                  {e.context && <div><span className="text-stone-500">Context (file:line):</span><div className="font-mono bg-white rounded-lg p-2 border border-stone-200 mt-1">{e.context}</div></div>}
                  <div className="text-stone-500">ID #{e.id} · Endpoint: <span className="font-mono">{e.endpoint || '—'}</span></div>
                </div>
              )}
            </div>
          );
        })}
        {!data.logs.length && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-10 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-stone-500">គ្មាន error — ប្រព័ន្ធដំណើរការល្អ</p>
          </div>
        )}
      </div>
    </div>
  );
}
