import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import AdminLayout from './pages/admin/Layout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Products from './pages/admin/Products.jsx';
import Categories from './pages/admin/Categories.jsx';
import Cashiers from './pages/admin/Cashiers.jsx';
import Tables from './pages/admin/Tables.jsx';
import Payments from './pages/admin/Payments.jsx';
import Settings from './pages/admin/Settings.jsx';
import Reports from './pages/admin/Reports.jsx';
import Stock from './pages/admin/Stock.jsx';
import Logs from './pages/admin/Logs.jsx';
import Orders from './pages/admin/Orders.jsx';
import OwnerLayout from './pages/owner/Layout.jsx';
import OwnerOverview from './pages/owner/Overview.jsx';
import OwnerErrors from './pages/owner/Errors.jsx';
import OwnerAccounts from './pages/owner/Accounts.jsx';
import CashierPos from './pages/cashier/Pos.jsx';
import CashierPay from './pages/cashier/Pay.jsx';
import Receipt from './pages/cashier/Receipt.jsx';
import CustomerMenu from './pages/customer/Menu.jsx';

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const roles = Array.isArray(role) ? role : [role];
  if (role && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/admin" element={<Guard role={['admin','owner']}><AdminLayout/></Guard>}>
          <Route index element={<Dashboard/>}/>
          <Route path="orders" element={<Orders/>}/>
          <Route path="reports" element={<Reports/>}/>
          <Route path="products" element={<Products/>}/>
          <Route path="stock" element={<Stock/>}/>
          <Route path="categories" element={<Categories/>}/>
          <Route path="cashiers" element={<Cashiers/>}/>
          <Route path="tables" element={<Tables/>}/>
          <Route path="payments" element={<Payments/>}/>
          <Route path="logs" element={<Logs/>}/>
          <Route path="settings" element={<Settings/>}/>
        </Route>
        <Route path="/owner" element={<Guard role="owner"><OwnerLayout/></Guard>}>
          <Route index element={<OwnerOverview/>}/>
          <Route path="errors" element={<OwnerErrors/>}/>
          <Route path="accounts" element={<OwnerAccounts/>}/>
        </Route>
        <Route path="/cashier" element={<Guard role="cashier"><CashierPos/></Guard>}/>
        <Route path="/cashier/new" element={<Guard role="cashier"><CashierPos/></Guard>}/>
        <Route path="/cashier/pay/:id" element={<Guard role="cashier"><CashierPay/></Guard>}/>
        <Route path="/receipt/:id" element={<Guard role="cashier"><Receipt/></Guard>}/>
        <Route path="/t/:token" element={<CustomerMenu/>}/>
        <Route path="*" element={<Navigate to="/login"/>}/>
      </Routes>
    </div>
  );
}
