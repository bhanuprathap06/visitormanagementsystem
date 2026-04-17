import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#0ea5e9','#a855f7','#14b8a6','#f97316'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'rgba(15,23,42,0.92)',backdropFilter:'blur(12px)',
      border:'1px solid rgba(99,102,241,0.3)',borderRadius:12,
      padding:'10px 14px',color:'#e2e8f0',fontSize:12
    }}>
      {label && <p style={{ color:'#94a3b8', marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, fontWeight:700 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const StatBox = ({ label, value, sub, color='#6366f1', bg='#eef2ff' }) => (
  <div className="rounded-2xl p-5 border cursor-default select-none"
    style={{ background: bg, borderColor: color+'30', boxShadow:`0 4px 16px ${color}18` }}>
    <p className="text-xs font-bold uppercase tracking-wider" style={{ color:color+'bb' }}>{label}</p>
    <p className="text-3xl font-black mt-1" style={{ color }}>{value ?? '—'}</p>
    {sub && <p className="text-xs mt-1" style={{ color:color+'88' }}>{sub}</p>}
  </div>
);

const tabs = ['Overview','Revenue','Visitors','Locations'];

export default function Reports() {
  const [active, setActive]   = useState('Overview');
  const [revenue, setRevenue] = useState(null);
  const [visitors, setVisits] = useState(null);
  const [locSummary, setLoc]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/revenue').catch(() => ({ data: { data: {} } })),
      api.get('/reports/visitors').catch(() => ({ data: { data: {} } })),
      api.get('/reports/location-summary').catch(() => ({ data: { data: [] } })),
    ]).then(([r, v, l]) => {
      setRevenue(r.data?.data ?? {});
      setVisits(v.data?.data ?? {});
      setLoc(Array.isArray(l.data?.data) ? l.data.data : []);
    }).catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const daily    = revenue?.daily        || [];
  const byLoc    = revenue?.by_location  || [];
  const byCat    = revenue?.by_category  || [];
  const byPay    = revenue?.by_payment   || [];
  const byGender = visitors?.by_gender   || [];
  const byPurp   = visitors?.by_purpose  || [];

  const totalRev  = byLoc.reduce((s,r) => s + parseFloat(r.revenue||0), 0).toFixed(2);
  const totalTix  = byLoc.reduce((s,r) => s + (r.tickets||0), 0);
  const totalVis  = byGender.reduce((s,r) => s + (r.count||0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-400 text-sm mt-0.5">Live data insights from your visitor management system</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Live Data
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActive(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              ${active===t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {!loading && active === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Total Revenue"  value={`₹${totalRev}`}  color="#10b981" bg="#d1fae5" sub="All time" />
            <StatBox label="Tickets Sold"   value={totalTix}         color="#6366f1" bg="#eef2ff" sub="All time" />
            <StatBox label="Total Visitors" value={totalVis}         color="#0ea5e9" bg="#e0f2fe" sub="Registered" />
            <StatBox label="Locations"      value={locSummary.length} color="#f59e0b" bg="#fef3c7" sub="Active venues" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily revenue trend */}
            <div className="rounded-2xl p-6 bg-white border border-slate-100" style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-slate-800 mb-4">Daily Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)"/>
                  <XAxis dataKey="date" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#6366f1" strokeWidth={2.5}
                    fill="url(#rg1)" dot={{r:4,fill:'#6366f1',strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Ticket category donut */}
            <div className="rounded-2xl p-6 bg-white border border-slate-100" style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-slate-800 mb-4">Tickets by Category</h3>
              {byCat.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byCat} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="tickets" nameKey="ticket_category" paddingAngle={3}>
                      {byCat.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip content={<Tip/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,color:'#64748b'}}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-slate-300 text-5xl">📊</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REVENUE ──────────────────────────────────────────────────────── */}
      {!loading && active === 'Revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatBox label="Total Revenue" value={`₹${totalRev}`} color="#10b981" bg="#d1fae5"/>
            <StatBox label="Tickets Sold"  value={totalTix}        color="#6366f1" bg="#eef2ff"/>
            <StatBox label="Avg per Ticket" value={totalTix ? `₹${(totalRev/totalTix).toFixed(0)}` : '—'} color="#f59e0b" bg="#fef3c7"/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 bg-white border border-slate-100" style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-slate-800 mb-4">Revenue by Location</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byLoc} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)"/>
                  <XAxis dataKey="location_name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="revenue" name="Revenue (₹)" radius={[8,8,0,0]}>
                    {byLoc.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl p-6 bg-white border border-slate-100" style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-slate-800 mb-4">Payment Modes</h3>
              {byPay.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={byPay} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                      dataKey="total" nameKey="payment_mode" paddingAngle={3}>
                      {byPay.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip content={<Tip/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,color:'#64748b'}}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-slate-300 text-5xl">💳</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── VISITORS ─────────────────────────────────────────────────────── */}
      {!loading && active === 'Visitors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Total Visitors" value={totalVis}  color="#0ea5e9" bg="#e0f2fe"/>
            <StatBox label="Visit Purposes" value={byPurp.length} color="#a855f7" bg="#ede9fe" sub="Unique purposes"/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 bg-white border border-slate-100" style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-slate-800 mb-4">Visitors by Gender</h3>
              {byGender.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byGender} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="count" nameKey="gender" paddingAngle={3}>
                      {byGender.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip content={<Tip/>}/>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,color:'#64748b'}}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[240px] text-slate-300 text-5xl">👥</div>}
            </div>

            <div className="rounded-2xl p-6 bg-white border border-slate-100" style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
              <h3 className="font-bold text-slate-800 mb-4">Visit Purposes</h3>
              {byPurp.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byPurp} layout="vertical" barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)" horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="purpose" type="category" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={90}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="visits" name="Visits" radius={[0,8,8,0]}>
                      {byPurp.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-[240px] text-slate-300 text-5xl">📋</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── LOCATIONS ────────────────────────────────────────────────────── */}
      {!loading && active === 'Locations' && (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 bg-white border border-slate-100" style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
            <h3 className="font-bold text-slate-800 mb-4">Revenue by Location</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byLoc} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.6)"/>
                <XAxis dataKey="location_name" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="revenue" name="Revenue (₹)" radius={[8,8,0,0]}>
                  {byLoc.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {byLoc.map((l, i) => {
              const max = Math.max(...byLoc.map(x => x.revenue||0), 1);
              return (
                <div key={i} className="rounded-2xl p-5 bg-white border border-slate-100 hover:-translate-y-1 transition-transform duration-200 cursor-default"
                  style={{ boxShadow:'0 1px 20px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: COLORS[i%COLORS.length]+'22' }}>📍</div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                      style={{ background: COLORS[i%COLORS.length] }}>{l.tickets} tickets</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{l.location_name}</p>
                  <p className="text-lg font-black mt-1" style={{ color: COLORS[i%COLORS.length] }}>₹{parseFloat(l.revenue||0).toFixed(0)}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width:`${(l.revenue/max)*100}%`, background: COLORS[i%COLORS.length] }}/>
                  </div>
                </div>
              );
            })}
            {byLoc.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <span className="text-4xl opacity-30 block mb-2">📊</span>
                <p className="text-sm">No location data yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
