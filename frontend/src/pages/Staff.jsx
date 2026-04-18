import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

const EMPTY={staff_name:'',staff_type:'security',department_id:'',phone_no:'',email:'',shift:'morning',hire_date:'',is_active:1};
const TYPES=['guide','security','ticketing','maintenance','manager'];
const SHIFTS=['morning','afternoon','evening','night','rotational'];

export default function Staff() {
  const [data,setData]=useState([]);
  const [depts,setDepts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(EMPTY);
  const [editing,setEditing]=useState(null);
  const [filter,setFilter]=useState({type:'',active:''});
  const [search,setSearch]=useState('');

  const load=()=>{
    setLoading(true);
    const q=new URLSearchParams();
    if(filter.type) q.set('staff_type',filter.type);
    if(filter.active) q.set('active',filter.active);
    Promise.all([api.get('/staff?'+q),api.get('/departments')])
      .then(([s,d])=>{ setData((s.data?.data ?? s.data)||[]); setDepts((d.data?.data ?? d.data)||[]); })
      .catch(()=>toast.error('Failed to load staff'))
      .finally(()=>setLoading(false));
  };
  useEffect(load,[filter]);

  const filtered=data.filter(s=>s.staff_name.toLowerCase().includes(search.toLowerCase())||s.phone_no.includes(search));
  const open=(row=null)=>{ setEditing(row); setForm(row?{...row}:EMPTY); setModal(true); };
  const close=()=>{ setModal(false); setEditing(null); setForm(EMPTY); };
  const save=async(e)=>{ e.preventDefault(); try{ if(editing) await api.put(`/staff/${editing.staff_id}`,form); else await api.post('/staff',form); toast.success(editing?'Staff updated!':'Staff added!'); close(); load(); }catch(e){ toast.error(e.response?.data?.message||'Save failed'); } };
  const toggle=async(id)=>{ try{ await api.patch(`/staff/${id}/toggle`); toast.success('Status toggled'); load(); }catch(e){ toast.error(e.response?.data?.message||'Failed to update status'); } };

  const typeBadge=(t)=>{
    const m={guide:'badge-green',security:'badge-red',ticketing:'badge-blue',maintenance:'badge-yellow',manager:'badge-purple'};
    return <span className={m[t]||'badge-gray'}>{t}</span>;
  };
  const shiftBadge=(s)=>{
    const m={morning:'badge-yellow',afternoon:'badge-blue',evening:'badge-purple',night:'badge-gray',rotational:'badge-green'};
    return <span className={m[s]||'badge-gray'}>{s}</span>;
  };

  const cols=[
    {key:'staff_name',label:'Name',render:(v,r)=>(
      <div><p className="font-semibold text-slate-800 text-sm">{v}</p><p className="text-xs text-slate-400">{r.email||'—'}</p></div>
    )},
    {key:'staff_type',label:'Type',render:v=>typeBadge(v)},
    {key:'department_name',label:'Department'},
    {key:'location_name',label:'Location'},
    {key:'phone_no',label:'Phone'},
    {key:'shift',label:'Shift',render:v=>shiftBadge(v)},
    {key:'hire_date',label:'Hired',render:v=>v?new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'},
    {key:'is_active',label:'Status',render:v=><span className={v?'badge-green':'badge-red'}>{v?'Active':'Inactive'}</span>},
    {key:'staff_id',label:'',render:(id,row)=>(
      <div className="flex gap-2">
        <button onClick={()=>open(row)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Edit</button>
        <button onClick={()=>toggle(id)} className="text-xs font-semibold text-slate-400 hover:text-slate-700">{row.is_active?'Deactivate':'Activate'}</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff…" className="input pl-9 w-48"/>
          </div>
          <select value={filter.type} onChange={e=>setFilter({...filter,type:e.target.value})} className="input w-40">
            <option value="">All Types</option>
            {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filter.active} onChange={e=>setFilter({...filter,active:e.target.value})} className="input w-32">
            <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </div>
        <button onClick={()=>open()} className="btn-primary">+ Add Staff</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Team Members</h3>
          <span className="badge-gray">{filtered.length} members</span>
        </div>
        <DataTable columns={cols} data={filtered} loading={loading}/>
      </div>

      <Modal open={modal} onClose={close} title={editing?'Edit Staff Member':'Add Staff Member'} size="lg">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Full Name</label><input className="input" required value={form.staff_name} onChange={e=>setForm({...form,staff_name:e.target.value})}/></div>
          <div><label className="label">Type</label>
            <select className="input" value={form.staff_type} onChange={e=>setForm({...form,staff_type:e.target.value})}>
              {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Department</label>
            <select className="input" required value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})}>
              <option value="">Select…</option>
              {depts.map(d=><option key={d.department_id} value={d.department_id}>{d.department_name} – {d.location_name}</option>)}
            </select>
          </div>
          <div><label className="label">Phone</label><input className="input" required value={form.phone_no} onChange={e=>setForm({...form,phone_no:e.target.value})}/></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><label className="label">Shift</label>
            <select className="input" value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})}>
              {SHIFTS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Hire Date</label><input type="date" className="input" required value={form.hire_date?.slice(0,10)||''} onChange={e=>setForm({...form,hire_date:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing?'Save Changes':'Add Staff'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
