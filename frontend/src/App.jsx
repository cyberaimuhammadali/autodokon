import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck,
  LogOut, History as HistoryIcon, Clock, AlertCircle,
  AlertTriangle, BookOpen, BarChart2, PackageX, Settings,
  Wallet, UserCheck, ChevronDown, ChevronRight, ArrowRight
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import POS from './POS';
import CRM from './CRM';
import Supply from './Supply';
import Products from './Products';
import History from './History';
import LowStock from './LowStock';
import DebtBook from './DebtBook';
import Analytics from './Analytics';
import WriteOff from './WriteOff';
import SettingsPage from './SettingsPage';
import Employees from './Employees';
import DailyExpenses from './DailyExpenses';
import Login from './Login';
import api from './api';

// ─── PORTAL DEFINITIONS ───────────────────────────────────────────────────────

const PORTALS = {
  cashier: [
    {
      id: 'sales', label: '💰 Savdo Portali', color: 'from-blue-600 to-blue-700',
      items: [
        { key: 'pos',     path: '/pos',     icon: ShoppingCart, label: 'Kassa (POS)' },
        { key: 'debts',   path: '/debts',   icon: BookOpen,     label: 'Qarz Kitobi' },
        { key: 'history', path: '/history', icon: HistoryIcon,  label: 'Cheklar Tarixi' },
        { key: 'crm',     path: '/crm',     icon: Users,        label: 'Mijozlar' },
      ]
    },
  ],
  manager: [
    {
      id: 'sales', label: '💰 Savdo', color: 'from-blue-600 to-blue-700',
      items: [
        { key: 'pos',     path: '/pos',     icon: ShoppingCart, label: 'Kassa (POS)' },
        { key: 'debts',   path: '/debts',   icon: BookOpen,     label: 'Qarz Kitobi' },
        { key: 'history', path: '/history', icon: HistoryIcon,  label: 'Cheklar Tarixi' },
        { key: 'crm',     path: '/crm',     icon: Users,        label: 'Mijozlar' },
      ]
    },
    {
      id: 'manager', label: '📋 Menejer', color: 'from-emerald-600 to-emerald-700',
      items: [
        { key: 'products',  path: '/products',  icon: Package,       label: 'Mahsulotlar' },
        { key: 'supply',    path: '/supply',    icon: Truck,         label: "Tovar Qabul" },
        { key: 'lowstock',  path: '/lowstock',  icon: AlertTriangle, label: 'Kam Zaxira' },
        { key: 'writeoff',  path: '/writeoff',  icon: PackageX,      label: 'Chiqimga Chiqarish' },
        { key: 'analytics', path: '/analytics', icon: BarChart2,     label: 'Hisobotlar' },
        { key: 'expenses',  path: '/expenses',  icon: Wallet,        label: 'Xarajatlar' },
      ]
    },
  ],
  warehouse: [
    {
      id: 'warehouse', label: '📦 Ombor', color: 'from-orange-500 to-orange-600',
      items: [
        { key: 'products', path: '/products', icon: Package,       label: 'Mahsulotlar' },
        { key: 'supply',   path: '/supply',   icon: Truck,         label: 'Tovar Qabul' },
        { key: 'lowstock', path: '/lowstock', icon: AlertTriangle, label: 'Kam Zaxira' },
        { key: 'writeoff', path: '/writeoff', icon: PackageX,      label: 'Chiqimga Chiqarish' },
      ]
    },
  ],
  owner: [
    {
      id: 'sales', label: '💰 Savdo Portali', color: 'from-blue-600 to-blue-700',
      items: [
        { key: 'pos',     path: '/pos',     icon: ShoppingCart, label: 'Kassa (POS)' },
        { key: 'debts',   path: '/debts',   icon: BookOpen,     label: 'Qarz Kitobi' },
        { key: 'history', path: '/history', icon: HistoryIcon,  label: 'Cheklar Tarixi' },
        { key: 'crm',     path: '/crm',     icon: Users,        label: 'Mijozlar' },
      ]
    },
    {
      id: 'manager', label: '📋 Menejer Portali', color: 'from-emerald-600 to-emerald-700',
      items: [
        { key: 'products', path: '/products', icon: Package,       label: 'Mahsulotlar' },
        { key: 'supply',   path: '/supply',   icon: Truck,         label: 'Tovar Qabul' },
        { key: 'lowstock', path: '/lowstock', icon: AlertTriangle, label: 'Kam Zaxira & Buyurtma' },
        { key: 'writeoff', path: '/writeoff', icon: PackageX,      label: 'Chiqimga Chiqarish' },
      ]
    },
    {
      id: 'owner', label: '👑 Ega Portali', color: 'from-purple-600 to-purple-700',
      items: [
        { key: 'dashboard',  path: '/',           icon: LayoutDashboard, label: 'Bosh Sahifa' },
        { key: 'analytics',  path: '/analytics',  icon: BarChart2,       label: 'Analitika & Foyda' },
        { key: 'expenses',   path: '/expenses',   icon: Wallet,          label: 'Kunlik Xarajatlar' },
        { key: 'employees',  path: '/employees',  icon: UserCheck,       label: 'Ishchilar' },
        { key: 'settings',   path: '/settings',   icon: Settings,        label: 'Sozlamalar' },
      ]
    },
  ],
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const PORTAL_COLORS = {
  sales:    { active: 'bg-blue-600 text-white', hover: 'hover:bg-blue-900/40 hover:text-blue-200', header: 'text-blue-400 border-blue-800' },
  manager:  { active: 'bg-emerald-600 text-white', hover: 'hover:bg-emerald-900/40 hover:text-emerald-200', header: 'text-emerald-400 border-emerald-800' },
  warehouse:{ active: 'bg-orange-600 text-white', hover: 'hover:bg-orange-900/40 hover:text-orange-200', header: 'text-orange-400 border-orange-800' },
  owner:    { active: 'bg-purple-600 text-white', hover: 'hover:bg-purple-900/40 hover:text-purple-200', header: 'text-purple-400 border-purple-800' },
};

function Sidebar({ user, onLogout, attendance }) {
  const location = useLocation();
  const portals = PORTALS[user?.role] || PORTALS.cashier;
  const [openPortals, setOpenPortals] = useState(() => portals.map(p => p.id));

  const togglePortal = (id) => setOpenPortals(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const isOpen = location.pathname === '/' ? !attendance || !attendance.check_in_at : false;

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen shadow-2xl flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">D</div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">DokonPro</h1>
            <p className="text-slate-500 text-xs mt-0.5">ERP v2.0 • 24/7</p>
          </div>
        </div>
      </div>

      {/* User card + Davomat */}
      <div className="px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{
              user?.role === 'owner' ? '👑 Ega' : user?.role === 'manager' ? '📋 Menejer' : user?.role === 'cashier' ? '💰 Kassir' : '📦 Omborchi'
            }</p>
          </div>
        </div>
        <AttendanceWidget />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {portals.map(portal => {
          const colors = PORTAL_COLORS[portal.id] || PORTAL_COLORS.sales;
          const isExpanded = openPortals.includes(portal.id);
          return (
            <div key={portal.id} className="mb-2">
              <button onClick={() => togglePortal(portal.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors mb-1 border ${colors.header}`}>
                <span className="flex-1 text-left">{portal.label}</span>
                {isExpanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
              </button>
              {isExpanded && portal.items.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
                return (
                  <Link key={item.key} to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm font-medium mb-0.5 ${active ? colors.active + ' shadow-lg' : 'text-slate-400 ' + colors.hover}`}>
                    <Icon size={16}/>
                    <span>{item.label}</span>
                    {active && <ChevronRight size={12} className="ml-auto opacity-60"/>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-medium">
          <LogOut size={18}/> Tizimdan chiqish
        </button>
      </div>
    </div>
  );
}

// ─── ATTENDANCE WIDGET ────────────────────────────────────────────────────────

function AttendanceWidget() {
  const { data: att, refetch } = useQuery({
    queryKey: ['my_attendance'],
    queryFn: async () => (await api.get('/attendance/today')).data,
    refetchInterval: 60000,
  });

  const [msg, setMsg] = useState('');

  const checkIn = useMutation({
    mutationFn: () => api.post('/attendance/check-in'),
    onSuccess: (res) => { setMsg(res.data.message); refetch(); },
  });

  const checkOut = useMutation({
    mutationFn: () => api.post('/attendance/check-out'),
    onSuccess: (res) => { setMsg(res.data.message); refetch(); },
  });

  if (!att) return null;

  return (
    <div className="mt-2">
      {msg && <p className="text-xs text-emerald-400 text-center mb-1 truncate">{msg}</p>}
      {att.status === 'not_checked_in' ? (
        <button onClick={() => checkIn.mutate()} disabled={checkIn.isPending}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">
          ✅ Keldim
        </button>
      ) : att.status === 'checked_in' ? (
        <div className="space-y-1">
          <p className="text-xs text-emerald-400 text-center">✅ Keldi: {att.check_in_at ? new Date(att.check_in_at).toLocaleTimeString('uz', {hour:'2-digit',minute:'2-digit'}) : ''}</p>
          <button onClick={() => checkOut.mutate()} disabled={checkOut.isPending}
            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors">
            👋 Ketdim
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-1">
          ✅ {att.check_in_at ? new Date(att.check_in_at).toLocaleTimeString('uz', {hour:'2-digit',minute:'2-digit'}) : ''} → 👋 {att.check_out_at ? new Date(att.check_out_at).toLocaleTimeString('uz', {hour:'2-digit',minute:'2-digit'}) : ''}
        </p>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard() {
  const { data: stats, isLoading } = useQuery({
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
    queryFn: async () => { try { return (await api.get('/shifts/current?branch_id=1')).data; } catch { return null; } },
    refetchInterval: 30000,
  });
  const { data: debtStats } = useQuery({
    queryKey: ['debt_stats'],
    queryFn: async () => (await api.get('/debts/stats')).data,
  });

  const cards = [
    { label: "Bugungi Sotuv",  value: `${(stats?.total_sales_today || 0).toLocaleString()} so'm`, color: 'border-l-blue-500',    icon: '💰' },
    { label: "Mahsulotlar",    value: `${stats?.total_products || 0} tur`,                         color: 'border-l-emerald-500', icon: '📦' },
    { label: "Mijozlar",       value: `${stats?.total_customers || 0} nafar`,                      color: 'border-l-purple-500',  icon: '👥' },
    { label: "Jami Qarz",      value: `${(debtStats?.total_owed || 0).toLocaleString()} so'm`,     color: 'border-l-red-500',     icon: '📋' },
  ];

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bosh Sahifa</h2>
          <p className="text-slate-400 text-sm mt-0.5">{new Date().toLocaleDateString('uz-UZ', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</p>
        </div>
        {shift ? (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/><Clock size={14}/> Smena ochiq — {new Date(shift.opened_at).toLocaleTimeString('uz', {hour:'2-digit',minute:'2-digit'})}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold">
            <AlertCircle size={14}/> Smena yopiq
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-6">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse"/>)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {cards.map((c, i) => (
            <div key={i} className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 ${c.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{c.icon}</span>
                <p className="text-slate-500 text-sm">{c.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-72">
        <h3 className="text-base font-bold text-slate-800 mb-4">Oxirgi 7 kunlik savdo</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
            <Tooltip formatter={(v) => [`${v.toLocaleString()} so'm`, 'Sotuv']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}/>
            <Line type="monotone" dataKey="sotuv" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return stored && token ? JSON.parse(stored) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Login setUser={setUser}/>;

  return (
    <BrowserRouter>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar user={user} onLogout={handleLogout}/>
        <main className="flex-1 h-screen overflow-hidden">
          <Routes>
            <Route path="/"           element={<Dashboard/>}/>
            <Route path="/pos"        element={<POS/>}/>
            <Route path="/products"   element={<Products/>}/>
            <Route path="/crm"        element={<CRM/>}/>
            <Route path="/supply"     element={<Supply/>}/>
            <Route path="/history"    element={<History/>}/>
            <Route path="/lowstock"   element={<LowStock/>}/>
            <Route path="/debts"      element={<DebtBook/>}/>
            <Route path="/analytics"  element={<Analytics/>}/>
            <Route path="/writeoff"   element={<WriteOff/>}/>
            <Route path="/settings"   element={<SettingsPage/>}/>
            <Route path="/employees"  element={<Employees/>}/>
            <Route path="/expenses"   element={<DailyExpenses/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
