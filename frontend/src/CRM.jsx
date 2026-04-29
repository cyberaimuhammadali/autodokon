import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Gift, Phone } from 'lucide-react';
import api from './api';

export default function CRM() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ phone: '', full_name: '' });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers/');
      return res.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (newCustomer) => api.post('/customers/', newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setShowAddForm(false);
      setFormData({ phone: '', full_name: '' });
      alert("Mijoz qo'shildi!");
    },
    onError: () => alert("Xatolik! Raqam band bo'lishi mumkin.")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
          <Users className="text-blue-500" size={32} /> Mijozlar (CRM)
        </h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={20} /> Yangi Mijoz
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 max-w-xl">
          <h3 className="text-xl font-bold mb-4 text-slate-700">Yangi Mijoz Qo'shish</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Ism va Familiya</label>
              <input 
                type="text" 
                required
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Telefon Raqam</label>
              <input 
                type="text" 
                placeholder="+998901234567"
                required
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-emerald-500 text-white p-3 rounded-lg font-bold shadow hover:bg-emerald-600 transition-colors"
            >
              Saqlash
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
              <th className="p-4">Ism Familiya</th>
              <th className="p-4">Telefon</th>
              <th className="p-4 text-right">Bonus Ballar</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" className="text-center p-8 text-slate-500">Yuklanmoqda...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="4" className="text-center p-8 text-slate-500">Mijozlar yo'q.</td></tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {customer.full_name.charAt(0).toUpperCase()}
                    </div>
                    {customer.full_name}
                  </td>
                  <td className="p-4 text-slate-600 flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" /> {customer.phone}
                  </td>
                  <td className="p-4 text-right text-emerald-600 font-bold flex justify-end items-center gap-1">
                    {customer.bonus_points.toLocaleString()} <Gift size={16} />
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Faol</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
