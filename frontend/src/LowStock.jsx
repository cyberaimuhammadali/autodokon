import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertTriangle, ShoppingCart, Send, CheckCircle, RefreshCw } from 'lucide-react';
import api from './api';

export default function LowStock() {
  const [sentMsg, setSentMsg] = useState('');

  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['purchase_suggestions'],
    queryFn: async () => (await api.get('/purchase-suggestions')).data,
    refetchInterval: 60000,
  });

  const sendReport = useMutation({
    mutationFn: () => api.post('/bot/send-daily-report'),
    onSuccess: (res) => setSentMsg(res.data.message),
  });

  const sendLowStock = useMutation({
    mutationFn: () => api.post('/bot/send-low-stock-alert'),
    onSuccess: () => setSentMsg('Kam zaxira ogohlantirishi yuborildi!'),
  });

  const sendOrder = useMutation({
    mutationFn: () => api.post('/purchase-suggestions/send-telegram'),
    onSuccess: (res) => setSentMsg(`Buyurtma ro'yxati (${res.data.count} ta tovar) Telegram ga yuborildi!`),
  });

  const totalCost = suggestions.reduce((s, i) => s + (i.estimated_cost || 0), 0);

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <AlertTriangle className="text-amber-500" size={28} />
            Kam Zaxira & Avtomatik Buyurtma
          </h2>
          <p className="text-slate-500 text-sm mt-1">Minimum miqdorga yetgan tovarlar va buyurtma tavsiyalari</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
          <RefreshCw size={15} /> Yangilash
        </button>
      </div>

      {/* Telegram tugmalari */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => sendReport.mutate()}
          disabled={sendReport.isPending}
          className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60"
        >
          <Send size={18} />
          {sendReport.isPending ? 'Yuborilmoqda...' : 'Kunlik Hisobot yuborish'}
        </button>

        <button
          onClick={() => sendLowStock.mutate()}
          disabled={sendLowStock.isPending}
          className="flex items-center justify-center gap-2 p-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60"
        >
          <AlertTriangle size={18} />
          {sendLowStock.isPending ? 'Yuborilmoqda...' : 'Kam Zaxira Xabari'}
        </button>

        <button
          onClick={() => sendOrder.mutate()}
          disabled={sendOrder.isPending || suggestions.length === 0}
          className="flex items-center justify-center gap-2 p-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60"
        >
          <ShoppingCart size={18} />
          {sendOrder.isPending ? 'Yuborilmoqda...' : 'Buyurtma ro\'yxatini yuborish'}
        </button>
      </div>

      {sentMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 text-emerald-700 font-medium">
          <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
          {sentMsg}
          <button onClick={() => setSentMsg('')} className="ml-auto text-emerald-400 hover:text-emerald-600 text-xs">×</button>
        </div>
      )}

      {/* Summary */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
            <p className="text-slate-500 text-sm">Kam zaxiradagi tovarlar</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{suggestions.length} <span className="text-sm font-normal text-slate-500">tur</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
            <p className="text-slate-500 text-sm">Taxminiy buyurtma summasi</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{totalCost.toLocaleString()} <span className="text-sm font-normal text-slate-500">so'm</span></p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-700">Buyurtma tavsiya ro'yxati</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : suggestions.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Barcha tovarlar yetarli!</p>
            <p className="text-slate-400 text-sm mt-1">Hech qanday tovar minimum miqdorga yetmagan.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-left">Mahsulot</th>
                <th className="p-4 text-center">Hozirgi zaxira</th>
                <th className="p-4 text-center">Minimum</th>
                <th className="p-4 text-center font-bold">Buyurtma miqdori</th>
                <th className="p-4 text-right">Taxminiy narx</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((item) => (
                <tr key={item.product_id} className="border-b border-slate-50 hover:bg-amber-50/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-slate-800">{item.product_name}</p>
                      {item.barcode && <p className="text-xs text-slate-400 font-mono">{item.barcode}</p>}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                      {item.current_qty?.toFixed(0)} dona
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-500">{item.min_qty?.toFixed(0)} dona</td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                      + {item.suggested_qty?.toFixed(0)} dona
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-slate-700">
                    {(item.estimated_cost || 0).toLocaleString()} so'm
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan="4" className="p-4 font-bold text-slate-700 text-right">Jami taxminiy:</td>
                <td className="p-4 text-right font-bold text-blue-600 text-base">{totalCost.toLocaleString()} so'm</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
