import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useShop } from '../hooks/useShop';

const L = {
  km: {
    tagline: 'ប្រព័ន្ធគ្រប់គ្រងហាងកាហ្វេ',
    username: 'ឈ្មោះអ្នកប្រើ', password: 'ពាក្យសម្ងាត់',
    login: 'ចូលប្រព័ន្ធ', logging_in: 'កំពុងចូល...',
    admin_title: 'បញ្ជាក់អត្តសញ្ញាណ Admin',
    admin_body: 'សូមបញ្ចូលពាក្យសម្ងាត់របស់អ្នកម្ដងទៀត ដើម្បីចូលជា Admin/Owner',
    admin_ph: 'ពាក្យសម្ងាត់ Admin', confirm: 'បញ្ជាក់', cancel: 'បោះបង់',
    invalid: 'ឈ្មោះអ្នកប្រើ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ',
    welcome: 'សូមស្វាគមន៍', secure: 'ការចូលប្រើដោយសុវត្ថិភាព',
    feat1: 'គ្រប់គ្រងការកម្មង់ និងវិក្កយបត្រ', feat2: 'របាយការណ៍លក់ និងស្តុក', feat3: 'តាមដានការកម្មង់តាមតុ',
  },
  en: {
    tagline: 'Coffee shop management system',
    username: 'Username', password: 'Password',
    login: 'Login', logging_in: 'Logging in...',
    admin_title: 'Admin verification',
    admin_body: 'Re-enter your password to continue as Admin/Owner',
    admin_ph: 'Admin password', confirm: 'Confirm', cancel: 'Cancel',
    invalid: 'Invalid username or password',
    welcome: 'Welcome', secure: 'Secure sign-in',
    feat1: 'Manage orders & receipts', feat2: 'Sales reports & stock', feat3: 'Live table order tracking',
  },
};

const routeFor = (role) => (role === 'owner' ? '/owner' : role === 'admin' ? '/admin' : '/cashier');

export default function Login() {
  const { login } = useAuth();
  const { lang, setLang } = useLang();
  const nav = useNavigate();
  const shop = useShop();
  const t = L[lang] || L.km;
  const theme = /^#[0-9a-fA-F]{6}$/.test(shop.theme_color) ? shop.theme_color : '#b45309';

  const [f, setF] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(null); // {username,password} when admin step-up needed

  const finish = (token) => {
    login(token);
    const role = JSON.parse(atob(token.split('.')[1])).role;
    nav(routeFor(role));
  };

  const doLogin = async (payload) => {
    setBusy(true); setErr('');
    try {
      const { data } = await api.post('/auth/login', payload);
      finish(data.token);
    } catch (e) {
      const status = e.response?.status;
      if (status === 403) {
        // admin/owner step-up: ask to re-confirm password in a popup
        setConfirm({ username: payload.username, password: payload.password });
      } else {
        setErr(e.response?.data?.error || t.invalid);
      }
    } finally {
      setBusy(false);
    }
  };

  const submitAccount = (e) => {
    e?.preventDefault();
    if (!f.username.trim() || !f.password) { setErr(t.invalid); return; }
    doLogin({ username: f.username.trim(), password: f.password });
  };

  const submitConfirm = async () => {
    if (!confirm) return;
    setBusy(true); setErr('');
    try {
      const { data } = await api.post('/auth/login', { ...confirm, admin_confirm: confirm.pw });
      setConfirm(null);
      finish(data.token);
    } catch (e) {
      setErr(e.response?.data?.error || t.invalid);
      setConfirm((c) => (c ? { ...c, pw: '' } : c));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Brand panel */}
      <aside className="hidden lg:flex lg:w-[46%] relative overflow-hidden text-white flex-col justify-between p-12"
        style={{ background: `linear-gradient(160deg, ${theme} 0%, #292524 120%)` }}>
        <div className="orb absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl" />
        <div className="orb-delay absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-black/20 blur-2xl" />
        <span className="float-slow absolute top-[16%] right-[14%] text-6xl opacity-15 select-none pointer-events-none">☕</span>
        <span className="float-slower absolute top-[46%] right-[30%] text-3xl opacity-10 select-none pointer-events-none">🫘</span>
        <span className="float-slow absolute bottom-[24%] right-[10%] text-4xl opacity-10 select-none pointer-events-none" style={{ animationDelay: '1.4s' }}>🥐</span>
        <div className="relative flex items-center gap-3 rise d1">
          {shop.shop_logo
            ? <img src={shop.shop_logo} alt="" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/40" />
            : <span className="ring-pulse w-11 h-11 grid place-items-center rounded-xl bg-white/15 text-2xl">☕</span>}
          <span className="text-xl font-semibold tracking-tight">{shop.shop_name}</span>
          <button onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
            className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25">
            {lang === 'km' ? '🌐 English' : '🌐 ខ្មែរ'}
          </button>
        </div>
        <div className="relative">
          <h1 className="rise d2 text-5xl font-bold leading-tight">{t.welcome}</h1>
          <p className="rise d3 mt-3 text-white/70 text-lg">{t.tagline}</p>
          <ul className="mt-8 space-y-3 text-white/85">
            {[t.feat1, t.feat2, t.feat3].map((x, i) => (
              <li key={i} className={`flex items-center gap-3 rise d${i + 3}`}>
                <span className="w-6 h-6 grid place-items-center rounded-full bg-white/15 text-xs">✓</span>{x}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative rise d5 text-white/50 text-sm">© {new Date().getFullYear()} {shop.shop_name} · {t.secure}</p>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md fade-up">
          {/* mobile / tablet hero brand banner */}
          <div className="lg:hidden mb-5 rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${theme} 0%, #292524 130%)` }}>
            <div className="orb absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <span className="float-slow absolute top-3 right-6 text-3xl opacity-15 select-none pointer-events-none">☕</span>
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {shop.shop_logo
                  ? <img src={shop.shop_logo} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/30 shrink-0" />
                  : <span className="ring-pulse w-10 h-10 grid place-items-center rounded-xl bg-white/15 text-xl shrink-0">☕</span>}
                <div className="min-w-0">
                  <div className="font-bold truncate">{shop.shop_name}</div>
                  <div className="text-[11px] text-white/70 truncate">{t.tagline}</div>
                </div>
              </div>
              <button onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25">
                {lang === 'km' ? '🌐 EN' : '🌐 ខ្មែរ'}
              </button>
            </div>
            <h1 className="rise d2 relative mt-4 text-2xl font-bold">{t.welcome}</h1>
          </div>

          <div className="card p-6 sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-stone-800">🔑 {t.login}</h2>
              <p className="text-sm text-stone-500 mt-1">{t.secure}</p>
            </div>

            {err && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}

            <form onSubmit={submitAccount} className="space-y-4">
              <Field label={t.username} value={f.username} autoComplete="username" autoFocus
                onChange={(v) => setF({ ...f, username: v })} placeholder={t.username} />
              <Field label={t.password} type="password" value={f.password} autoComplete="current-password"
                onChange={(v) => setF({ ...f, password: v })} placeholder="••••••••" />
              <Submit theme={theme} busy={busy}>{busy ? t.logging_in : t.login}</Submit>
            </form>
          </div>
          <p className="mt-5 text-center text-xs text-stone-400 lg:hidden">© {new Date().getFullYear()} {shop.shop_name}</p>
        </div>
      </main>

      {/* Admin step-up popup */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={() => !busy && setConfirm(null)}>
          <div className="pop-in w-full max-w-sm card p-6" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-10 h-10 grid place-items-center rounded-full" style={{ background: theme + '22' }}>🔐</span>
              <h2 className="text-lg font-bold">{t.admin_title}</h2>
            </div>
            <p className="text-sm text-stone-500 mb-4">{t.admin_body}</p>
            <Field label={t.admin_ph} type="password" value={confirm.pw || ''} autoFocus
              onChange={(v) => setConfirm({ ...confirm, pw: v })}
              onEnter={() => confirm.pw && submitConfirm()} placeholder="••••••••" />
            {err && <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{err}</div>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setConfirm(null)} disabled={busy}
                className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50 disabled:opacity-50">
                {t.cancel}
              </button>
              <button onClick={submitConfirm} disabled={busy || !confirm.pw}
                className="flex-1 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50" style={{ background: theme }}>
                {busy ? t.logging_in : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, autoComplete, autoFocus, onEnter }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-stone-500 mb-1.5">{label}</span>
      <input type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        className="w-full px-3.5 py-3 rounded-xl border border-stone-200 bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-200 outline-none text-[15px]" />
    </label>
  );
}

function Submit({ children, busy, theme }) {
  return (
    <button type="submit" disabled={busy}
      className="w-full py-3 rounded-xl text-white font-bold shadow-sm disabled:opacity-60" style={{ background: theme }}>
      {children}
    </button>
  );
}
