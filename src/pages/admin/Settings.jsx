import { useEffect, useState } from 'react';
import api from '../../api';
import { refreshShop } from '../../hooks/useShop';
import ImageUpload from '../../components/ImageUpload.jsx';

function Row({ k, label, type = 'text', s, setS, hint }) {
  return (
    <label className="block mb-3 text-sm">
      <span className="font-semibold text-stone-600">{label}</span>
      <input type={type} className="w-full border border-stone-200 rounded-lg p-2 mt-1 bg-stone-50" value={s[k] ?? ''}
        onChange={e => setS({ ...s, [k]: e.target.value })} />
      {hint && <span className="text-xs text-stone-400">{hint}</span>}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
      <h3 className="font-bold text-stone-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function Settings() {
  const [s, setS] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/admin/settings').then(r => setS(r.data)); }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/admin/settings', s);
      await refreshShop();
      alert('បានរក្សាទុក!');
    } catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">System Design</h1>
        <button onClick={save} disabled={busy} className="bg-amber-700 text-white px-5 py-2 rounded-xl font-bold shadow disabled:opacity-50">
          {busy ? 'កំពុងរក្សាទុក…' : 'រក្សាទុក'}
        </button>
      </div>

      <Section title="🏪 ព័ត៌មានហាង">
        <ImageUpload value={s.shop_logo} onChange={v => setS({ ...s, shop_logo: v })} label="Logo ហាង" className="mb-3" />
        <Row k="shop_name" label="ឈ្មោះហាង" s={s} setS={setS} />
        <Row k="shop_address" label="អាសយដ្ឋាន" s={s} setS={setS} />
        <Row k="shop_phone" label="លេខទូរស័ព្ទ" s={s} setS={setS} />
        <Row k="site_url" label="Public URL (សម្រាប់ QR តុ)" s={s} setS={setS}
          hint="ឧ. http://192.168.4.156:5173 — ទុកទទេដើម្បីប្រើអាសយដ្ឋានបច្ចុប្បន្ន" />
        <div className="grid grid-cols-2 gap-3">
          <Row k="currency" label="រូបិយប័ណ្ណ" s={s} setS={setS} hint="ឧ. $ ឬ ៛" />
          <label className="block mb-3 text-sm">
            <span className="font-semibold text-stone-600">ភាសាលំនាំដើម</span>
            <select value={s.default_language ?? 'km'} onChange={e => setS({ ...s, default_language: e.target.value })}
              className="w-full border border-stone-200 rounded-lg p-2 mt-1 bg-stone-50">
              <option value="km">ខ្មែរ</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="🎨 រូបរាង">
        <label className="block mb-3 text-sm">
          <span className="font-semibold text-stone-600">ពណ៌ Theme</span>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={s.theme_color ?? '#b45309'} onChange={e => setS({ ...s, theme_color: e.target.value })}
              className="w-14 h-10 rounded-lg border border-stone-200 bg-white cursor-pointer" />
            <input type="text" value={s.theme_color ?? ''} onChange={e => setS({ ...s, theme_color: e.target.value })}
              className="flex-1 border border-stone-200 rounded-lg p-2 bg-stone-50 font-mono text-sm" />
          </div>
        </label>
      </Section>

      <Section title="🧾 វិក្កយបត្រ & ម៉ាស៊ីនបោះពុម្ព">
        <label className="block mb-3 text-sm">
          <span className="font-semibold text-stone-600">ទំហំក្រដាស</span>
          <div className="flex gap-2 mt-1">
            {['58', '80'].map(sz => (
              <button key={sz} type="button" onClick={() => setS({ ...s, printer_size: sz })}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold ${(s.printer_size ?? '80') === sz ? 'bg-amber-700 text-white border-amber-700' : 'bg-stone-50 border-stone-200'}`}>
                {sz}mm
              </button>
            ))}
          </div>
        </label>
        <Row k="receipt_footer" label="Footer វិក្កយបត្រ" s={s} setS={setS} />
      </Section>

      <Section title="🔔 ការជូនដំណឹង">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={String(s.new_order_sound ?? '1') === '1'}
            onChange={e => setS({ ...s, new_order_sound: e.target.checked ? '1' : '0' })} />
          <span className="font-semibold text-stone-600">បើកសំឡេងពេលមាន Order ថ្មី (Cashier)</span>
        </label>
      </Section>

      <Section title="📱 ABA KHQR (បង្ហាញ QR)">
        <ImageUpload value={s.khqr_image} onChange={v => setS({ ...s, khqr_image: v })} label="រូប QR របស់ធនាគារ (ជម្រើស)" className="mb-2" />
        <p className="text-xs text-stone-400 mb-3">បើដាក់រូប QR ដែលទទួលពីធនាគារ ផ្ទាំងទូទាត់នឹងបង្ហាញរូបនេះជំនួស QR បង្កើតស្វ័យប្រវត្តិខាងក្រោម។</p>
        <Row k="khqr_merchant_name" label="ឈ្មោះ Merchant" s={s} setS={setS} />
        <div className="grid grid-cols-2 gap-3">
          <Row k="khqr_bank" label="ធនាគារ (Bank code)" s={s} setS={setS} hint="ឧ. ABA" />
          <Row k="khqr_account" label="លេខគណនី / KHQR ID" s={s} setS={setS} />
        </div>
        <Row k="khqr_city" label="ទីក្រុង" s={s} setS={setS} />
      </Section>

      <Section title="🔐 សុវត្ថិភាព">
        <Row k="owner_pin" label="Owner Special PIN" type="password" s={s} setS={setS} hint="សម្រាប់ action សំខាន់ៗរបស់ Owner" />
      </Section>

      <button onClick={save} disabled={busy} className="w-full bg-amber-700 text-white py-3 rounded-xl font-bold shadow disabled:opacity-50">
        {busy ? 'កំពុងរក្សាទុក…' : 'រក្សាទុកការកំណត់'}
      </button>
    </div>
  );
}
