import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#8b5cf6','#0ea5e9','#f97316','#ec4899'];
const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'8px 12px'}}>
      <p style={{color:'#94a3b8',fontSize:11,marginBottom:4}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color,fontSize:12,fontWeight:700}}>{p.name}: {typeof p.value==='number'&&p.value>999?fmt(p.value):p.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [overview,setOverview]=useState(null);
  const [trends,setTrends]=useState([]);
  const [revenue,setRevenue]=useState([]);
  const [cats,setCats]=useState([]);
  const [recent,setRecent]=useState([]);
  const [payModes,setPayModes]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      api.get('/dashboard/overview'),api.get('/dashboard/visitor-trends'),
      api.get('/dashboard/revenue-by-location'),api.get('/dashboard/ticket-categories'),
      api.get('/dashboard/recent-visits'),api.get('/dashboard/payment-modes'),
    ]).then(([o,t,r,c,rv,pm])=>{
      setOverview(o.data.data);setTrends(t.data.data);setRevenue(r.data.data);
      setCats(c.data.data);setRecent(rv.data.data);setPayModes(pm.data.data);
    }).finally(()=>setLoading(false));
  },[]);

  const statusBadge=(s)=>{
    const m={in_progress:'badge-green',completed:'badge-indigo',approved:'badge-yellow',cancelled:'badge-red'};
    return <span className={m[s]||'badge-gray'}>{s?.replace('_',' ')}</span>;
  };

  if(loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[...Array(8)].map((_,i)=><div key={i} className="h-28 rounded-2xl skeleton-shimmer"/>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Today's Visitors" value={overview?.today_visitors} icon="👥" color="indigo" sub="Unique today"/>
        <StatCard title="Currently Inside" value={overview?.active_visits} icon="🚶" color="green" sub="Live count"/>
        <StatCard title="Today's Revenue" value={fmt(overview?.today_revenue)} icon="💰" color="amber" sub="Ticket sales"/>
        <StatCard title="Completed Today" value={overview?.completed_today} icon="✅" color="teal" sub="Exits recorded"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Total Visitors" value={overview?.total_visitors} icon="🧑‍🤝‍🧑" color="purple" sub="All time"/>
        <StatCard title="Total Tickets" value={overview?.total_tickets} icon="🎫" color="sky" sub="All time issued"/>
        <StatCard title="Active Locations" value={overview?.active_locations} icon="📍" color="green" sub="Open now"/>
        <StatCard title="Total Revenue" value={fmt(overview?.total_revenue)} icon="📈" color="rose" sub="All-time"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="font-bold text-slate-800 text-sm">Visitor Trend</h3><p className="text-xs text-slate-400 mt-0.5">Last 30 days</p></div>
            <span className="badge-indigo">30d</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} tickFormatter={d=>d?.slice(5)} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2.5} fill="url(#g1)" name="Visitors" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-4"><h3 className="font-bold text-slate-800 text-sm">Ticket Categories</h3><p className="text-xs text-slate-400 mt-0.5">Distribution</p></div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={cats} dataKey="count" cx="50%" cy="50%" innerRadius={32} outerRadius={55}>
                {cats.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip content={<Tip/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {cats.slice(0,5).map((c,i)=>(
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                <span className="text-xs text-slate-600 capitalize flex-1 truncate">{c.ticket_category?.replace('_',' ')}</span>
                <span className="text-xs font-bold text-slate-800">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="mb-5"><h3 className="font-bold text-slate-800 text-sm">Revenue by Location</h3><p className="text-xs text-slate-400 mt-0.5">Total ticket sales</p></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenue} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="location_name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="revenue" name="Revenue" radius={[6,6,0,0]}>
                {revenue.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-5"><h3 className="font-bold text-slate-800 text-sm">Payment Methods</h3><p className="text-xs text-slate-400 mt-0.5">Completed transactions</p></div>
          <div className="space-y-3.5">
            {payModes.map((m,i)=>{
              const max=Math.max(...payModes.map(x=>x.total));
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold capitalize text-slate-700">{m.payment_mode?.replace('_',' ')}</span>
                    <span className="text-xs font-bold text-slate-900">{fmt(m.total)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${(m.total/max)*100}%`,background:COLORS[i%COLORS.length],transition:'width 0.7s ease'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="font-bold text-slate-800 text-sm">Recent Visits</h3><p className="text-xs text-slate-400 mt-0.5">Latest activity</p></div>
          <span className="badge-purple">{recent.length} records</span>
        </div>
        <table className="min-w-full">
          <thead>
            <tr style={{borderBottom:'1px solid #f1f5f9'}}>
              {['Visitor','Location','Entry Time','Category','Price','Status'].map(h=>(
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((r,i)=>(
              <tr key={i} className="hover:bg-indigo-50/30 transition-colors" style={{borderBottom:'1px solid #f8fafc'}}>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{r.visitor_name}</td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{r.location_name}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{r.entry_time?new Date(r.entry_time).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}):'—'}</td>
                <td className="px-5 py-3.5"><span className="badge-purple capitalize">{r.ticket_category}</span></td>
                <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{fmt(r.final_price)}</td>
                <td className="px-5 py-3.5">{statusBadge(r.visit_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
