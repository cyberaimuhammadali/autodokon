import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Lock, Database, CheckCircle, X, Shield, HardDrive } from 'lucide-react';
import api from './api';

export default function SettingsPage() {
  const qc = useQueryClient();
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [backupLoading, setBackupLoading] = useState(false);
  const [telegramForm, setTelegramForm] = useState({ token: '', chat_id: '' });

  const changePass = useMutation({
    mutationFn: (d) => api.put('/users/me/password', d),
    onSuccess: () => {
      setMsg({ type: 'success', text: 'Parol muvaffaqiyatli o\'zgartirildi!' });
      setPassForm({ current_password: '', new_password: '', confirm: '' });
    },
    onError: (e) => setMsg({ type: 'error', text: e.response?.data?.detail || 'Xatolik yuz berdi' }),
  });

  const handleChangePass = () => {
    if (!passForm.current_password || !passForm.new_password) return setMsg({ type: 'error', text: 'Barcha maydonlarni to\'ldiring' });
    if (passForm.new_password !== passForm.confirm) return setMsg({ type: 'error', text: 'Yangi parollar bir xil emas' });
    if (passForm.new_password.length < 6) return setMsg({ type: 'error', text: 'Parol kamida 6 ta belgi bo\'lishi kerak' });
    changePass.mutate({ current_password: passForm.current_password, new_password: passForm.new_password });
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.post('/admin/backup');
      setMsg({ type: 'success', text: `Backup yaratildi: ${res.data.backup}` });
    } catch (e) {
      setMsg({ type: 'error', text: 'Backup yaratishda xatolik' });
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Settings className="text-slate-500" size={28}/>Sozlamalar</h2>

      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={18}/> : <X size={18}/>}
          {msg.text}
          <button onClick={() => setMsg({ type: '', text: '' })} className="ml-auto opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Password Change */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Lock size={20} className="text-blue-600"/></div>
            <div><h3 className="font-bold text-slate-800">Parol O'zgartirish</h3><p className="text-xs text-slate-400">Admin paroli yangilash</p></div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 font-medium uppercase mb-1 block">Joriy Parol</label>
              <input type="password" value={passForm.current_password} onChange={e => setPassForm({ ...passForm, current_password: e.target.value })}
                placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium uppercase mb-1 block">Yangi Parol</label>
              <input type="password" value={passForm.new_password} onChange={e => setPassForm({ ...passForm, new_password: e.target.value })}
                placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium uppercase mb-1 block">Yangi Parodni Tasdiqlang</label>
              <input type="password" value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"/>
            </div>
            <button onClick={handleChangePass} disabled={changePass.isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
              {changePass.isPending ? 'Saqlanmoqda...' : 'Parolni O\'zgartirish'}
            </button>
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Database size={20} className="text-emerald-600"/></div>
            <div><h3 className="font-bold text-slate-800">Ma'lumotlar Zaxirasi (Backup)</h3><p className="text-xs text-slate-400">Bazani himoyalang</p></div>
          </div>
          <div className="space-y-3">
            <div className="bg-emerald-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-emerald-800 mb-2">Avtomatik backup</p>
              <ul className="space-y-1 text-emerald-700 text-xs">
                <li>✅ Har kecha soat 03:00 da avtomatik</li>
                <li>✅ So'nggi 7 ta backup saqlanadi</li>
                <li>✅ Backup haqida Telegram xabar keladi</li>
                <li>✅ Fayllar: <code>backend/backups/</code> papkasida</li>
              </ul>
            </div>
            <button onClick={handleBackup} disabled={backupLoading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <HardDrive size={18}/>
              {backupLoading ? 'Yaratilmoqda...' : 'Hoziroq Backup Yaratish'}
            </button>
            <p className="text-xs text-slate-400 text-center">Backup yaratilgandan so'ng Telegram ga xabar ketadi</p>
          </div>
        </div>

        {/* Telegram Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.038 9.605c-.154.682-.554.85-1.122.527l-3.1-2.284-1.496 1.44c-.166.165-.305.305-.625.305l.223-3.164 5.76-5.2c.25-.222-.054-.346-.388-.124L7.38 14.574l-3.06-.955c-.664-.208-.677-.664.14-.982l11.95-4.607c.554-.2 1.037.136.852.918z"/></svg>
            </div>
            <div><h3 className="font-bold text-slate-800">Telegram Bot Sozlamalari</h3><p className="text-xs text-slate-400">Hisobot va ogohlantirishlar</p></div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2 text-slate-600">
            <p className="font-medium text-slate-700">Sozlash uchun:</p>
            <p>1. <code className="bg-slate-200 px-1 rounded">c:\dokon\backend\.env</code> faylini oching</p>
            <p>2. Quyidagilarni kiriting:</p>
            <pre className="bg-slate-800 text-emerald-300 p-3 rounded-lg text-xs mt-2">TELEGRAM_BOT_TOKEN=7512...
TELEGRAM_CHAT_ID=123456789</pre>
            <p className="text-xs text-slate-400 mt-2">Bot olish: <strong>@BotFather</strong> | Chat ID: <strong>@userinfobot</strong></p>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Shield size={20} className="text-purple-600"/></div>
            <div><h3 className="font-bold text-slate-800">Tizim Xavfsizligi</h3><p className="text-xs text-slate-400">Joriy holat</p></div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'JWT Autentifikatsiya', status: true },
              { label: 'Parol Bcrypt Hash', status: true },
              { label: 'Rollar Tizimi (RBAC)', status: true },
              { label: 'PIN Code Kirish', status: true },
              { label: 'Avtomatik Backup', status: true },
              { label: 'SSL/HTTPS (VPS)', status: false, note: 'VPS kerak' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.status ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.status ? 'Yoqilgan' : item.note || 'O\'chirilgan'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
