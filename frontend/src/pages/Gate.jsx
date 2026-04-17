import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Gate() {
  const [qr,setQr]=useState('');
  const [staffId,setStaffId]=useState('');
  const [gate,setGate]=useState('Main Gate');
  const [staff,setStaff]=useState([]);
  const [active,setActive]=useState([]);
  const [scanning,setScanning]=useState(false);
  const [lastEntry,setLastEntry]=useState(null);

  const loadActive=useCallback(()=>{ api.get('/visits/active').then(r=>setActive(r.data.data||[])).catch(()=>{}); },[]);
  useEffect(()=>{
    api.get('/staff?active=true').then(r=>setStaff(r.data.data||[])).catch(()=>{});
    loadActive();
    const t=setInterval(loadActive,30000);
    return()=>clearInterval(t);
  },[loadActive]);

  const checkIn=async(e)=>{
    e.preventDefault();
    if(!qr.trim()) return toast.error('Enter a ticket QR code');
    setScanning(true);
    try{
      const r=await api.post('/tickets/checkin',{ticket_qr:qr,staff_id:staffId,entry_gate:gate});
      setLastEntry(r.data.data); toast.success('✅ Check-in successful!'); setQr(''); loadActive();
    }catch(err){
      toast.error(err.response?.data?.message||'Check-in failed — invalid or expired ticket');
    } finally{setScanning(false);}
  };

  const checkOut=async(visitId)=>{
    try{
      await api.put(`/visits/${visitId}/checkout`,{staff_id:staffId,exit_gate:gate});
      toast.success('👋 Checkout done!'); setLastEntry(null); loadActive();
    }catch(err){ toast.error(err.response?.data?.message||'Checkout failed'); }
  };

  const fmt=(mins)=>{ if(!mins&&mins!==0) return '—'; return `${Math.floor(mins/60)}h ${mins%60}m`; };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Check-in panel */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>🚪</div>
            <div><p className="font-bold text-slate-800 text-sm">Gate Terminal</p><p className="text-xs text-slate-400">Scan ticket to check in</p></div>
          </div>
          <form onSubmit={checkIn} className="space-y-3">
            <div><label className="label">Officer</label>
              <select className="input" value={staffId} onChange={e=>setStaffId(e.target.value)}>
                <option value="">Select staff…</option>
                {staff.map(s=><option key={s.staff_id} value={s.staff_id}>{s.staff_name} ({s.staff_type})</option>)}
              </select>
            </div>
            <div><label className="label">Gate</label><input className="input" value={gate} onChange={e=>setGate(e.target.value)}/></div>
            <div>
              <label className="label">Ticket QR / ID</label>
              <input className="input font-mono text-sm" placeholder="Scan or enter ticket QR…" value={qr} autoFocus onChange={e=>setQr(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();checkIn(e);}}}/>
              <p className="text-xs text-slate-400 mt-1.5">Press Enter or click Check-In</p>
            </div>
            <button type="submit" disabled={scanning||!qr.trim()} className="btn-primary w-full py-3 text-sm">
              {scanning?'⏳ Processing…':'✅ Check In'}
            </button>
          </form>
        </div>

        {lastEntry&&(
          <div className="rounded-2xl p-4 border-2 border-emerald-200 animate-slide"
            style={{background:'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.04))'}}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✅</span>
              <div><p className="font-bold text-emerald-800 text-sm">Entry Approved</p><p className="text-xs text-emerald-600">{lastEntry.location_name}</p></div>
            </div>
            <p className="text-lg font-black text-slate-900">{lastEntry.visitor_name}</p>
            <p className="text-sm text-slate-500 mt-1">Gate: {lastEntry.entry_gate}</p>
            <p className="text-sm text-slate-500">Time: {new Date(lastEntry.entry_time).toLocaleTimeString('en-IN')}</p>
            <p className="text-xs text-slate-400 mt-2">Visit #{lastEntry.visit_id}</p>
          </div>
        )}
      </div>

      {/* Active visitors */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <div><p className="font-bold text-slate-800 text-sm">Currently Inside</p><p className="text-xs text-slate-400">Live visitor board</p></div>
              <div className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold" style={{background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff'}}>
                {active.length} live
              </div>
            </div>
            <button onClick={loadActive} className="btn-secondary text-xs py-1.5 px-3">↻ Refresh</button>
          </div>

          {active.length===0?(
            <div className="text-center py-16">
              <p className="text-5xl mb-3 opacity-20">🏛️</p>
              <p className="text-slate-400 font-medium text-sm">No visitors inside</p>
              <p className="text-slate-300 text-xs mt-1">Check-in a visitor to see them here</p>
            </div>
          ):(
            <div className="space-y-2">
              {active.map(v=>(
                <div key={v.visit_id} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:shadow-md group"
                  style={{background:'#f8fafc',border:'1px solid #e2e8f0'}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                    style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                    {v.visitor_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{v.visitor_name}</p>
                    <p className="text-xs text-slate-400 truncate">{v.location_name} · {v.entry_gate} · <span className="capitalize">{v.ticket_category}</span></p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">Inside</p>
                    <p className="font-bold text-indigo-600 text-sm">{fmt(v.minutes_inside)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{new Date(v.entry_time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                    <button onClick={()=>checkOut(v.visit_id)} className="btn-secondary text-xs py-1 px-2.5 mt-1">Check Out</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
