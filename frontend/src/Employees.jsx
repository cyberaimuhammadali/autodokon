import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle, X, Shield, Clock } from 'lucide-react';
import api from './api';

const ROLES = [
  { key: 'owner',     label: 'Ega (Owner)',       color: 'bg-purple-100 text-purple-700' },
  { key: 'manager',   label: 'Menejer',            color: 'bg-blue-100 text-blue-700' },
  { key: 'cashier',   label: 'Kassir',             color: 'bg-emerald-100 text-emerald-700' },
  { key: 'warehouse', label: 'Omborchi',           color: 'bg-orange-100 text-orange-700' },
];

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  cashier: 'bg-emerald-100 text-emerald-700',
  warehouse: 'bg-orange-100 text-orange-700',
};
const ROLE_LABELS = { owner: 'Ega', manager: 'Menejer', cashier: 'Kassir', warehouse: 'Omborchi' };

export default function Employees() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showPin, setShowPin] = useState({});
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ username: '', full_name: '', password: '', role: 'cashier', pin_code: '', branch_id: 1 });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/employees/')).data,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance_today'],
    queryFn: async () => (await api.get(`/attendance/?work_date=${new Date().toISOString().split('T')[0]}`)).data,
    refetchInterval: 30000,
  });

  const createEmp = useMutation({
    mutationFn: (d) => api.post('/employees/', d),
    onSuccess: () => { qc.invalidateQueries(['employees']); setShowModal(false); resetForm(); setMsg('Ishchi qo\'shildi!'); },
    onError: (e) => setMsg(`Xatolik: ${e.response?.data?.detail || e.message}`),
  });

  const updateEmp = useMutation({
    mutationFn: ({ id, data }) => api.put(`/employees/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['employees']); setShowModal(false); setEditUser(null); resetForm(); setMsg('Ishchi ma\'lumotlari yangilandi!'); },
  });

  const deactivateEmp = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => { qc.invalidateQueries(['employees']); setMsg('Ishchi o\'chirildi.'); },
  });

  const resetForm = () => setForm({ username: '', full_name: '', password: '', role: 'cashier', pin_code: '', branch_id: 1 });

  const openEdit = (emp) => {
    setEditUser(emp);
    setForm({ username: emp.username, full_name: emp.full_name, password: '', role: emp.role, pin_code: emp.pin_code || '', branch_id: emp.branch_id });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editUser) {
      const data = { full_name: form.full_name, role: form.role, pin_code: form.pin_code };
      updateEmp.mutate({ id: editUser.id, data });
    } else {
      createEmp.mutate(form);
    }
  };

  const getAttendance = (userId) => attendance.find(a => a.user_id === userId);

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Users className="text-blue-500" size={28}/>Ishchilar Boshqaruvi</h2>
        <button onClick={() => { resetForm(); setEditUser(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
          <Plus size={18}/> Yangi Ishchi
        </button>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${msg.startsWith('Xatolik') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
        <CheckCircle size={16}/>{msg}<button onClick={()=>setMsg('')} className="ml-auto">×</button></div>}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {ROLES.map(r => {
          const count = employees.filter(e => e.role === r.key && e.is_active).length;
          return (
            <div key={r.key} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.color}`}>
                <Shield size={18}/>
              </div>
              <div><p className="text-xs text-slate-500">{r.label}</p><p className="text-2xl font-bold text-slate-800">{count}</p></div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? <div className="p-10 text-center text-slate-400">Yuklanmoqda...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="p-4 text-left">Ishchi</th>
              <th className="p-4 text-center">Rol</th>
              <th className="p-4 text-center">Login</th>
              <th className="p-4 text-center">PIN</th>
              <th className="p-4 text-center">Bugungi davomat</th>
              <th className="p-4 text-center">Holat</th>
              <th className="p-4 text-center">Amallar</th>
            </tr></thead>
            <tbody>
              {employees.map(emp => {
                const att = getAttendance(emp.id);
                return (
                  <tr key={emp.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${!emp.is_active ? 'opacity-50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div><p className="font-semibold text-slate-800">{emp.full_name}</p></div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[emp.role] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABELS[emp.role] || emp.role}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-500 font-mono text-xs">{emp.username}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono font-bold text-slate-700">
                          {showPin[emp.id] ? emp.pin_code : '••••'}
                        </span>
                        <button onClick={() => setShowPin(s => ({...s, [emp.id]: !s[emp.id]}))} className="text-slate-400 hover:text-slate-600">
                          {showPin[emp.id] ? <EyeOff size={13}/> : <Eye size={13}/>}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {att ? (
                        <div className="text-xs">
                          <p className="text-emerald-600 font-semibold">✅ {new Date(att.check_in_at).toLocaleTimeString('uz', {hour:'2-digit',minute:'2-digit'})}</p>
                          {att.check_out_at && <p className="text-slate-400">👋 {new Date(att.check_out_at).toLocaleTimeString('uz', {hour:'2-digit',minute:'2-digit'})}</p>}
                        </div>
                      ) : <span className="text-xs text-slate-300">Kelmadi</span>}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {emp.is_active ? 'Aktiv' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(emp)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit2 size={14}/></button>
                        {emp.role !== 'owner' && emp.is_active && (
                          <button onClick={() => { if(confirm(`${emp.full_name} ni o'chirishga ishonchingiz komilmi?`)) deactivateEmp.mutate(emp.id); }}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={14}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[480px] shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">{editUser ? 'Ishchini Tahrirlash' : 'Yangi Ishchi Qo\'shish'}</h3>
              <button onClick={() => { setShowModal(false); setEditUser(null); }}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">To'liq ism *</label>
                  <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                    placeholder="Abdullayev Ali" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Login (username) *</label>
                  <input value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                    disabled={!!editUser} placeholder="ali_kassir"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 disabled:opacity-50"/>
                </div>
              </div>
              {!editUser && (
                <div>
                  <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Parol *</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Kamida 6 belgi" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">Lavozim (Rol)</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-medium mb-1 block">PIN kod (4 raqam)</label>
                  <input type="text" maxLength={4} value={form.pin_code} onChange={e => setForm({...form, pin_code: e.target.value.replace(/\D/g, '')})}
                    placeholder="1234" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono text-center focus:outline-none focus:border-blue-400"/>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                💡 PIN kod — kassir tez kirishlari uchun. Parol — admin paneli uchun.
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => { setShowModal(false); setEditUser(null); }} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200">Bekor</button>
              <button onClick={handleSubmit} disabled={createEmp.isPending || updateEmp.isPending}
                className="flex-1 py-2.5 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                {createEmp.isPending || updateEmp.isPending ? 'Saqlanmoqda...' : editUser ? 'Saqlash' : 'Qo\'shish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
