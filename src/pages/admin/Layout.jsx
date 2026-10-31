import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useShop } from '../../hooks/useShop';

const links = [
  ['', 'Overview', '📊'], ['orders', 'Orders', '🧾'], ['reports', 'Reports', '📈'],
  ['products', 'Products', '☕'], ['stock', 'Stock', '📦'], ['categories', 'Categories', '🏷️'],
  ['cashiers', 'Cashiers', '👥'], ['tables', 'Tables + QR', '🔳'], ['payments', 'Payments', '💳'],
  ['logs', 'Logs', '📜'], ['settings', 'Design', '🎨'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const shop = useShop();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('navCollapsed') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setCollapsed(c => { localStorage.setItem('navCollapsed', c ? '0' : '1'); return !c; });
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="md:flex min-h-screen bg-stone-100">
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={closeMobile} />}

      <aside className={`bg-stone-900 text-white flex flex-col shrink-0 overflow-y-auto fixed inset-y-0 left-0 z-40 w-64 -translate-x-full transition-transform md:translate-x-0 md:sticky md:top-0 md:h-screen md:transition-[width] md:duration-200 ${mobileOpen ? 'translate-x-0' : ''} ${collapsed ? 'md:w-[72px]' : 'md:w-60'}`}>
        <div className={`flex items-center gap-2 p-4 ${collapsed ? 'md:flex-col md:gap-2 md:p-2' : ''}`}>
          <span className="text-xl shrink-0">☕</span>
          <h2 className={`text-lg font-bold truncate flex-1 ${collapsed ? 'md:hidden' : ''}`}>{shop.shop_name}</h2>
          <button onClick={toggle} title={collapsed ? 'បើកម៉ឺនុយ' : 'បិទម៉ឺនុយ'}
            className={`hidden md:grid place-items-center w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 shrink-0 ${collapsed ? 'md:mx-auto' : 'ml-auto'}`}>
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {user?.role === 'owner' && (
          <NavLink to="/owner" onClick={closeMobile}
            className={`mx-4 mb-3 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold ${collapsed ? 'md:hidden' : ''}`}>← Owner Panel</NavLink>
        )}

        <nav className="flex flex-col gap-1.5 px-3">
          {links.map(([p, l, ic]) => (
            <NavLink key={p} to={p} end={p === ''} title={l} onClick={closeMobile}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium ${isActive ? 'bg-amber-600 text-white' : 'text-stone-300 hover:bg-stone-700 hover:text-white'} ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
              <span className="text-base leading-none shrink-0">{ic}</span>
              <span className={collapsed ? 'md:hidden' : ''}>{l}</span>
            </NavLink>
          ))}
        </nav>

        <div className={`mt-auto pt-4 text-sm border-t border-stone-800 ${collapsed ? 'md:px-2' : 'px-4'}`}>
          <div className={`px-1 mb-2 text-stone-300 truncate ${collapsed ? 'md:hidden' : ''}`}>{user?.name}</div>
          <button onClick={logout} title="Logout"
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10 hover:border-red-400/70 font-semibold ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
            <span className="leading-none">⏻</span><span className={collapsed ? 'md:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-20 bg-stone-900 text-white px-3 py-2 flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} title="បើកម៉ឺនុយ"
            className="w-9 h-9 grid place-items-center rounded-lg bg-stone-800 hover:bg-stone-700 text-lg shrink-0">☰</button>
          <span className="font-bold truncate">☕ {shop.shop_name}</span>
        </div>
        <main className="p-4"><Outlet /></main>
      </div>
    </div>
  );
}
