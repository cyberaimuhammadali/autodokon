import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck,
  LogOut, History as HistoryIcon, Clock, ChevronRight, AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import POS from './POS';
import CRM from './CRM';
import Supply from './Supply';
import Products from './Products';
import History from './History';
import Login from './Login';
import api from './api';

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

const ROLE_MENUS = {
  owner:    ['dashboard','products','pos','crm','supply','history'],
  manager:  ['dashboard','products','pos','crm','supply','history'],
  cashier:  ['pos'],
  warehouse:['products','supply'],
};

const MENU_ITEMS = [
  { key: 'dashboard', path: '/',         icon: LayoutDashboard, label: 'Bosh Sahifa' },
  { key: 'products',  path: '/products', icon: Package,         label: 'Mahsulotlar' },
  { key: 'pos',       path: '/pos',      icon: ShoppingCart,    label: 'Kassa (POS)' },
  { key: 'crm',       path: '/crm',      icon: Users,           label: 'Mijozlar (CRM)' },
  { key: 'supply',    path: '/supply',   icon: Truck,           label: "Ta'minot" },
  { key: 'history',   path: '/history',  icon: HistoryIcon,     label: 'Sotuvlar Tarixi' },
];

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const allowed = ROLE_MENUS[user?.role] || ['pos'];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen shadow-2xl flex-shrink-0">
      <div className="p-5 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">DokonPro</h1>
        <p className="text-slate-500 text-xs mt-0.5">ERP v2.0</p>
      </div>

      <div className="px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {user?.full_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-none">{user?.full_name}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {MENU_ITEMS.filter(m => allowed.includes(m.key)).map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon size={18} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-medium"
        >
          <LogOut size={18} /> Tizimdan chiqish
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/analytics/dashboard')).data,
    refetchInterval: 30000,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ['chart'],
    queryFn: async () => (await api.get('/analytics/chart')).data,
  });

  const { data: shift } = useQuery({
    queryKey: ['current_shift'],
    queryFn: async () => {
      try { return (await api.get('/shifts/current?branch_id=1')).data; }
      catch { return null; }
    },
    refetchInterval: 30000,
  });

  const cards = [
    { label: "Bugungi Sotuv", value: `${(stats?.total_sales_today || 0).toLocaleString()} so'm`, color: 'border-l-blue-500', text: 'text-slate-800' },
    { label: "Mahsulotlar",   value: `${stats?.total_products || 0} tur`,       color: 'border-l-emerald-500', text: 'text-slate-800' },
    { label: "Mijozlar",      value: `${stats?.total_customers || 0} nafar`,    color: 'border-l-purple-500',  text: 'text-slate-800' },
    { label: "Kam Zaxira",    value: `${stats?.low_stock_items || 0} tur`,      color: 'border-l-red-500',     text: 'text-red-600' },
  ];

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Bosh Sahifa</h2>
        {shift ? (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium">
            <Clock size={14} /> Smena ochiq — {new Date(shift.opened_at).toLocaleTimeString()}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">
            <AlertCircle size={14} /> Smena yopiq
          </div>
        )}
      </div>

      {statsLoading ? (
        <div className="flex gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="flex-1 h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-6 mb-8">
          {cards.map((c, i) => (
            <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 ${c.color}`}>
              <p className="text-slate-500 text-sm font-medium">{c.label}</p>
              <p className={`text-2xl font-bold mt-2 ${c.text}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
        <h3 className="text-base font-bold text-slate-800 mb-4">Oxirgi 7 kunlik savdo dinamikasi</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip
              formatter={(v) => [`${v.toLocaleString()} so'm`, 'Sotuv']}
              contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            />
            <Line type="monotone" dataKey="sotuv" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = React.useState(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return stored && token ? JSON.parse(stored) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <BrowserRouter>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 h-screen overflow-hidden">
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/pos"      element={<POS />} />
            <Route path="/crm"      element={<CRM />} />
            <Route path="/supply"   element={<Supply />} />
            <Route path="/history"  element={<History />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
