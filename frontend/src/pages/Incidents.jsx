import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

/* ── Schema truth ────────────────────────────────────────────────────────────
   INCIDENT_REPORT: incident_id, location_id, reported_by_staff (FK STAFF),
   incident_type ENUM(security,medical,lost_item,lost_child,damage,other),
   severity ENUM(low,medium,high,critical), description, incident_time,
   resolved BOOL, resolved_at, resolution_notes
   ─────────────────────────────────────────────────────────────────────────── */

const SEV = {
  low:      { color: '#10b981', bg: '#d1fae5', label: 'Low' },
  medium:   { color: '#f59e0b', bg: '#fef3c7', label: 'Medium' },
  high:     { color: '#f43f5e', bg: '#ffe4e6', label: 'High' },
  critical: { color: '#7c3aed', bg: '#ede9fe', label: 'Critical' },
};

const TYPES = [
  { value: 'security',   label: '🔒 Security' },
  { value: 'medical',    label: '🏥 Medical' },
  { value: 'lost_item',  label: '🎒 Lost Item' },
  { value: 'lost_child', label: '👶 Lost Child' },
  { value: 'damage',     label: '🔨 Damage' },
  { value: 'other',      label: '📋 Other' },
];

const SevBadge = ({ v }) => {
  const m = SEV[v] || { color: '#64748b', bg: '#f1f5f9', label: v || '—' };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
      style={{ color: m.color, background: m.bg }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: m.color }} />
      {m.label}
    </span>
  );
};

const EMPTY = {
  location_id: '', reported_by_staff: '', incident_type: 'security',
  severity: 'low', description: '', resolution_notes: '', resolved: false,
};

export default function Incidents() {
  const [rows, setRows]       = useState([]);
  const [locs, setLocs]       = useState([]);
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sevFilter, setSev]   = useState('');
  const [resFilter, setRes]   = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/incidents'),
      api.get('/locations').catch(() => ({ data: { data: [] } })),
      api.get('/staff').catch(() => ({ data: { data: [] } })),
    ]).then(([r, l, s]) => {
      setRows(r.data?.data ?? []);
      setLocs(l.data?.data ?? []);
      setStaff(s.data?.data ?? []);
    }).catch(() => toast.error('Failed to load incidents'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || (r.description||'').toLowerCase().includes(q)
                     || (r.location_name||'').toLowerCase().includes(q)
                     || (r.reported_by_name||'').toLowerCase().includes(q);
    const matchS = !sevFilter || r.severity === sevFilter;
    const matchR = resFilter === '' || String(r.resolved ? '1' : '0') === resFilter;
    return matchQ && matchS && matchR;
  });

  const openNew  = () => { setForm(EMPTY); setModal(true); };
  const openEdit = (row) => {
    setForm({
      incident_id: row.incident_id,
      location_id: row.location_id,
      reported_by_staff: row.reported_by_staff,
      incident_type: row.incident_type,
      severity: row.severity,
      description: row.description,
      resolution_notes: row.resolution_notes || '',
      resolved: !!row.resolved,
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.location_id)       return toast.error('Location is required');
    if (!form.reported_by_staff) return toast.error('Reporting staff is required');
    if (!form.description.trim()) return toast.error('Description is required');
    setSaving(true);
    try {
      if (form.incident_id) {
        await api.put(`/incidents/${form.incident_id}`, form);
        toast.success('Incident updated');
      } else {
        await api.post('/incidents', form);
        toast.success('Incident reported');
      }
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const quickResolve = async (id, e) => {
    e.stopPropagation();
    const notes = window.prompt('Resolution notes (optional):') ?? '';
    if (notes === null) return; // cancelled
    try {
      await api.patch(`/incidents/${id}/resolve`, { resolution_notes: notes });
      toast.success('✅ Incident resolved');
      load();
    } catch { toast.error('Failed to resolve'); }
  };

  // Stats
  const counts = {
    total: rows.length,
    open: rows.filter(r => !r.resolved).length,
    critical: rows.filter(r => r.severity === 'critical').length,
    resolved: rows.filter(r => r.resolved).length,
  };

  const columns = [
    {
      key: 'incident_type', label: 'Incident',
      render: (v, row) => (
        <button onClick={() => openEdit(row)} className="text-left group">
          <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm capitalize">
            {TYPES.find(t => t.value === v)?.label || v}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-[180px]">{row.description}</p>
        </button>
      )
    },
    { key: 'severity', label: 'Severity', render: v => <SevBadge v={v} /> },
    {
      key: 'resolved', label: 'Status',
      render: (v, row) => v
        ? <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">✅ Resolved</span>
        : <button onClick={(e) => quickResolve(row.incident_id, e)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
            🔴 Open — Resolve
          </button>
    },
    {
      key: 'location_name', label: 'Location',
      render: v => <span className="text-sm text-slate-600">{v || '—'}</span>
    },
    {
      key: 'reported_by_name', label: 'Reported By',
      render: (v, row) => v
        ? <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {v[0].toUpperCase()}
            </div>
            <span className="text-sm text-slate-700">{v}</span>
          </div>
        : <span className="text-slate-300">—</span>
    },
    {
      key: 'incident_time', label: 'Time',
      render: v => v ? (
        <div>
          <p className="text-xs font-semibold text-slate-700">{new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</p>
          <p className="text-xs text-slate-400">{new Date(v).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
        </div>
      ) : '—'
    },
    {
      key: 'incident_id', label: '',
      render: (_, row) => (
        <button onClick={() => openEdit(row)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
          Edit
        </button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Incident Reports</h2>
          <p className="text-slate-400 text-sm mt-0.5">Track and resolve operational & security incidents</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)', boxShadow: '0 6px 20px rgba(244,63,94,0.35)' }}>
          ⚠️ Report Incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: counts.total,    icon: '📋', bg: '#eef2ff', color: '#6366f1' },
          { label: 'Open',     value: counts.open,     icon: '🔴', bg: '#ffe4e6', color: '#f43f5e' },
          { label: 'Critical', value: counts.critical, icon: '🚨', bg: '#ede9fe', color: '#7c3aed' },
          { label: 'Resolved', value: counts.resolved, icon: '✅', bg: '#d1fae5', color: '#10b981' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-5 border cursor-default select-none transition-all hover:-translate-y-0.5"
            style={{ background: c.bg, borderColor: c.color + '30', boxShadow: `0 4px 16px ${c.color}18` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: c.color + 'bb' }}>{c.label}</p>
                <p className="text-3xl font-black mt-1" style={{ color: c.color }}>{loading ? '…' : c.value}</p>
              </div>
              <span className="text-2xl">{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 bg-white border border-slate-100 flex flex-wrap gap-3 items-center"
        style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 transition-colors">
          <span className="text-slate-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search description, location, staff…"
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1" />
          {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>}
        </div>
        <select value={sevFilter} onChange={e => setSev(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:border-indigo-400 transition-colors">
          <option value="">All Severities</option>
          {Object.keys(SEV).map(s => <option key={s} value={s}>{SEV[s].label}</option>)}
        </select>
        <select value={resFilter} onChange={e => setRes(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:border-indigo-400 transition-colors">
          <option value="">All Statuses</option>
          <option value="0">Open</option>
          <option value="1">Resolved</option>
        </select>
        {(search || sevFilter || resFilter !== '') && (
          <button onClick={() => { setSearch(''); setSev(''); setRes(''); }}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white"
        style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.06)' }}>
        <DataTable columns={columns} data={filtered} loading={loading} emptyMsg="No incidents found" />
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={form.incident_id ? '✏️ Edit Incident' : '⚠️ Report New Incident'} size="lg">
        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location *</label>
              <select value={form.location_id}
                onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors">
                <option value="">— Select location —</option>
                {locs.map(l => <option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reported By (Staff) *</label>
              <select value={form.reported_by_staff}
                onChange={e => setForm(f => ({ ...f, reported_by_staff: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors">
                <option value="">— Select staff —</option>
                {staff.map(s => <option key={s.staff_id} value={s.staff_id}>{s.staff_name} ({s.staff_type})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Incident Type *</label>
              <select value={form.incident_type}
                onChange={e => setForm(f => ({ ...f, incident_type: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Severity *</label>
              <select value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors">
                {Object.entries(SEV).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description *</label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Describe what happened in detail…"
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors resize-none" />
          </div>

          {/* Resolution section (show when editing) */}
          {form.incident_id && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolution</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.resolved}
                    onChange={e => setForm(f => ({ ...f, resolved: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Mark as Resolved</span>
                </label>
              </div>
              <textarea value={form.resolution_notes}
                onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))}
                rows={2} placeholder="How was this incident resolved? (optional)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors resize-none" />
            </div>
          )}

          {/* Severity preview pill */}
          <div className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: SEV[form.severity]?.bg || '#f1f5f9' }}>
            <SevBadge v={form.severity} />
            <span className="text-xs text-slate-500">Classified as <strong>{SEV[form.severity]?.label}</strong> severity incident.</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
              {saving ? 'Saving…' : form.incident_id ? 'Update Incident' : 'Report Incident'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
