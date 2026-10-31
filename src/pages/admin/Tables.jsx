import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { useShop } from '../../hooks/useShop';

export default function Tables() {
  const shop = useShop();
  const [list, setList] = useState([]);
  const [no, setNo] = useState('');
  const [printT, setPrintT] = useState(null);
  const hiddenRef = useRef(null);
  const winRef = useRef(null);
  const load = () => api.get('/admin/tables').then(r=>setList(r.data));
  useEffect(() => { load(); }, []);
  const add = async () => { await api.post('/admin/tables', { table_no: no }); setNo(''); load(); };
  const base = (shop.site_url || '').replace(/\/+$/, '') || location.origin;
  const url = t => `${base}/t/${t.qr_token}`;
  const openPrint = t => { winRef.current = window.open('', '_blank'); setPrintT(t); };

  useEffect(() => {
    if (!printT) return;
    const canvas = hiddenRef.current?.querySelector('canvas');
    const data = canvas ? canvas.toDataURL('image/png') : '';
    const w = winRef.current;
    if (!w || w.closed || !data) { setPrintT(null); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR ${printT.table_no}</title></head>
      <body style="margin:0;text-align:center;font-family:'Kantumruy Pro','Segoe UI',sans-serif">
        <div style="margin-top:28px">
          <h2 style="margin:0 0 6px;font-size:22px">☕ ${shop.shop_name || 'IT Coffee'} — តុ ${printT.table_no}</h2>
          <img id="qr" src="${data}" style="width:300px;height:300px" />
          <p style="margin:10px 0 0;font-size:15px">Scan ដើម្បី Order</p>
          <p style="margin:4px 0 0;font-size:11px;color:#888">${url(printT)}</p>
        </div>
      </body></html>`);
    w.document.close();
    const img = w.document.getElementById('qr');
    const go = () => { w.focus(); w.print(); };
    if (img.complete && img.naturalWidth > 0) go(); else img.onload = go;
    winRef.current = null;
    setPrintT(null);
  }, [printT]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Tables & QR Code</h1>
      <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-2">
        <input placeholder="Table No (ឧ. T3)" className="border p-2 rounded" value={no} onChange={e=>setNo(e.target.value)}/>
        <button onClick={add} className="bg-amber-700 text-white px-4 rounded font-bold">+ បន្ថែមតុ</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {list.map(t=>(
          <div key={t.id} className="bg-white p-4 rounded-xl shadow text-center">
            <p className="font-bold mb-2">តុ {t.table_no}</p>
            <div className="flex justify-center mb-2"><QRCodeSVG value={url(t)} size={110}/></div>
            <button onClick={()=>openPrint(t)} className="text-xs bg-stone-800 text-white px-3 py-1 rounded">🖨️ Print QR</button>
          </div>
        ))}
      </div>
      {printT && (
        <div ref={hiddenRef} style={{ position: 'fixed', left: -9999, top: 0 }} aria-hidden="true">
          <QRCodeCanvas value={url(printT)} size={300} level="M" />
        </div>
      )}
    </div>
  );
}
