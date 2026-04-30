import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, Trash2, CheckCircle, PieChart } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from './api';

const CATEGORIES = [
  { key: 'ijara',      label: 'Ijara',         color: '#6366f1' },
  { key: 'elektr',     label: 'Elektr/Gaz/Suv', color: '#f59e0b' },
  { key: 'maosh',      label: 'Maosh',          color: '#10b981' },
  { key: 'transport',  label: 'Transport',       color: '#3b82f6' },
  { key: 'aloqa',      label: 'Aloqa/Internet',  color: '#8b5cf6' },
  { key: 'ta\'mirlash', label: 'Ta\'mirlash',    color: '#ef4444' },
  { key: 'boshqa',     label: 'Boshqa',          color: '#94a3b8' },
];

const CAT_COLORS = Object.fromEntries(CATEGORIES.map(c => [c.key, c.color]));
const CAT_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.key, c.label]));

export default function DailyExpenses() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ amount: '', category: 'ijara', description: '' });
  const [msg, setMsg] = useState('');

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', selectedDate],
    queryFn: async () => (await api.get(`/daily-expenses/?expense_date=${selectedDate}`)).data,
  });

  const { data: summary } = useQuery({
    queryKey: ['expense_summary', period],
    queryFn: async () => (await api.get(`/daily-expenses/summary?period=${period}`)).data,
  });

  const { data: ownerData } = useQuery({
    queryKey: ['owner_analytics', period],
    queryFn: async () => (await api.get(`/analytics/owner?period=${period}`)).data,
  });

  const addExpense = useMutation({
    mutationFn: (d) => api.post('/daily-expenses/', d),
    onSuccess: () => { qc.invalidateQueries(['expenses']); qc.invalidateQueries(['expense_summary']); setForm({...form, amount: '', description: ''}); setMsg('Xarajat qo\'shildi!'); },
  });

  const delExpense = useMutation({
    mutationFn: (id) => api.delete(`/daily-expenses/${id}`),
    onSuccess: () => { qc.invalidateQueries(['expenses']); qc.invalidateQueries(['expense_summary']); },
  });

  const pieData = summary?.by_category
    ? Object.entries(summary.by_category).map(([key, val]) => ({ name: CAT_LABELS[key] || key, value: val, color: CAT_COLORS[key] || '#94a3b8' }))
    : [];

  const totalIncome = ownerData?.total_revenue || 0;
  const totalExpense = summary?.total || 0;
  const netProfit = (ownerData?.profit || 0) - totalExpense;

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Wallet className="text-emerald-500" size={28}/>Kunlik Xarajatlar</h2>
        <div className="flex gap-2">
          {['today','week','month'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === p ? 'bg-emerald-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {p === 'today' ? 'Bugun' : p === 'week' ? 'Hafta' : 'Oy'}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2"><CheckCircle size={16}/>{msg}<button onClick={()=>setMsg('')} className="ml-auto">×</button></div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <p className="text-slate-500 text-sm">Daromad ({period === 'today' ? 'bugun' : period === 'week' ? 'hafta' : 'oy'})</p>
          <p className="text-2xl font-bold text-blue-600">{totalIncome.toLocaleString()} so'm</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
          <p className="text-slate-500 text-sm">Xarajatlar</p>
          <p className="text-2xl font-bold text-red-600">-{totalExpense.toLocaleString()} so'm</p>
        </div>
        <div className={`p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 ${netProfit >= 0 ? 'border-l-emerald-500 bg-white' : 'border-l-red-500 bg-red-50'}`}>
          <p className="text-slate-500 text-sm">Sof Foyda</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{netProfit.toLocaleString()} so'm</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Add Expense */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Xarajat Qo'shish</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Sana</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"/>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Kategoriya</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Summa (so'm)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                placeholder="500000" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"/>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Izoh</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Nima uchun..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"/>
            </div>
            <button onClick={() => addExpense.mutate({...form, amount: parseFloat(form.amount), expense_date: selectedDate})}
              disabled={!form.amount || addExpense.isPending}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus size={18}/>{addExpense.isPending ? 'Saqlanmoqda...' : 'Xarajat Qo\'shish'}
            </button>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Kategoriyalar bo'yicha</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                </Pie>
                <Tooltip formatter={v => [`${v.toLocaleString()} so'm`]} contentStyle={{ borderRadius: '10px', border: 'none' }}/>
              </RechartsPie>
            </ResponsiveContainer>
          ) : <div className="h-56 flex items-center justify-center text-slate-300"><PieChart size={48}/></div>}
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">{selectedDate} — Xarajatlar ro'yxati</h3>
          <p className="text-sm text-red-600 font-bold">Jami: -{expenses.reduce((s,e) => s+e.amount, 0).toLocaleString()} so'm</p>
        </div>
        {expenses.length === 0 ? (
          <div className="p-10 text-center text-slate-300"><Wallet size={40} className="mx-auto mb-2"/><p className="text-sm">Bu kun xarajat yo'q</p></div>
        ) : (
          <div className="divide-y divide-slate-50">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center p-4 hover:bg-slate-50 transition-colors">
                <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: CAT_COLORS[e.category] || '#94a3b8' }}/>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{CAT_LABELS[e.category] || e.category}</p>
                  {e.description && <p className="text-xs text-slate-400">{e.description}</p>}
                </div>
                <p className="font-bold text-red-600 mr-4">-{e.amount.toLocaleString()}</p>
                <button onClick={() => { if(confirm('O\'chirishga ishonchingiz komilmi?')) delExpense.mutate(e.id); }}
                  className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
