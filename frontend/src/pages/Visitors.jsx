import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

const EMPTY={name:'',phone_no:'',email:'',address:'',id_proof_type:'aadhaar',id_proof_no:'',date_of_birth:'',gender:'male'};
const ID_TYPES=['aadhaar','passport','driving_license','voter_id','pan_card'];

export default function Visitors() {
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [detail,setDetail]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [editing,setEditing]=useState(null);
  const [search,setSearch]=useState('');

  const load=()=>{ setLoading(true); api.get('/visitors'+(search?`?search=${encodeURIComponent(search)}`:''))
    .then(r=>setData((r.data?.data ?? r.data)||[])).catch(()=>toast.error('Failed to load visitors')).finally(()=>setLoading(false)); };
  useEffect(load,[search]);

  const open=(row=null)=>{ setEditing(row); setForm(row?{...row}:EMPTY); setModal(true); };
  const close=()=>{ setModal(false); setEditing(null); setForm(EMPTY); };
  const openDetail=async(id)=>{
    try{ const r=await api.get(`/visitors/${id}`); setDetail(r.data?.data ?? r.data); }
    catch(e){ toast.error(e.response?.data?.message||'Could not load visitor details'); }
  };
  const save=async(e)=>{ e.preventDefault(); try{ if(editing) await api.put(`/visitors/${editing.visitor_id}`,form); else await api.post('/visitors',form); toast.success(editing?'Updated!':'Registered!'); close(); load(); }catch(e){ toast.error(e.response?.data?.message||'Save failed'); } };

  const cols=[
    {key:'name',label:'Visitor',render:(v,r)=>(
      <button onClick={()=>openDetail(r.visitor_id)} className="text-left group">
        <p className="font-semibold text-indigo-600 group-hover:text-indigo-800 text-sm transition-colors">{v}</p>
        <p className="text-xs text-slate-400">{r.phone_no}</p>
      </button>
    )},
    {key:'email',label:'Email',render:v=><span className="text-slate-500 text-xs">{v||'—'}</span>},
    {key:'gender',label:'Gender',render:v=><span className="badge-blue capitalize">{v||'—'}</span>},
    {key:'id_proof_type',label:'ID Type',render:v=><span className="text-xs text-slate-500 capitalize">{v?.replace('_',' ')}</span>},
    {key:'id_proof_no',label:'ID No.',render:v=><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{v}</code>},
    {key:'created_at',label:'Registered',render:v=>new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})},
    {key:'visitor_id',label:'',render:(id,row)=>(
      <button onClick={()=>open(row)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Edit</button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone, email…" className="input pl-9"/>
        </div>
        <button onClick={()=>open()} className="btn-primary">+ Register Visitor</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Visitor Registry</h3>
          <span className="badge-gray">{data.length} registered</span>
        </div>
        <DataTable columns={cols} data={data} loading={loading}/>
      </div>

      <Modal open={modal} onClose={close} title={editing?'Edit Visitor':'Register New Visitor'} size="lg">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Full Name</label><input className="input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="label">Phone</label><input className="input" required value={form.phone_no} onChange={e=>setForm({...form,phone_no:e.target.value})}/></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.date_of_birth?.slice(0,10)||''} onChange={e=>setForm({...form,date_of_birth:e.target.value})}/></div>
          <div><label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
              {['male','female','other'].map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">ID Proof Type</label>
            <select className="input" value={form.id_proof_type} onChange={e=>setForm({...form,id_proof_type:e.target.value})}>
              {ID_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div><label className="label">ID Proof No.</label><input className="input" required value={form.id_proof_no} onChange={e=>setForm({...form,id_proof_no:e.target.value})}/></div>
          <div className="col-span-2"><label className="label">Address</label><textarea className="input resize-none" rows={2} value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={close} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing?'Save Changes':'Register'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={()=>setDetail(null)} title="Visitor Profile" size="xl">
        {detail&&(
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{background:'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))'}}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                {detail.name?.charAt(0)}
              </div>
              <div><p className="font-bold text-slate-900 text-lg">{detail.name}</p><p className="text-slate-500 text-sm">{detail.phone_no} · {detail.email||'No email'}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['Gender',detail.gender],['ID Type',detail.id_proof_type?.replace('_',' ')],['ID No.',detail.id_proof_no],
                ['DOB',detail.date_of_birth?new Date(detail.date_of_birth).toLocaleDateString('en-IN'):'—'],
                ['Registered',new Date(detail.created_at).toLocaleDateString('en-IN')],
                ['Visits',detail.visit_history?.length||0]
              ].map(([l,v])=>(
                <div key={l} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{l}</p>
                  <p className="font-semibold text-slate-800 mt-0.5 capitalize">{v}</p>
                </div>
              ))}
            </div>
            {detail.visit_history?.length>0&&(
              <div>
                <h4 className="font-bold text-slate-700 text-sm mb-3">Visit History</h4>
                <div className="space-y-2">
                  {detail.visit_history.map((v,i)=>(
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm">
                      <span className={v.visit_status==='completed'?'badge-green':'badge-yellow'}>{v.visit_status}</span>
                      <span className="font-medium text-slate-700 flex-1">{v.location_name}</span>
                      <span className="text-slate-500">{new Date(v.visit_date).toLocaleDateString('en-IN')}</span>
                      <span className="font-bold text-slate-800">₹{v.final_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
