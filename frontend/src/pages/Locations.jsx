import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

const EMPTY = { location_name:'', location_type:'zoo', address:'', city:'', state:'', pincode:'', capacity:'', contact_no:'', email:'', opening_time:'', closing_time:'' };

export default function Locations() {
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(EMPTY);
  const [editing,setEditing]=useState(null);
  const [search,setSearch]=useState('');

  // Daily capacity + pricing management
  const [capDate,setCapDate]=useState(new Date().toISOString().slice(0,10));
  const [capacity,setCapacity]=useState([]);
  const [capLoading,setCapLoading]=useState(false);
  const [pricingLoc,setPricingLoc]=useState('');
  const [pricing,setPricing]=useState([]);
  const [pricingLoading,setPricingLoading]=useState(false);

  const load=()=>{ setLoading(true); api.get('/locations').then(r=>setData((r.data?.data ?? r.data)||[])).catch(()=>toast.error('Failed to load locations')).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  useEffect(()=>{
    if(!capDate) return;
    setCapLoading(true);
    api.get('/locations/daily-capacity',{params:{visit_date:capDate}})
      .then(r=>setCapacity((r.data?.data ?? r.data)||[]))
      .catch(()=>toast.error('Failed to load daily capacity'))
      .finally(()=>setCapLoading(false));
  },[capDate]);

  useEffect(()=>{
    if(!pricingLoc && data?.[0]?.location_id) setPricingLoc(String(data[0].location_id));
  },[data,pricingLoc]);

  useEffect(()=>{
    if(!pricingLoc) return;
    setPricingLoading(true);
    api.get('/locations/pricing-config',{params:{location_id:pricingLoc,visit_date:capDate}})
      .then(r=>setPricing((r.data?.data ?? r.data)||[]))
      .catch(()=>toast.error('Failed to load pricing config'))
      .finally(()=>setPricingLoading(false));
  },[pricingLoc,capDate]);

  const filtered=data.filter(l=>l.location_name.toLowerCase().includes(search.toLowerCase())||l.city.toLowerCase().includes(search.toLowerCase()));
  const open=(row=null)=>{ setEditing(row); setForm(row?{...row}:EMPTY); setModal(true); };
  const close=()=>{ setModal(false); setEditing(null); setForm(EMPTY); };

  const save=async(e)=>{ e.preventDefault(); try{ if(editing) await api.put(`/locations/${editing.location_id}`,form); else await api.post('/locations',form); toast.success(editing?'Location updated!':'Location created!'); close(); load(); }catch(e){ toast.error(e.response?.data?.message||'Save failed'); } };
  const toggle=async(id)=>{ try{ await api.patch(`/locations/${id}/toggle`); toast.success('Status updated'); load(); }catch(e){ toast.error(e.response?.data?.message||'Failed to update status'); } };

  const typeBadge=(t)=>{
    const m={zoo:'badge-green',museum:'badge-blue',park:'badge-yellow',aquarium:'badge-indigo',botanical_garden:'badge-purple'};
    return <span className={m[t]||'badge-gray'}>{t?.replace('_',' ')}</span>;
  };

  const cols=[
    {key:'location_name',label:'Name',render:(v)=><span className="font-semibold text-slate-800">{v}</span>},
    {key:'location_type',label:'Type',render:v=>typeBadge(v)},
    {key:'city',label:'City'},
    {key:'capacity',label:'Capacity',render:v=><span className="font-semibold">{v?.toLocaleString()}</span>},
    {key:'opening_time',label:'Hours',render:(v,r)=><span className="text-xs text-slate-500">{v||'—'} – {r.closing_time||'—'}</span>},
    {key:'contact_no',label:'Contact'},
    {key:'is_active',label:'Status',render:v=><span className={v?'badge-green':'badge-red'}>{v?'Active':'Inactive'}</span>},
    {key:'location_id',label:'Actions',render:(id,row)=>(
      <div className="flex gap-2">
        <button onClick={()=>open(row)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Edit</button>
        <button onClick={()=>toggle(id)} className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">{row.is_active?'Deactivate':'Activate'}</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search locations…" className="input pl-9"/>
        </div>
        <button onClick={()=>open()} className="btn-primary">+ Add Location</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">All Locations</h3>
          <span className="badge-gray">{filtered.length} total</span>
        </div>
        <DataTable columns={cols} data={filtered} loading={loading}/>
      </div>

      {/* Daily Capacity Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Ticket Availability</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily capacity vs booked tickets (public bookings sync instantly)</p>
            </div>
            <input type="date" className="input w-44" value={capDate} onChange={e=>setCapDate(e.target.value)}/>
          </div>

          {capLoading ? (
            <div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-14 rounded-xl skeleton-shimmer"/>)}</div>
          ) : (
            <div className="space-y-2">
              {capacity.map((c)=>(
                <div key={c.location_id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-semibold text-slate-800 text-sm">{c.location_name}</p>
                    <p className="text-xs text-slate-400">{c.tickets_sold} sold · {c.remaining} remaining</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Max/day</span>
                    <input
                      type="number"
                      min="1"
                      className="input w-28"
                      value={c.max_tickets}
                      onChange={e=>setCapacity(prev=>prev.map(x=>x.location_id===c.location_id?{...x,max_tickets:e.target.value}:x))}
                    />
                    <button
                      onClick={async()=>{
                        try{
                          await api.put('/locations/daily-capacity',{location_id:c.location_id,visit_date:capDate,max_tickets:Number(c.max_tickets)});
                          toast.success('Capacity saved');
                          const r=await api.get('/locations/daily-capacity',{params:{visit_date:capDate}});
                          setCapacity((r.data?.data ?? r.data)||[]);
                        }catch(e){ toast.error(e.response?.data?.message||'Save failed'); }
                      }}
                      className="btn-primary text-xs py-2 px-3"
                    >Save</button>
                  </div>
                </div>
              ))}
              {capacity.length===0 && <div className="text-sm text-slate-400 py-10 text-center">No locations found</div>}
            </div>
          )}
        </div>

        {/* Pricing Configuration */}
        <div className="card">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Pricing Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">Updates reflect immediately in the public booking site</p>
            </div>
            <select className="input w-64" value={pricingLoc} onChange={e=>setPricingLoc(e.target.value)}>
              {data.filter(x=>x.is_active).map(l=><option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
            </select>
          </div>

          {pricingLoading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-14 rounded-xl skeleton-shimmer"/>)}</div>
          ) : (
            <div className="space-y-2">
              {['adult','child','student','senior_citizen','family'].map((cat)=>{
                const row = pricing.find(p=>p.ticket_category===cat) || { ticket_category: cat, base_price: 0, discount_pct: 0 };
                return (
                  <div key={cat} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="col-span-4">
                      <p className="font-semibold text-slate-800 text-sm capitalize">{cat.replace('_',' ')}</p>
                      <p className="text-xs text-slate-400">Effective: {String(row.effective_from||capDate).slice(0,10)}</p>
                    </div>
                    <div className="col-span-4">
                      <label className="text-xs text-slate-500">Base price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input mt-1"
                        value={row.base_price}
                        onChange={e=>{
                          const v=e.target.value;
                          setPricing(prev=>{
                            const exists=prev.some(p=>p.ticket_category===cat);
                            return exists
                              ? prev.map(p=>p.ticket_category===cat?{...p,base_price:v}:p)
                              : [...prev,{...row,base_price:v}];
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-slate-500">Discount %</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="input mt-1"
                        value={row.discount_pct}
                        onChange={e=>{
                          const v=e.target.value;
                          setPricing(prev=>{
                            const exists=prev.some(p=>p.ticket_category===cat);
                            return exists
                              ? prev.map(p=>p.ticket_category===cat?{...p,discount_pct:v}:p)
                              : [...prev,{...row,discount_pct:v}];
                          });
                        }}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        className="btn-primary text-xs py-2 px-3"
                        onClick={async()=>{
                          try{
                            await api.put('/locations/pricing-config',{
                              location_id:Number(pricingLoc),
                              ticket_category:cat,
                              base_price:Number(row.base_price||0),
                              discount_pct:Number(row.discount_pct||0),
                              effective_from:capDate,
                            });
                            toast.success('Pricing updated');
                            const r=await api.get('/locations/pricing-config',{params:{location_id:pricingLoc,visit_date:capDate}});
                            setPricing((r.data?.data ?? r.data)||[]);
                          }catch(e){ toast.error(e.response?.data?.message||'Update failed'); }
                        }}
                      >Save</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={close} title={editing?'Edit Location':'Add New Location'} size="lg">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Location Name</label><input className="input" required value={form.location_name} onChange={e=>setForm({...form,location_name:e.target.value})}/></div>
          <div><label className="label">Type</label>
            <select className="input" value={form.location_type} onChange={e=>setForm({...form,location_type:e.target.value})}>
              {['zoo','museum','park','aquarium','botanical_garden'].map(o=><option key={o} value={o}>{o.replace('_',' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Capacity</label><input type="number" className="input" required value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}/></div>
          <div><label className="label">City</label><input className="input" required value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
          <div><label className="label">State</label><input className="input" required value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/></div>
          <div><label className="label">Pincode</label><input className="input" value={form.pincode||''} onChange={e=>setForm({...form,pincode:e.target.value})}/></div>
          <div><label className="label">Contact</label><input className="input" value={form.contact_no||''} onChange={e=>setForm({...form,contact_no:e.target.value})}/></div>
          <div><label className="label">Opening Time</label><input type="time" className="input" value={form.opening_time||''} onChange={e=>setForm({...form,opening_time:e.target.value})}/></div>
          <div><label className="label">Closing Time</label><input type="time" className="input" value={form.closing_time||''} onChange={e=>setForm({...form,closing_time:e.target.value})}/></div>
          <div className="col-span-2"><label className="label">Address</label><input className="input" required value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
          <div className="col-span-2"><label className="label">Email</label><input type="email" className="input" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing?'Save Changes':'Create Location'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
