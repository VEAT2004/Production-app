import { useEffect, useState } from 'react';
import api from '../../api';
import ImageUpload from '../../components/ImageUpload.jsx';

const EMPTY = { id: null, name: '', category_id: '', price: '', description: '', image: '', stock_qty: '', low_stock: 5, is_available: 1, options: {} };

function OptionsEditor({ options, setOptions }) {
  const groups = Object.keys(options);
  const renameGroup = (oldName, newName) => {
    const next = {};
    for (const g of groups) next[g === oldName ? newName : g] = options[g];
    setOptions(next);
  };
  const addGroup = () => {
    let n = 1, name = 'group';
    while (options[name]) name = 'group' + (++n);
    setOptions({ ...options, [name]: [{ label: '', add: 0 }] });
  };
  const removeGroup = (g) => { const next = { ...options }; delete next[g]; setOptions(next); };
  const setChoices = (g, choices) => setOptions({ ...options, [g]: choices });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-stone-600">ជម្រើស (Options)</span>
        <button type="button" onClick={addGroup} className="text-xs bg-stone-800 text-white px-2.5 py-1 rounded-lg">+ ក្រុម</button>
      </div>
      {groups.length === 0 && <p className="text-xs text-stone-400">គ្មានជម្រើស — ចុច "+ ក្រុម" ដើម្បីបន្ថែម (ឧ. Size / Sugar / Ice)</p>}
      {groups.map(g => (
        <div key={g} className="border border-stone-200 rounded-xl p-3 mb-2 bg-stone-50">
          <div className="flex items-center gap-2 mb-2">
            <input value={g} onChange={e => renameGroup(g, e.target.value)} placeholder="ឈ្មោះក្រុម (Size)"
              className="flex-1 border border-stone-200 rounded-lg px-2 py-1 text-sm bg-white font-semibold" />
            <button type="button" onClick={() => removeGroup(g)} className="text-xs text-red-500">លុបក្រុម</button>
          </div>
          {(options[g] || []).map((c, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <input value={c.label} placeholder="ជម្រើស (Large)"
                onChange={e => { const arr = [...options[g]]; arr[i] = { ...arr[i], label: e.target.value }; setChoices(g, arr); }}
                className="flex-1 border border-stone-200 rounded-lg px-2 py-1 text-sm bg-white" />
              <span className="text-xs text-stone-400">+</span>
              <input type="number" step="0.25" min="0" value={c.add}
                onChange={e => { const arr = [...options[g]]; arr[i] = { ...arr[i], add: Number(e.target.value) || 0 }; setChoices(g, arr); }}
                className="w-20 border border-stone-200 rounded-lg px-2 py-1 text-sm bg-white" />
              <button type="button" onClick={() => setChoices(g, options[g].filter((_, j) => j !== i))}
                className="text-stone-400 hover:text-red-500 text-sm">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setChoices(g, [...(options[g] || []), { label: '', add: 0 }])}
            className="text-xs text-amber-700 font-semibold">+ ជម្រើស</button>
        </div>
      ))}
    </div>
  );
}

function Field({ k, label, type = 'text', ph = '', f, set }) {
  return (
    <label className="block mb-3 text-sm">
      <span className="font-semibold text-stone-600">{label}</span>
      <input type={type} placeholder={ph} value={f[k] ?? ''} onChange={e => set(k, e.target.value)}
        className="w-full border border-stone-200 rounded-lg p-2 mt-1 bg-stone-50" />
    </label>
  );
}

function ProductModal({ cats, initial, onClose, onSaved }) {
  const [f, setF] = useState({ ...EMPTY, ...initial, options: initial?.options ? JSON.parse(JSON.stringify(initial.options)) : {} });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const save = async () => {
    if (!f.name.trim()) return alert('សូមបញ្ចូលឈ្មោះ');
    if (f.price === '' || Number(f.price) < 0) return alert('តម្លៃមិនត្រឹមត្រូវ');
    // strip empty option labels
    const opts = {};
    for (const [g, choices] of Object.entries(f.options || {})) {
      const clean = (choices || []).filter(c => c.label.trim()).map(c => ({ label: c.label.trim(), add: Number(c.add) || 0 }));
      if (g.trim() && clean.length) opts[g.trim()] = clean;
    }
    const payload = {
      id: f.id || undefined, name: f.name.trim(), category_id: f.category_id || null,
      price: Number(f.price), description: f.description, image: f.image || null,
      stock_qty: f.stock_qty === '' ? null : Number(f.stock_qty), low_stock: Number(f.low_stock) || 0,
      is_available: f.is_available ? 1 : 0, options: Object.keys(opts).length ? opts : null,
    };
    setBusy(true);
    try {
      if (f.id) await api.put('/admin/products', payload);
      else await api.post('/admin/products', payload);
      onSaved();
    } catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-stone-100 sticky top-0 bg-white">
          <h3 className="font-bold text-lg">{f.id ? 'កែទំនិញ' : 'បន្ថែមទំនិញ'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 text-stone-500">×</button>
        </div>
        <div className="p-4">
          <ImageUpload value={f.image} onChange={v => set('image', v)} className="mb-3" />
          <Field f={f} set={set} k="name" label="ឈ្មោះ" ph="Espresso" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-semibold text-stone-600">ប្រភេទ</span>
              <select value={f.category_id} onChange={e => set('category_id', e.target.value)}
                className="w-full border border-stone-200 rounded-lg p-2 mt-1 bg-stone-50">
                <option value="">— គ្មាន —</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <Field f={f} set={set} k="price" label="តម្លៃ ($)" type="number" ph="2.50" />
          </div>
          <label className="block mb-3 text-sm">
            <span className="font-semibold text-stone-600">ការពិពណ៌នា</span>
            <textarea rows={2} value={f.description ?? ''} onChange={e => set('description', e.target.value)}
              className="w-full border border-stone-200 rounded-lg p-2 mt-1 bg-stone-50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field f={f} set={set} k="stock_qty" label="ស្តុក (ទុកទទេ = អត់តាមដាន)" type="number" ph="50" />
            <Field f={f} set={set} k="low_stock" label="កម្រិតស្តុកទាប" type="number" ph="5" />
          </div>
          <label className="flex items-center gap-2 mb-2 text-sm">
            <input type="checkbox" checked={!!f.is_available} onChange={e => set('is_available', e.target.checked ? 1 : 0)} />
            <span className="font-semibold text-stone-600">មានលក់ (Available)</span>
          </label>
          <OptionsEditor options={f.options} setOptions={o => set('options', o)} />
        </div>
        <div className="p-4 border-t border-stone-100 sticky bottom-0 bg-white flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-stone-100 font-semibold">បោះបង់</button>
          <button onClick={save} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-amber-700 text-white font-bold disabled:opacity-50">
            {busy ? 'កំពុងរក្សាទុក…' : 'រក្សាទុក'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/admin/products').then(r => setList(r.data)).catch(() => {});
  useEffect(() => {
    load();
    api.get('/admin/categories').then(r => setCats(r.data)).catch(() => {});
  }, []);

  const remove = async (p) => {
    if (!confirm(`លុប "${p.name}"?`)) return;
    try {
      const { data } = await api.delete('/admin/products', { data: { id: p.id } });
      if (data.disabled) alert(data.message || 'បានបិទការលក់ជំនួសការលុប (មានប្រវត្តិ order)');
      load();
    } catch (e) { alert(e.response?.data?.error || e.message); }
  };

  const stockBadge = (p) => {
    if (p.stock_qty === null) return null;
    const q = Number(p.stock_qty);
    if (q <= 0) return <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">អស់ស្តុក</span>;
    if (q <= Number(p.low_stock)) return <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">ស្តុកទាប · {q}</span>;
    return <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">ស្តុក {q}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">Products</h1>
        <button onClick={() => setEditing({ ...EMPTY, category_id: cats[0]?.id || '' })}
          className="bg-amber-700 text-white px-4 py-2 rounded-xl font-bold shadow">+ បន្ថែមទំនិញ</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {list.map(p => (
          <div key={p.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border border-stone-100 ${!p.is_available ? 'opacity-60' : ''}`}>
            <div className="h-24 bg-stone-100">
              {p.image
                ? <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                : <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-amber-100 to-amber-200">☕</div>}
            </div>
            <div className="p-2.5">
              <div className="flex items-start justify-between gap-1">
                <div className="font-semibold text-sm truncate">{p.name}</div>
                <span className="text-amber-700 font-bold text-sm shrink-0">${Number(p.price).toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-stone-400">{p.category || '—'}</div>
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                {stockBadge(p)}
                {p.options && Object.keys(p.options).length > 0 && <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full">ជម្រើស</span>}
                {!p.is_available && <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full">បិទលក់</span>}
              </div>
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => setEditing(p)} className="flex-1 text-xs bg-stone-100 hover:bg-stone-200 py-1.5 rounded-lg font-semibold">កែ</button>
                <button onClick={() => remove(p)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg font-semibold">លុប</button>
              </div>
            </div>
          </div>
        ))}
        {!list.length && <p className="text-stone-400 col-span-full text-center py-10">មិនមានទំនិញ</p>}
      </div>

      {editing && <ProductModal cats={cats} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}
