import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search } from 'lucide-react';
import api from './api';

export default function Products() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', barcode: '', price: '', category_id: 1 });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products/');
      return res.data;
    }
  });

  const productMutation = useMutation({
    mutationFn: (prod) => api.post('/products/', prod),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowAdd(false);
      setNewProduct({ name: '', barcode: '', price: '', category_id: 1 });
    }
  });

  const handleAdd = (e) => {
    e.preventDefault();
    productMutation.mutate({
      name: newProduct.name,
      barcode: newProduct.barcode,
      price: parseFloat(newProduct.price),
      category_id: parseInt(newProduct.category_id)
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
          <Package className="text-blue-500" size={32} /> Mahsulotlar & Ombor
        </h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Yangi Mahsulot
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 max-w-2xl">
          <h3 className="text-xl font-bold mb-4 text-slate-700">Yangi Mahsulot Qo'shish</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Nomi</label>
              <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Shtrix-kod</label>
              <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Sotuv Narxi (so'm)</label>
              <input required type="number" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
            </div>
            <button type="submit" className="col-span-2 bg-emerald-500 text-white p-3 rounded-lg font-bold shadow hover:bg-emerald-600 transition-colors mt-2">
              Saqlash
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50">
          <Search className="text-slate-400 mr-2" size={20} />
          <input 
            type="text" 
            placeholder="Nomi yoki shtrix-kod bo'yicha qidirish..." 
            className="w-full bg-transparent outline-none text-slate-700"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
              <th className="p-4">Shtrix-kod</th>
              <th className="p-4">Nomi</th>
              <th className="p-4 text-right">Narxi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="3" className="text-center p-8 text-slate-500">Yuklanmoqda...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="3" className="text-center p-8 text-slate-500">Mahsulotlar topilmadi.</td></tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-slate-500 text-sm">{p.barcode}</td>
                  <td className="p-4 font-medium text-slate-800">{p.name}</td>
                  <td className="p-4 text-right font-bold text-slate-700">{p.price.toLocaleString()} so'm</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
