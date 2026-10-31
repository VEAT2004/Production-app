import { useRef, useState } from 'react';
import api from '../api';

// Uploads an image via POST /admin/upload and calls onChange(url).
export default function ImageUpload({ value, onChange, label = 'រូបភាព', className = '' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr('');
    if (file.size > 4 * 1024 * 1024) { setErr('រូបភាពធំពេក (អតិបរមា 4MB)'); return; }
    const fd = new FormData();
    fd.append('image', file);
    setBusy(true);
    try {
      const { data } = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url);
    } catch (e2) {
      setErr(e2.response?.data?.error || 'បរាជ័យក្នុងការ upload');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className={className}>
      <div className="text-sm font-semibold text-stone-600 mb-1.5">{label}</div>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl shrink-0">
          {value ? <img src={value} alt="" className="w-full h-full object-contain" /> : '☕'}
        </div>
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-sm font-semibold disabled:opacity-50">
            {busy ? 'កំពុង upload…' : value ? 'ប្តូររូប' : 'បញ្ចូលរូប'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold">ដករូបចេញ</button>
          )}
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
      </div>
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}
