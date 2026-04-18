import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Modal from '../components/Modal';

export default function Gate() {
  const [qr,setQr]=useState('');
  const [staffId,setStaffId]=useState('');
  const [gate,setGate]=useState('Main Gate');
  const [staff,setStaff]=useState([]);
  const [locations,setLocations]=useState([]);
  const [locationId,setLocationId]=useState('');
  const [active,setActive]=useState([]);
  const [scanning,setScanning]=useState(false);
  const [lastEntry,setLastEntry]=useState(null);
  const [previewOpen,setPreviewOpen]=useState(false);
  const [ticketPreview,setTicketPreview]=useState(null);

  const loadActive=useCallback(()=>{ api.get('/visits/active').then(r=>setActive((r.data?.data ?? r.data)||[])).catch(()=>{}); },[]);
  useEffect(()=>{
    api.get('/staff?active=true').then(r=>setStaff((r.data?.data ?? r.data)||[])).catch(()=>{});
    api.get('/locations?active=true').then(r=>{ setLocations((r.data?.data ?? r.data)||[]); if((r.data?.data ?? r.data)?.[0]?.location_id) setLocationId(String((r.data?.data ?? r.data)[0].location_id)); }).catch(()=>{});
    loadActive();
    const t=setInterval(loadActive,30000);
    return()=>clearInterval(t);
  },[loadActive]);

  const todayIso = useMemo(()=>new Date().toISOString().slice(0,10),[]);

  const validateTicket = (t) => {
    if (!t) return 'Ticket not found';
    if (t.checked) return 'Ticket already used';
    if (t.ticket_status !== 'active') return `Ticket is ${t.ticket_status}`;
    const vf = String(t.valid_from).slice(0,10);
    const vt = String(t.valid_till).slice(0,10);
    if (todayIso < vf || todayIso > vt) return 'Ticket expired or not valid today';
    if (locationId && String(t.location_id) !== String(locationId)) return 'Wrong location for this gate';
    return '';
  };

  const previewTicket=async(e)=>{
    e.preventDefault();
    if(!qr.trim()) return toast.error('Enter a ticket QR code');
    if(!staffId) return toast.error('Select staff officer');
    setScanning(true);
    try{
      const r=await api.get(`/tickets/${encodeURIComponent(qr.trim())}`);
      const t=r.data?.data ?? r.data;
      setTicketPreview(t);
      setPreviewOpen(true);
    }catch(err){
      toast.error(err.response?.data?.message||'Ticket not found');
    } finally{setScanning(false);}
  };

  const confirmCheckIn=async()=>{
    const msg=validateTicket(ticketPreview);
    if(msg) return toast.error(msg);
    setScanning(true);
    try{
      const r=await api.post('/tickets/checkin',{ticket_qr:qr.trim(),staff_id:staffId,entry_gate:gate});
      setLastEntry(r.data?.data ?? r.data);
      toast.success('✅ Check-in successful!');
      setQr('');
      setPreviewOpen(false);
      setTicketPreview(null);
      loadActive();
    }catch(err){
      toast.error(err.response?.data?.message||'Check-in failed');
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
          <form onSubmit={previewTicket} className="space-y-3">
            <div><label className="label">Officer</label>
              <select className="input" value={staffId} onChange={e=>setStaffId(e.target.value)}>
                <option value="">Select staff…</option>
                {staff.map(s=><option key={s.staff_id} value={s.staff_id}>{s.staff_name} ({s.staff_type})</option>)}
              </select>
            </div>
            <div><label className="label">Location (Gate)</label>
              <select className="input" value={locationId} onChange={e=>setLocationId(e.target.value)}>
                {locations.map(l=><option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1.5">Used to detect wrong-location scans</p>
            </div>
            <div><label className="label">Gate</label><input className="input" value={gate} onChange={e=>setGate(e.target.value)}/></div>
            <div>
              <label className="label">Ticket QR / ID</label>
              <input className="input font-mono text-sm" placeholder="Scan or enter ticket QR…" value={qr} autoFocus onChange={e=>setQr(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault();previewTicket(e);}}}/>
              <p className="text-xs text-slate-400 mt-1.5">Press Enter or click Preview</p>
            </div>
            <button type="submit" disabled={scanning||!qr.trim()||!staffId} className="btn-primary w-full py-3 text-sm">
              {scanning?'⏳ Loading…':'🔎 Preview Ticket'}
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

      <Modal open={previewOpen} onClose={()=>{setPreviewOpen(false);}} title="Confirm Entry" size="lg">
        {ticketPreview ? (
          <div className="space-y-4">
            {validateTicket(ticketPreview) ? (
              <div className="rounded-xl p-3 border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">
                {validateTicket(ticketPreview)}
              </div>
            ) : (
              <div className="rounded-xl p-3 border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold">
                Ticket valid. Confirm entry below.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs text-slate-400">Visitor</p>
                <p className="font-bold text-slate-900">{ticketPreview.visitor_name}</p>
                <p className="text-xs text-slate-500">{ticketPreview.phone_no}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs text-slate-400">Location</p>
                <p className="font-bold text-slate-900">{ticketPreview.location_name}</p>
                <p className="text-xs text-slate-500 capitalize">{ticketPreview.ticket_category?.replace('_',' ')}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs text-slate-400">Validity</p>
                <p className="font-bold text-slate-900">{String(ticketPreview.valid_from).slice(0,10)} – {String(ticketPreview.valid_till).slice(0,10)}</p>
                <p className="text-xs text-slate-500">Status: {ticketPreview.ticket_status}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs text-slate-400">QR</p>
                <p className="font-mono text-xs text-slate-700 break-all">{ticketPreview.ticket_qr}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={()=>setPreviewOpen(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={confirmCheckIn} disabled={!!validateTicket(ticketPreview)||scanning} className="btn-primary">
                {scanning?'⏳ Confirming…':`Confirm Entry for ${ticketPreview.visitor_name}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">No ticket loaded.</div>
        )}
      </Modal>

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
