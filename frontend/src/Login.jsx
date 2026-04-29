import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, Lock } from 'lucide-react';

export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState('password'); // 'password' | 'pin'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('password', password);
      const res = await axios.post('http://localhost:8000/auth/login', form);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: res.data.user_id,
        full_name: res.data.full_name,
        role: res.data.role,
      }));
      setUser({ id: res.data.user_id, full_name: res.data.full_name, role: res.data.role });
    } catch {
      setError("Login yoki parol xato!");
    } finally {
      setLoading(false);
    }
  };

  const handlePinLogin = async (digit) => {
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      setLoading(true);
      try {
        const res = await axios.post('http://localhost:8000/auth/pin-login', { pin: newPin });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify({
          id: res.data.user_id,
          full_name: res.data.full_name,
          role: res.data.role,
        }));
        setUser({ id: res.data.user_id, full_name: res.data.full_name, role: res.data.role });
      } catch {
        setError("PIN xato!");
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/40 mb-4">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">DokonPro ERP</h1>
          <p className="text-slate-400 mt-1 text-sm">Savdo boshqaruv tizimi</p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => { setMode('password'); setError(''); setPin(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'password' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >Login / Parol</button>
          <button
            onClick={() => { setMode('pin'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'pin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >PIN Code</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">{error}</div>
        )}

        {mode === 'password' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Foydalanuvchi nomi</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Parol</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3 mb-2">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${pin.length > i ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-white/20 text-transparent'}`}>
                  {pin.length > i ? '●' : '○'}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                <button
                  key={i}
                  onClick={() => d === '⌫' ? setPin(p => p.slice(0,-1)) : d !== '' ? handlePinLogin(d) : null}
                  disabled={d === '' || loading}
                  className={`h-14 rounded-xl text-xl font-bold transition-all ${d === '' ? 'invisible' : d === '⌫' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 active:scale-95'}`}
                >{d}</button>
              ))}
            </div>
            {loading && <p className="text-slate-400 text-sm">Tekshirilmoqda...</p>}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          Kirish: admin / admin123 &nbsp;|&nbsp; PIN: 0000
        </p>
      </div>
    </div>
  );
}
