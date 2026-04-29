import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, CreditCard, CheckCircle, Clock, AlertCircle, X, Search } from 'lucide-react';
import api from './api';

export default function DebtBook() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(null);
  const [form, setForm] = useState({ customer_id: '', total_amount: '', due_date: '', notes: '' });
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash' });
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts', filter],
    queryFn: async () => (await api.get(`/debts/${filter ? `?status=${filter}` : ''}`)).data,
    refetchInterval: 30000,
  });
  const { data: stats } = useQuery({ queryKey: ['debt_stats'], queryFn: async () => (await api.get('/debts/stats')).data });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: async () => (await api.get('/customers/')).data });

  const addDebt = useMutation({
    mutationFn: (d) => api.post('/debts/', d),
    onSuccess: () => { qc.invalidateQueries(['debts']); qc.invalidateQueries(['debt_stats']); setShowAdd(false); setForm({ customer_id: '', total_amount: '', due_date: '', notes: '' }); setMsg('Qarz qayd etildi va Telegramga xabar ketdi!'); },
  });

  const payDebt = useMutation({
    mutationFn: ({ id, data }) => api.post(`/debts/${id}/pay`, data),
    onSuccess: () => { qc.invalidateQueries(['debts']); qc.invalidateQueries(['debt_stats']); setShowPay(null); setMsg("To'lov qayd etildi!"); },
  });

  const filtered = debts.filter(d => {
    const cust = customers.find(c => c.id === d.customer_id);
    return !search || cust?.full_name?.toLowerCase().includes(search.toLowerCase()) || cust?.phone?.includes(search);
  });

  const statusBadge = (status) => ({
    open:    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">Ochiq</span>,
    partial: <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-semibold">Qisman</span>,
    paid:    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">To'landi</span>,
  }[status] || null);

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><BookOpen className="text-red-500" size={28}/>Qarz Kitobi</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
          <Plus size={18}/> Yangi Qarz
        </button>
      </div>

      {msg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2"><CheckCircle size={16}/>{msg}<button onClick={()=>setMsg('')} className="ml-auto">×</button></div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
          <p className="text-slate-500 text-sm">Jami qarz</p>
          <p className="text-2xl font-bold text-red-600">{(stats?.total_owed || 0).toLocaleString()} so'm</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
          <p className="text-slate-500 text-sm">Ochiq qarzlar</p>
          <p className="text-2xl font-bold text-slate-800">{stats?.open_count || 0} ta</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <p className="text-slate-500 text-sm">Jami mijozlar</p>
          <p className="text-2xl font-bold text-slate-800">{customers.length} ta</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mijoz nomi yoki telefon..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"/>
        </div>
        {['', 'open', 'partial', 'paid'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === s ? 'bg-blue-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s === '' ? 'Barchasi' : s === 'open' ? 'Ochiq' : s === 'partial' ? 'Qisman' : "To'langan"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-slate-400">Yuklanmoqda...</div> :
        filtered.length === 0 ? <div className="p-12 text-center text-slate-400"><BookOpen size={48} className="mx-auto mb-3 opacity-30"/><p>Qarz topilmadi</p></div> : (
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-xs uppercase bg-slate-50 border-b">
              <th className="p-4 text-left">Mijoz</th><th className="p-4 text-right">Umumiy</th>
              <th className="p-4 text-right">To'landi</th><th className="p-4 text-right">Qoldi</th>
              <th className="p-4 text-center">Muddat</th><th className="p-4 text-center">Holat</th><th className="p-4"></th>
            </tr></thead>
            <tbody>
              {filtered.map(d => {
                const cust = customers.find(c => c.id === d.customer_id);
                const remaining = d.total_amount - d.paid_amount;
                const overdue = d.due_date && new Date(d.due_date) < new Date() && d.status !== 'paid';
                return (
                  <tr key={d.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${overdue ? 'bg-red-50/50' : ''}`}>
                    <td className="p-4"><p className="font-medium text-slate-800">{cust?.full_name || '—'}</p><p className="text-xs text-slate-400">{cust?.phone}</p></td>
                    <td className="p-4 text-right text-slate-700">{d.total_amount.toLocaleString()}</td>
                    <td className="p-4 text-right text-emerald-600">{d.paid_amount.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-red-600">{remaining.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      {d.due_date ? <span className={`text-xs ${overdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>{new Date(d.due_date).toLocaleDateString()}{overdue ? ' ⚠️' : ''}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-4 text-center">{statusBadge(d.status)}</td>
                    <td className="p-4 text-right">
                      {d.status !== 'paid' && (
                        <button onClick={() => { setShowPay(d); setPayForm({ amount: String(remaining), method: 'cash' }); }}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors">To'lov</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Debt Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[480px] shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800 text-lg">Yangi Qarz Qayd Etish</h3><button onClick={()=>setShowAdd(false)}><X size={20} className="text-slate-400"/></button></div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Mijoz *</label>
                <select value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">Mijozni tanlang</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Qarz summasi (so'm) *</label>
                <input type="number" value={form.total_amount} onChange={e=>setForm({...form,total_amount:e.target.value})}
                  placeholder="500000" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">To'lash muddati</label>
                <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Izoh</label>
                <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  placeholder="Qarzga olgan nima..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
              </div>
              <p className="text-xs text-slate-400 bg-blue-50 rounded-lg p-3">💡 Qarz qayd etilgandan so'ng, Telegram ga avtomatik xabar yuboriladi.</p>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={()=>setShowAdd(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-colors">Bekor</button>
              <button onClick={()=>addDebt.mutate({...form, customer_id:parseInt(form.customer_id), total_amount:parseFloat(form.total_amount)})}
                disabled={!form.customer_id || !form.total_amount || addDebt.isPending}
                className="flex-1 py-2.5 bg-red-600 rounded-xl font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {addDebt.isPending ? 'Saqlanmoqda...' : 'Qarzni Qayd Etish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] shadow-2xl">
            <div className="p-5 border-b flex justify-between"><h3 className="font-bold text-slate-800">Qarz To'lovi</h3><button onClick={()=>setShowPay(null)}><X size={20} className="text-slate-400"/></button></div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-sm text-slate-500">Qolgan qarz</p>
                <p className="text-2xl font-bold text-red-600">{(showPay.total_amount - showPay.paid_amount).toLocaleString()} so'm</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">To'lov summasi</label>
                <input type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
              </div>
              <div className="flex gap-2">
                {['cash','uzcard','humo'].map(m => (
                  <button key={m} onClick={()=>setPayForm({...payForm,method:m})}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${payForm.method === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {m === 'cash' ? 'Naqd' : m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={()=>setShowPay(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-slate-700">Bekor</button>
              <button onClick={()=>payDebt.mutate({id:showPay.id,data:{amount:parseFloat(payForm.amount),method:payForm.method}})}
                disabled={!payForm.amount || payDebt.isPending}
                className="flex-1 py-2.5 bg-emerald-600 rounded-xl font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                {payDebt.isPending ? 'Saqlanmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
