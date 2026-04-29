import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, Clock, DollarSign, ShoppingBag, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from './api';

const PERIODS = [{ key: 'today', label: 'Bugun' }, { key: 'week', label: 'Bu hafta' }, { key: 'month', label: 'Bu oy' }];

export default function Analytics() {
  const [period, setPeriod] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['owner_analytics', period],
    queryFn: async () => (await api.get(`/analytics/owner?period=${period}`)).data,
    refetchInterval: 60000,
  });

  const hourData = data?.hour_sales
    ? Array.from({ length: 24 }, (_, h) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        sotuv: data.hour_sales[h] || 0,
      }))
    : [];

  const cards = data ? [
    { icon: DollarSign,  label: 'Daromad',     value: `${data.total_revenue.toLocaleString()} so'm`, color: 'text-blue-600',    bg: 'bg-blue-50' },
    { icon: TrendingUp,  label: 'Sof Foyda',   value: `${data.profit.toLocaleString()} so'm`,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Target,      label: 'Marja',        value: `${data.margin_percent}%`,                      color: 'text-purple-600',  bg: 'bg-purple-50' },
    { icon: ShoppingBag, label: 'Cheklar',      value: `${data.total_receipts} ta`,                    color: 'text-orange-600',  bg: 'bg-orange-50' },
    { icon: BarChart2,   label: "O'rt. Chek",   value: `${data.avg_receipt.toLocaleString()} so'm`,   color: 'text-pink-600',    bg: 'bg-pink-50' },
    { icon: Clock,       label: 'Zo\'r soat',   value: data.best_hour !== null ? `${String(data.best_hour).padStart(2,'0')}:00–${String(data.best_hour+1).padStart(2,'0')}:00` : '—', color: 'text-amber-600', bg: 'bg-amber-50' },
  ] : [];

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><BarChart2 className="text-purple-500" size={28}/>Egasi Analitikasi</h2>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === p.key ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-8">{[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-white rounded-xl animate-pulse"/>)}</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                      <Icon size={20} className={c.color}/>
                    </div>
                    <p className="text-slate-500 text-sm">{c.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Daily Sales */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Kunlik Savdo Grafigi</h3>
              {(data?.daily_chart || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.daily_chart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false}/>
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                    <Tooltip formatter={v => [`${v.toLocaleString()} so'm`]} contentStyle={{ borderRadius:'10px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}/>
                    <Line type="monotone" dataKey="sotuv" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-56 flex items-center justify-center text-slate-300 text-sm">Ma'lumot yo'q</div>}
            </div>

            {/* Hourly Heatmap */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Soatlik Savdo Aktivligi</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourData.filter(h => h.sotuv > 0 || [9,10,11,12,13,14,15,16,17,18,19,20].includes(parseInt(h.hour)))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                  <XAxis dataKey="hour" fontSize={9} tickLine={false} axisLine={false}/>
                  <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                  <Tooltip formatter={v => [`${v.toLocaleString()} so'm`]} contentStyle={{ borderRadius:'10px', border:'none' }}/>
                  <Bar dataKey="sotuv" radius={[4,4,0,0]}>
                    {hourData.map((h, idx) => (
                      <Cell key={idx} fill={data?.best_hour === parseInt(h.hour) ? '#8b5cf6' : h.sotuv > 0 ? '#c4b5fd' : '#e2e8f0'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {data?.best_hour !== null && (
                <p className="text-xs text-center text-slate-500 mt-2">
                  Eng zo'r soat: <span className="font-bold text-purple-600">{String(data.best_hour).padStart(2,'0')}:00 – {String(data.best_hour+1).padStart(2,'0')}:00</span>
                </p>
              )}
            </div>
          </div>

          {/* Profit Summary */}
          {data && (
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-2xl text-white">
              <h3 className="font-bold text-white/80 mb-4 text-sm uppercase tracking-wider">Moliyaviy Xulosa — {PERIODS.find(p=>p.key===period)?.label}</h3>
              <div className="grid grid-cols-3 gap-6">
                <div><p className="text-white/70 text-xs">Umumiy daromad</p><p className="text-2xl font-bold">{data.total_revenue.toLocaleString()}</p></div>
                <div><p className="text-white/70 text-xs">Tovar tannarxi</p><p className="text-2xl font-bold text-red-200">-{data.total_cost.toLocaleString()}</p></div>
                <div><p className="text-white/70 text-xs">Sof foyda</p><p className="text-2xl font-bold text-emerald-300">{data.profit.toLocaleString()} so'm</p></div>
              </div>
              <div className="mt-4 bg-white/10 rounded-xl h-3 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-xl transition-all" style={{ width: `${Math.min(data.margin_percent, 100)}%` }}/>
              </div>
              <p className="text-white/70 text-xs mt-1">Foyda marjasi: {data.margin_percent}%</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
