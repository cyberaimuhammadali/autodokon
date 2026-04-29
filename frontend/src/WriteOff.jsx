import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageX, Plus, ScanBarcode, Trash2, CheckCircle, X } from 'lucide-react';
import api from './api';

const REASONS = ['Muddati o\'tdi', 'Shikastlangan', 'Yo\'qolgan', 'Sifatsiz', 'Boshqa'];

export default function WriteOffPage() {
  const qc = useQueryClient();
  const [cart, setCart] = useState([]);
  const [reason, setReason] = useState('Muddati o\'tdi');
  const [barcode, setBarcode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const barcodeRef = useRef(null);

  const { data: writeOffs = [], isLoading } = useQuery({
    queryKey: ['write_offs'],
    queryFn: async () => (await api.get('/write-offs/')).data,
  });

  const submit = useMutation({
    mutationFn: () => api.post('/write-offs/', {
      reason,
      branch_id: 1,
      items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, cost_at_time: i.cost_price || 0 })),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['write_offs']);
      setCart([]);
      setMsg(`${cart.length} ta tovar chiqimga chiqarildi!`);
    },
  });

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    try {
      const res = await api.get(`/products/barcode/${barcode.trim()}`);
      const p = res.data;
      setCart(prev => {
        const ex = prev.find(i => i.id === p.id);
        if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...p, quantity: 1 }];
      });
      setBarcode('');
      setError('');
    } catch { setError('Mahsulot topilmadi!'); }
    barcodeRef.current?.focus();
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><PackageX className="text-orange-500" size={28}/>Chiqimga Chiqarish</h2>

      {msg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2"><CheckCircle size={16}/>{msg}<button onClick={()=>setMsg('')} className="ml-auto">×</button></div>}

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Yangi Chiqim</h3>

          <div className="mb-4">
            <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Sabab</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400">
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <form onSubmit={handleScan} className="flex gap-2 mb-4">
            <input ref={barcodeRef} type="text" autoFocus value={barcode} onChange={e => setBarcode(e.target.value)}
              placeholder="Shtrix-kod skanerlang..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"/>
            <button type="submit" className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
              <ScanBarcode size={16}/>
            </button>
          </form>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

          {cart.length === 0 ? (
            <div className="text-center py-10 text-slate-300"><PackageX size={40} className="mx-auto mb-2"/><p className="text-sm">Shtrix-kod skanerlang</p></div>
          ) : (
            <div className="space-y-2 mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="flex-1"><p className="font-medium text-slate-800 text-sm">{item.name}</p><p className="text-xs text-slate-400">Tannarx: {(item.cost_price || 0).toLocaleString()} so'm</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCart(c => c.map(i => i.id === item.id ? {...i, quantity: Math.max(1, i.quantity-1)} : i))} className="w-6 h-6 bg-white rounded border text-slate-600 flex items-center justify-center text-sm font-bold">−</button>
                    <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                    <button onClick={() => setCart(c => c.map(i => i.id === item.id ? {...i, quantity: i.quantity+1} : i))} className="w-6 h-6 bg-white rounded border text-slate-600 flex items-center justify-center text-sm font-bold">+</button>
                  </div>
                  <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600"><Trash2 size={15}/></button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => submit.mutate()} disabled={cart.length === 0 || submit.isPending}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">
            {submit.isPending ? 'Saqlanmoqda...' : `Chiqimga Chiqarish (${cart.length} tur)`}
          </button>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b bg-slate-50"><h3 className="font-semibold text-slate-700">Chiqimlar Tarixi</h3></div>
          {isLoading ? <div className="p-8 text-center text-slate-400">Yuklanmoqda...</div> :
          writeOffs.length === 0 ? <div className="p-12 text-center text-slate-300"><PackageX size={40} className="mx-auto mb-2"/><p className="text-sm">Chiqim yo'q</p></div> : (
            <div className="divide-y divide-slate-50">
              {writeOffs.map(wo => (
                <div key={wo.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{wo.reason}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(wo.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-600">−{wo.total_cost.toLocaleString()} so'm</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
