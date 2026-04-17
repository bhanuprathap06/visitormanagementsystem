import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';

const fmt=(mins)=>{ if(!mins) return '—'; return `${Math.floor(mins/60)}h ${mins%60}m`; };

export default function Visits() {
  const [data,setData]=useState([]);
  const [locations,setLocations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState({status:'',location_id:'',date_from:'',date_to:''});

  const load=()=>{
    setLoading(true);
    const q=new URLSearchParams();
    Object.entries(filter).forEach(([k,v])=>{ if(v) q.set(k,v); });
    Promise.all([api.get('/visits?'+q),api.get('/locations')])
      .then(([v,l])=>{ setData(v.data.data||[]); setLocations(l.data.data||[]); })
      .catch(()=>toast.error('Failed to load visits'))
      .finally(()=>setLoading(false));
  };
  useEffect(load,[filter]);

  const statusBadge=(s)=>{
    const m={in_progress:'badge-green',completed:'badge-indigo',approved:'badge-yellow',cancelled:'badge-red'};
    return <span className={`${m[s]||'badge-gray'} capitalize`}>{s?.replace('_',' ')}</span>;
  };

  const summary={
    total:data.length,
    active:data.filter(d=>d.visit_status==='in_progress').length,
    done:data.filter(d=>d.visit_status==='completed').length,
    revenue:data.reduce((s,d)=>s+parseFloat(d.final_price||0),0),
  };

  const cols=[
    {key:'visit_id',label:'#',render:v=><span className="text-slate-400 text-xs font-mono">#{v}</span>},
    {key:'visitor_name',label:'Visitor',render:(v,r)=>(
      <div><p className="font-semibold text-slate-800 text-sm">{v}</p><p className="text-xs text-slate-400">{r.phone_no}</p></div>
    )},
    {key:'location_name',label:'Location'},
    {key:'ticket_category',label:'Category',render:v=><span className="badge-purple capitalize">{v}</span>},
    {key:'visit_date',label:'Date',render:v=>new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})},
    {key:'entry_time',label:'Entry',render:v=>v?new Date(v).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'},
    {key:'exit_time',label:'Exit',render:v=>v?new Date(v).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'},
    {key:'total_duration_minutes',label:'Duration',render:v=><span className="font-semibold text-indigo-600">{fmt(v)}</span>},
    {key:'entry_gate',label:'Gate'},
    {key:'final_price',label:'Ticket',render:v=>v?<span className="font-bold">₹{v}</span>:'—'},
    {key:'visit_status',label:'Status',render:v=>statusBadge(v)},
  ];

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'Total Visits',value:summary.total,g:'linear-gradient(135deg,#6366f1,#8b5cf6)',s:'0 4px 15px rgba(99,102,241,0.3)'},
          {label:'In Progress', value:summary.active,g:'linear-gradient(135deg,#10b981,#059669)',s:'0 4px 15px rgba(16,185,129,0.3)'},
          {label:'Completed',   value:summary.done,  g:'linear-gradient(135deg,#0ea5e9,#0284c7)',s:'0 4px 15px rgba(14,165,233,0.3)'},
          {label:'Revenue',     value:`₹${summary.revenue.toFixed(0)}`,g:'linear-gradient(135deg,#f59e0b,#d97706)',s:'0 4px 15px rgba(245,158,11,0.3)'},
        ].map(({label,value,g,s})=>(
          <div key={label} className="rounded-2xl p-4 text-white" style={{background:g,boxShadow:s}}>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})} className="input w-44">
            <option value="">All Status</option>
            {['in_progress','completed','approved','cancelled'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select value={filter.location_id} onChange={e=>setFilter({...filter,location_id:e.target.value})} className="input w-52">
            <option value="">All Locations</option>
            {locations.map(l=><option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" className="input w-36" value={filter.date_from} onChange={e=>setFilter({...filter,date_from:e.target.value})}/>
            <span className="text-slate-400 text-sm">→</span>
            <input type="date" className="input w-36" value={filter.date_to} onChange={e=>setFilter({...filter,date_to:e.target.value})}/>
          </div>
          {Object.values(filter).some(Boolean)&&(
            <button onClick={()=>setFilter({status:'',location_id:'',date_from:'',date_to:''})} className="btn-secondary text-xs py-1.5 px-3">Clear</button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Visit Records</h3>
          <span className="badge-gray">{data.length} records</span>
        </div>
        <DataTable columns={cols} data={data} loading={loading}/>
      </div>
    </div>
  );
}
