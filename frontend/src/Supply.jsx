import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, PackagePlus, Wallet } from 'lucide-react';
import api from './api';

export default function Supply() {
  const queryClient = useQueryClient();
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers/');
      return res.data;
    }
  });

  const supplierMutation = useMutation({
    mutationFn: (newSup) => api.post('/suppliers/', newSup),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      setShowAddSupplier(false);
      setSupplierName('');
      setSupplierPhone('');
    }
  });

  const handleAddSupplier = (e) => {
    e.preventDefault();
    supplierMutation.mutate({ name: supplierName, phone: supplierPhone });
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
          <Truck className="text-blue-500" size={32} /> Yetkazib Beruvchilar va Kirim
        </h2>
        <button 
          onClick={() => setShowAddSupplier(!showAddSupplier)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Yangi Taminotchi
        </button>
      </div>

      {showAddSupplier && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 max-w-xl">
          <h3 className="text-xl font-bold mb-4 text-slate-700">Taminotchi Qo'shish</h3>
          <form onSubmit={handleAddSupplier} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Kompaniya yoki Ism</label>
              <input 
                type="text" 
                required
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Telefon</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={supplierPhone}
                onChange={e => setSupplierPhone(e.target.value)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <PackagePlus size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tovarlar Kirimi</h3>
              <p className="text-sm text-slate-500">Omborga yangi mahsulotlarni qabul qilish</p>
            </div>
          </div>
          <button className="w-full py-3 border-2 border-dashed border-emerald-500 text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors">
            Kirim Hujjatini Yaratish
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Buxgalteriya</h3>
              <p className="text-sm text-slate-500">Qarzlar va to'lovlarni nazorat qilish</p>
            </div>
          </div>
          <button className="w-full py-3 border-2 border-dashed border-blue-500 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors">
            To'lov Amalga Oshirish
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <h3 className="p-4 font-bold text-slate-800 border-b border-slate-100 text-lg">Taminotchilar Ro'yxati</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
              <th className="p-4">Nomi</th>
              <th className="p-4">Telefon</th>
              <th className="p-4 text-right">Balans (Qarzimiz)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="3" className="text-center p-8 text-slate-500">Yuklanmoqda...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan="3" className="text-center p-8 text-slate-500">Ma'lumot topilmadi.</td></tr>
            ) : (
              suppliers.map(sup => (
                <tr key={sup.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{sup.name}</td>
                  <td className="p-4 text-slate-600">{sup.phone || '-'}</td>
                  <td className={`p-4 text-right font-bold ${sup.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {sup.balance.toLocaleString()} so'm
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
