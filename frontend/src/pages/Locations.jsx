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

  const load=()=>{ setLoading(true); api.get('/locations').then(r=>setData(r.data.data||[])).catch(()=>toast.error('Failed to load locations')).finally(()=>setLoading(false)); };
  useEffect(load,[]);

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
