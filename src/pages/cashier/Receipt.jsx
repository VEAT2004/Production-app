import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { useShop } from '../../hooks/useShop';

export default function Receipt() {
  const { id } = useParams();
  const shop = useShop();
  const cur = shop.currency || '$';
  const [r, setR] = useState(null);
  const [size, setSize] = useState(() => shop.printer_size || '80');

  useEffect(() => { api.get(`/receipt/${id}`).then(res => setR(res.data)).catch(() => {}); }, [id]);
  useEffect(() => { if (shop.printer_size) setSize(shop.printer_size); }, [shop.printer_size]);

  if (!r) return <p className="p-4 text-center text-stone-500">Loading...</p>;
  const mm = size === '58' ? '58mm' : '80mm';

  return (
    <div className="min-h-screen bg-stone-100 py-6 flex flex-col items-center">
      {/* Print styles — only the receipt paper prints, at the selected width */}
      <style>{`
        @media print {
          @page { margin: 3mm; size: ${mm} auto; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .receipt-paper { box-shadow: none !important; margin: 0 !important; width: ${mm} !important; }
        }
        .receipt-paper { width: ${mm}; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print mb-4 flex items-center gap-2">
        <div className="flex rounded-xl overflow-hidden border border-stone-300 bg-white shadow-sm">
          {['58', '80'].map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`px-4 py-2 text-sm font-bold ${size === s ? 'bg-amber-700 text-white' : 'text-stone-600'}`}>{s}mm</button>
          ))}
        </div>
        <button onClick={() => window.print()} className="bg-stone-800 text-white px-5 py-2 rounded-xl font-bold shadow-sm">🖨️ Print</button>
        <Link to="/cashier" className="bg-white border border-stone-300 px-4 py-2 rounded-xl font-semibold text-stone-600 shadow-sm">← Orders</Link>
      </div>

      {/* Paper */}
      <div className="receipt-paper bg-white shadow-lg p-3 font-mono text-[12px] leading-snug text-black">
        <div className="text-center">
          {shop.shop_logo && <img src={shop.shop_logo} alt="logo" className="h-12 mx-auto mb-1 object-contain" />}
          <div className="font-bold text-[15px]">{shop.shop_name}</div>
          {shop.shop_address && <div className="text-[11px]">{shop.shop_address}</div>}
          {shop.shop_phone && <div className="text-[11px]">Tel: {shop.shop_phone}</div>}
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="flex justify-between text-[11px]">
          <span>Order #{r.id}</span><span>{r.table_no ? 'តុ ' + r.table_no : 'Take away'}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span>{new Date(String(r.paid_at).replace(' ', 'T')).toLocaleString()}</span>
          <span>{r.cashier}</span>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        {r.items?.length ? r.items.map(i => (
          <div key={i.id} className="mb-1">
            <div className="flex justify-between">
              <span className="truncate pr-2">{i.name} x{i.qty}</span>
              <span>{cur}{(i.price * i.qty).toFixed(2)}</span>
            </div>
            {i.options && Object.keys(i.options).length > 0 &&
              <div className="text-[10px] pl-2 opacity-80">{Object.values(i.options).join(', ')}</div>}
            {i.note && <div className="text-[10px] pl-2 italic">* {i.note}</div>}
          </div>
        )) : <div>Total paid: {cur}{Number(r.total).toFixed(2)}</div>}
        <div className="border-t border-dashed border-black my-2" />
        {Number(r.discount) > 0 && (
          <div className="flex justify-between text-[11px]"><span>Discount</span><span>-{cur}{Number(r.discount).toFixed(2)}</span></div>
        )}
        <div className="flex justify-between font-bold text-[14px]"><span>TOTAL</span><span>{cur}{Number(r.total).toFixed(2)}</span></div>
        <div className="flex justify-between text-[11px]"><span>{(r.method || '').toUpperCase()}</span><span>Received {cur}{Number(r.amount_received || r.total).toFixed(2)}</span></div>
        {Number(r.change_amount) > 0 && <div className="flex justify-between text-[11px]"><span>Change</span><span>{cur}{Number(r.change_amount).toFixed(2)}</span></div>}
        <div className="border-t border-dashed border-black my-2" />
        <div className="text-center text-[11px]">{shop.receipt_footer}</div>
        <div className="text-center text-[10px] opacity-70 mt-1">Powered by IT Coffee POS</div>
      </div>
    </div>
  );
}
