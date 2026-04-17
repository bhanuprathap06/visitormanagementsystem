import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

const EMPTY={visitor_id:'',location_id:'',ticket_category:'adult',base_price:'',discount_amount:'0',valid_from:'',valid_till:'',payment_mode:'upi'};
const CATS=['adult','child','student','senior_citizen','vip','couple','family','group'];
const MODES=['cash','upi','card','net_banking','wallet'];
const fmt=v=>`₹${parseFloat(v||0).toFixed(2)}`;

export default function Tickets() {
  const [data,setData]=useState([]);
  const [visitors,setVisitors]=useState([]);
  const [locations,setLocations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [filter,setFilter]=useState({status:'',location_id:''});
  const [form,setForm]=useState(EMPTY);

  const load=()=>{
    setLoading(true);
    const q=new URLSearchParams();
    if(filter.status) q.set('status',filter.status);
    if(filter.location_id) q.set('location_id',filter.location_id);
    Promise.all([api.get('/tickets?'+q),api.get('/visitors'),api.get('/locations?active=true')])
      .then(([t,v,l])=>{ setData(t.data.data||[]); setVisitors(v.data.data||[]); setLocations(l.data.data||[]); })
      .catch(()=>toast.error('Failed to load tickets'))
      .finally(()=>setLoading(false));
  };
  useEffect(load,[filter]);

  const open=()=>{ setForm(EMPTY); setModal(true); };
  const close=()=>{ setModal(false); setForm(EMPTY); };
  const save=async(e)=>{ e.preventDefault(); try{ await api.post('/tickets',form); toast.success('🎫 Ticket issued!'); close(); load(); }catch(e){ toast.error(e.response?.data?.message||'Failed to issue ticket'); } };
  const cancel=async(id)=>{ if(!confirm('Cancel this ticket?')) return; try{ await api.patch(`/tickets/${id}/cancel`); toast.success('Cancelled'); load(); }catch(e){ toast.error(e.response?.data?.message||'Failed to cancel ticket'); } };

  const statusBadge=(s)=>{
    const m={active:'badge-green',used:'badge-blue',expired:'badge-gray',cancelled:'badge-red'};
    return <span className={m[s]||'badge-gray'}>{s}</span>;
  };

  const final_price=parseFloat(form.base_price||0)-parseFloat(form.discount_amount||0);

  const cols=[
    {key:'ticket_qr',label:'QR Code',render:v=><code className="text-xs bg-slate-100 px-2 py-1 rounded-lg font-mono">{v}</code>},
    {key:'visitor_name',label:'Visitor',render:(v,r)=>(
      <div><p className="font-semibold text-slate-800 text-sm">{v}</p><p className="text-xs text-slate-400">{r.phone_no}</p></div>
    )},
    {key:'location_name',label:'Location'},
    {key:'ticket_category',label:'Category',render:v=><span className="badge-purple capitalize">{v?.replace('_',' ')}</span>},
    {key:'final_price',label:'Price',render:v=><span className="font-bold text-slate-900">{fmt(v)}</span>},
    {key:'valid_from',label:'Valid',render:(v,r)=><span className="text-xs text-slate-500">{new Date(v).toLocaleDateString('en-IN')} – {new Date(r.valid_till).toLocaleDateString('en-IN')}</span>},
    {key:'payment_mode',label:'Payment',render:v=><span className="badge-blue capitalize">{v?.replace('_',' ')}</span>},
    {key:'checked',label:'Scanned',render:v=><span className={v?'badge-green':'badge-yellow'}>{v?'✓ Yes':'Pending'}</span>},
    {key:'ticket_status',label:'Status',render:v=>statusBadge(v)},
    {key:'ticket_id',label:'',render:(id,row)=>(
      row.ticket_status==='active'&&!row.checked
        ?<button onClick={()=>cancel(id)} className="text-xs font-semibold text-rose-500 hover:text-rose-700">Cancel</button>
        :<span className="text-slate-300 text-xs">—</span>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})} className="input w-40">
            <option value="">All Status</option>
            {['active','used','expired','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filter.location_id} onChange={e=>setFilter({...filter,location_id:e.target.value})} className="input w-52">
            <option value="">All Locations</option>
            {locations.map(l=><option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
          </select>
        </div>
        <button onClick={open} className="btn-primary">🎫 Issue Ticket</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">All Tickets</h3>
          <span className="badge-gray">{data.length} tickets</span>
        </div>
        <DataTable columns={cols} data={data} loading={loading}/>
      </div>

      <Modal open={modal} onClose={close} title="Issue New Ticket" size="lg">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Visitor</label>
            <select className="input" required value={form.visitor_id} onChange={e=>setForm({...form,visitor_id:e.target.value})}>
              <option value="">Select visitor…</option>
              {visitors.map(v=><option key={v.visitor_id} value={v.visitor_id}>{v.name} – {v.phone_no}</option>)}
            </select>
          </div>
          <div><label className="label">Location</label>
            <select className="input" required value={form.location_id} onChange={e=>setForm({...form,location_id:e.target.value})}>
              <option value="">Select location…</option>
              {locations.map(l=><option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
            </select>
          </div>
          <div><label className="label">Category</label>
            <select className="input" value={form.ticket_category} onChange={e=>setForm({...form,ticket_category:e.target.value})}>
              {CATS.map(c=><option key={c} value={c}>{c.replace('_',' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Base Price (₹)</label><input type="number" step="0.01" min="0" className="input" required value={form.base_price} onChange={e=>setForm({...form,base_price:e.target.value})}/></div>
          <div><label className="label">Discount (₹)</label><input type="number" step="0.01" min="0" className="input" value={form.discount_amount} onChange={e=>setForm({...form,discount_amount:e.target.value})}/></div>
          <div><label className="label">Valid From</label><input type="date" className="input" required value={form.valid_from} onChange={e=>setForm({...form,valid_from:e.target.value})}/></div>
          <div><label className="label">Valid Till</label><input type="date" className="input" required value={form.valid_till} onChange={e=>setForm({...form,valid_till:e.target.value})}/></div>
          <div><label className="label">Payment Mode</label>
            <select className="input" value={form.payment_mode} onChange={e=>setForm({...form,payment_mode:e.target.value})}>
              {MODES.map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-xl p-4" style={{background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))'}}>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Final Amount</p>
              <p className="text-3xl font-black text-indigo-700 mt-1">{fmt(final_price)}</p>
            </div>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Issue Ticket & Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
