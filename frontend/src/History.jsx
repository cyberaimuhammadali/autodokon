import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History as HistoryIcon, Clock, ReceiptText, ChevronDown } from 'lucide-react';
import api from './api';

export default function History() {
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts_history'],
    queryFn: async () => {
      const res = await api.get('/receipts/history');
      return res.data;
    }
  });

  const [expandedReceipt, setExpandedReceipt] = React.useState(null);

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
          <HistoryIcon className="text-blue-500" size={32} /> Sotuvlar Tarixi
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
              <th className="p-4">Chek №</th>
              <th className="p-4">Vaqti</th>
              <th className="p-4">To'lov Turi</th>
              <th className="p-4 text-right">Summa</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="text-center p-8 text-slate-500">Yuklanmoqda...</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan="5" className="text-center p-8 text-slate-500">Hech qanday savdo topilmadi.</td></tr>
            ) : (
              receipts.map(receipt => (
                <React.Fragment key={receipt.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedReceipt(expandedReceipt === receipt.id ? null : receipt.id)}>
                    <td className="p-4 font-mono font-medium text-slate-800 flex items-center gap-2">
                      <ReceiptText size={16} className="text-blue-500"/> #{receipt.id.toString().padStart(6, '0')}
                    </td>
                    <td className="p-4 text-slate-600 flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" /> {new Date(receipt.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${receipt.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {receipt.payment_method}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      {receipt.total_amount.toLocaleString()} so'm
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      <ChevronDown size={20} className={`transform transition-transform ${expandedReceipt === receipt.id ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {expandedReceipt === receipt.id && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan="5" className="p-6">
                        <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase">Xarid qilingan tovarlar:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {receipt.items.map(item => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                              <div className="text-slate-700">
                                Mahsulot ID: {item.product_id} <span className="text-slate-400 text-sm ml-2">({item.quantity} x {item.price.toLocaleString()} so'm)</span>
                              </div>
                              <div className="font-bold text-slate-800">
                                {item.total_price.toLocaleString()} so'm
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
