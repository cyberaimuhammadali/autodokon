import React, { useState, useRef } from 'react';
import { ScanBarcode, User, Banknote, CreditCard, Trash2, Plus, Minus, X, Printer } from 'lucide-react';
import api from './api';

const PAYMENT_METHODS = [
  { key: 'cash',    label: 'Naqd',   color: 'bg-emerald-500' },
  { key: 'uzcard', label: 'UZCARD', color: 'bg-blue-500' },
  { key: 'humo',   label: 'HUMO',   color: 'bg-orange-500' },
  { key: 'payme',  label: 'Payme',  color: 'bg-cyan-500' },
  { key: 'click',  label: 'Click',  color: 'bg-purple-500' },
  { key: 'bonus',  label: 'Bonus',  color: 'bg-pink-500' },
];

export default function POS() {
  const [cart, setCart] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null);
  const [payments, setPayments] = useState([{ method: 'cash', amount: '' }]);
  const barcodeRef = useRef(null);

  const getCartTotal = () => cart.reduce((s, i) => s + i.total_price, 0);
  const getPaidTotal = () => payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const getChange = () => Math.max(0, getPaidTotal() - getCartTotal());

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.price }
          : i
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1, total_price: product.price }];
    });
  };

  const updateQty = (product_id, delta) => {
    setCart(prev => prev
      .map(i => i.product_id === product_id ? { ...i, quantity: i.quantity + delta, total_price: (i.quantity + delta) * i.price } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    try {
      const res = await api.get(`/products/barcode/${barcode.trim()}`);
      addToCart(res.data);
      setBarcode('');
      setError('');
    } catch {
      setError('Mahsulot topilmadi!');
    }
    barcodeRef.current?.focus();
  };

  const handleFindCustomer = async () => {
    if (!customerPhone) return;
    try {
      const res = await api.get(`/customers/phone/${customerPhone}`);
      setCustomer(res.data);
      setError('');
    } catch {
      setError('Mijoz topilmadi!');
    }
  };

  const openPayModal = () => {
    setPayments([{ method: 'cash', amount: String(getCartTotal()) }]);
    setShowPayModal(true);
  };

  const addPaymentRow = () => {
    setPayments(prev => [...prev, { method: 'uzcard', amount: '' }]);
  };

  const updatePayment = (idx, field, value) => {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removePaymentRow = (idx) => {
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || getPaidTotal() < getCartTotal()) return;

    const currentShift = await api.get('/shifts/current?branch_id=1').catch(() => null);

    const receiptData = {
      branch_id: 1,
      customer_id: customer?.id || null,
      shift_id: currentShift?.data?.id || null,
      total_amount: getCartTotal(),
      discount_amount: 0,
      items: cart.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
        total_price: i.total_price,
      })),
      payments: payments
        .filter(p => parseFloat(p.amount) > 0)
        .map(p => ({ method: p.method, amount: parseFloat(p.amount) })),
    };

    try {
      await api.post('/receipts/', receiptData);
      setShowPayModal(false);
      setShowReceipt({
        items: [...cart],
        customer,
        total: getCartTotal(),
        change: getChange(),
        payments: [...payments],
        date: new Date().toLocaleString(),
      });
      setCart([]);
      setCustomer(null);
      setCustomerPhone('');
    } catch {
      setError('Xatolik yuz berdi!');
    }
  };

  return (
    <div className="p-6 h-full bg-slate-50 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-slate-800">
        <ScanBarcode className="text-blue-500" size={28} /> Kassa (Point of Sale)
      </h2>

      <div className="flex gap-5 h-[calc(100vh-140px)]">
        {/* LEFT: Scan + Cart */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Scan */}
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <form onSubmit={handleScan} className="flex gap-2">
              <input
                ref={barcodeRef} type="text" autoFocus value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="Shtrix-kod yoki mahsulot nomi..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-400 text-sm"
              />
              <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                Qo'shish
              </button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          {/* Cart */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <ScanBarcode size={64} />
                <p className="mt-3 text-sm">Shtrix-kodni skanerlang yoki qidiring</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr className="text-slate-500 text-xs uppercase">
                    <th className="p-3 text-left">Mahsulot</th>
                    <th className="p-3 text-center">Soni</th>
                    <th className="p-3 text-right">Narxi</th>
                    <th className="p-3 text-right">Jami</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.product_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-slate-700">{item.name}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateQty(item.product_id, -1)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><Minus size={14} /></button>
                          <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, 1)} className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"><Plus size={14} /></button>
                        </div>
                      </td>
                      <td className="p-3 text-right text-slate-600">{item.price.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-slate-800">{item.total_price.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => setCart(c => c.filter(i => i.product_id !== item.product_id))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: Customer + Total + Checkout */}
        <div className="w-72 flex flex-col gap-4">
          {/* Customer */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2"><User size={16} />Mijoz</h3>
            {customer ? (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="font-semibold text-slate-800 text-sm">{customer.full_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">Bonus: {customer.bonus_balance?.toLocaleString()} so'm</p>
                <button onClick={() => { setCustomer(null); setCustomerPhone(''); }} className="text-xs text-red-400 mt-2 hover:text-red-600">Bekor qilish</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+998..." onKeyDown={e => e.key === 'Enter' && handleFindCustomer()}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                <button onClick={handleFindCustomer} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">Topish</button>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex-1">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>Tovarlar ({cart.length})</span>
              <span>{getCartTotal().toLocaleString()} so'm</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 mb-4">
              <span>Chegirma</span>
              <span>0 so'm</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-dashed pt-3">
              <span>JAMI</span>
              <span>{getCartTotal().toLocaleString()} so'm</span>
            </div>
          </div>

          <button
            onClick={openPayModal}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-600/30"
          >
            To'lov qilish
          </button>
          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="w-full p-3 border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40 font-medium text-sm"
          >
            Savatni tozalash
          </button>
        </div>
      </div>

      {/* ─── PAYMENT MODAL ─────────────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[480px] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">To'lov usuli</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-lg font-bold text-slate-800 bg-slate-50 rounded-xl p-3">
                <span>Jami to'lov:</span>
                <span>{getCartTotal().toLocaleString()} so'm</span>
              </div>

              {payments.map((pay, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={pay.method}
                    onChange={e => updatePayment(idx, 'method', e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400"
                  >
                    {PAYMENT_METHODS.filter(m => m.key !== 'bonus' || customer).map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                  <input
                    type="number" value={pay.amount}
                    onChange={e => updatePayment(idx, 'amount', e.target.value)}
                    placeholder="Summa"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  {payments.length > 1 && (
                    <button onClick={() => removePaymentRow(idx)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"><X size={16}/></button>
                  )}
                </div>
              ))}

              <button onClick={addPaymentRow} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium py-1">
                <Plus size={16}/> Boshqa to'lov usuli qo'shish
              </button>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-slate-500">Kiritildi:</span>
                <span className={`font-bold ${getPaidTotal() >= getCartTotal() ? 'text-emerald-600' : 'text-red-500'}`}>
                  {getPaidTotal().toLocaleString()} so'm
                </span>
              </div>
              {getChange() > 0 && (
                <div className="flex justify-between items-center text-lg font-bold text-emerald-600 bg-emerald-50 rounded-xl p-3">
                  <span>Qaytim:</span>
                  <span>{getChange().toLocaleString()} so'm</span>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-colors">Bekor</button>
              <button
                onClick={handleCheckout}
                disabled={getPaidTotal() < getCartTotal()}
                className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RECEIPT MODAL ─────────────────────────────────────────────────── */}
      {showReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 print:bg-white print:static">
          <div className="bg-white rounded-2xl w-96 shadow-2xl flex flex-col items-center print:shadow-none print:rounded-none">
            <div id="printable-receipt" className="w-full p-6 text-slate-800 flex flex-col items-center">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mb-3">
                <Printer size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold">DokonPro ERP</h2>
              <p className="text-xs text-slate-400 border-b border-dashed border-slate-200 w-full text-center pb-3 mb-3">Xarid Cheki</p>

              <div className="w-full text-xs space-y-1 mb-3 text-slate-600">
                <div className="flex justify-between"><span>Sana:</span><span>{showReceipt.date}</span></div>
                {showReceipt.customer && <div className="flex justify-between"><span>Mijoz:</span><span className="font-medium">{showReceipt.customer.full_name}</span></div>}
                <div className="flex justify-between"><span>To'lov:</span>
                  <span>{showReceipt.payments.filter(p=>parseFloat(p.amount)>0).map(p=>`${p.method} ${parseFloat(p.amount).toLocaleString()}`).join(' + ')}</span>
                </div>
              </div>

              <table className="w-full text-xs mb-3">
                <thead className="border-b border-dashed border-slate-200">
                  <tr className="text-slate-500"><th className="text-left pb-1">Nomi</th><th className="text-center pb-1">Soni</th><th className="text-right pb-1">Summa</th></tr>
                </thead>
                <tbody>
                  {showReceipt.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="py-1">{item.name}</td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">{item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="w-full text-right font-bold text-base border-t border-dashed border-slate-200 pt-2 mb-1">
                Jami: {showReceipt.total.toLocaleString()} so'm
              </div>
              {showReceipt.change > 0 && (
                <div className="w-full text-right text-sm text-emerald-600 font-medium mb-2">
                  Qaytim: {showReceipt.change.toLocaleString()} so'm
                </div>
              )}
              <p className="text-xs text-center text-slate-400 mt-2">Xaridingiz uchun rahmat!</p>
            </div>

            <div className="flex gap-3 w-full p-4 border-t border-slate-100 print:hidden">
              <button onClick={() => setShowReceipt(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Yopish</button>
              <button onClick={() => { window.print(); setShowReceipt(null); }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Printer size={16}/> Chop etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
