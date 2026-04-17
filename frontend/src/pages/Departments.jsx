import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const DEPT_ICONS = ['🏢','🔬','🎨','💻','📦','🔧','🏥','📊','🌿','🚀'];
const colorPalette = [
  { bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe' },
  { bg: '#d1fae5', color: '#10b981', border: '#a7f3d0' },
  { bg: '#fef3c7', color: '#f59e0b', border: '#fde68a' },
  { bg: '#ffe4e6', color: '#f43f5e', border: '#fecdd3' },
  { bg: '#e0f2fe', color: '#0ea5e9', border: '#bae6fd' },
  { bg: '#ede9fe', color: '#8b5cf6', border: '#ddd6fe' },
  { bg: '#ccfbf1', color: '#14b8a6', border: '#99f6e4' },
  { bg: '#ffedd5', color: '#f97316', border: '#fed7aa' },
];

const typeBadge = {
  guide:      { bg: '#e0f2fe', color: '#0369a1' },
  security:   { bg: '#fee2e2', color: '#b91c1c' },
  ticketing:  { bg: '#fef9c3', color: '#a16207' },
  maintenance:{ bg: '#f3e8ff', color: '#7c3aed' },
  manager:    { bg: '#dcfce7', color: '#15803d' },
};

const shiftBadge = {
  morning:    { bg: '#fef9c3', color: '#a16207' },
  afternoon:  { bg: '#ffedd5', color: '#c2410c' },
  evening:    { bg: '#ede9fe', color: '#6d28d9' },
  night:      { bg: '#1e293b', color: '#94a3b8' },
  rotational: { bg: '#e0f2fe', color: '#0369a1' },
};

const EMPTY = { department_name: '', location_id: '', description: '', head_staff_id: '' };

export default function Departments() {
  const location = useLocation();
  const [rows, setRows]         = useState([]);
  const [locs, setLocs]         = useState([]);
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [view, setView]         = useState('grid');
  const [modal, setModal]       = useState(false);
  const [membersModal, setMembersModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [members, setMembers]   = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/departments'),
      api.get('/locations').catch(() => ({ data: { data: [] } })),
      api.get('/staff').catch(() => ({ data: { data: [] } })),
    ]).then(([d, l, s]) => {
      setRows(d.data?.data ?? []);
      setLocs(l.data?.data ?? []);
      setStaff(s.data?.data ?? []);
    }).catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  }, []);

  // Reload every time user navigates to this page
  useEffect(() => { load(); }, [location.pathname, load]);

  // Also refresh staff list when modal opens (picks up newly added staff)
  const openNew = () => {
    api.get('/staff').then(r => setStaff(r.data?.data ?? [])).catch(() => {});
    setForm(EMPTY); setModal(true);
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || (r.department_name||'').toLowerCase().includes(q) || (r.location_name||'').toLowerCase().includes(q);
  });

  const openEdit = (row) => { setForm({ ...row }); setModal(true); };

  const openMembers = async (dept) => {
    setSelectedDept(dept);
    setMembersModal(true);
    setMembersLoading(true);
    try {
      const r = await api.get(`/departments/${dept.department_id}/members`);
      setMembers(r.data?.data ?? []);
    } catch { toast.error('Failed to load members'); setMembers([]); }
    finally { setMembersLoading(false); }
  };

  const save = async () => {
    if (!form.department_name?.trim()) return toast.error('Department name is required');
    if (!form.location_id) return toast.error('Location is required');
    setSaving(true);
    try {
      if (form.department_id) {
        await api.put(`/departments/${form.department_id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/departments', form);
        toast.success('Department created');
      }
      setModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  // ── TABLE columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'department_name', label: 'Department',
      render: (v, row) => {
        const idx = (row.department_id || 0) % colorPalette.length;
        const c = colorPalette[idx];
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}>
              {DEPT_ICONS[(row.department_id || 0) % DEPT_ICONS.length]}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{v}</p>
              <p className="text-xs text-slate-400">{row.location_name}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'head_staff_id', label: 'Head',
      render: (v, row) => row.head_name ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {row.head_name[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-700">{row.head_name}</span>
        </div>
      ) : <span className="text-slate-300 text-sm">—</span>
    },
    {
      key: 'member_count', label: 'Members',
      render: (v, row) => (
        <button onClick={() => openMembers(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
          style={{ background: '#eef2ff', color: '#6366f1' }}>
          <span>👥</span> {v ?? 0} members
        </button>
      )
    },
    {
      key: 'description', label: 'Description',
      render: v => <span className="text-xs text-slate-500 line-clamp-2 max-w-[220px]">{v || <span className="text-slate-300">—</span>}</span>
    },
    {
      key: 'department_id', label: 'Actions',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
            Edit
          </button>
          <button onClick={() => del(id, row.department_name)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors">
            Delete
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Departments</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage organisational structure, heads & members</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
          <span className="text-base">+</span> New Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: rows.length, icon: '🏢', bg: '#eef2ff', color: '#6366f1' },
          { label: 'With Head', value: rows.filter(r => r.head_staff_id).length, icon: '👤', bg: '#d1fae5', color: '#10b981' },
          { label: 'Total Members', value: rows.reduce((s,r) => s + (r.member_count||0), 0), icon: '👥', bg: '#fef3c7', color: '#f59e0b' },
          { label: 'Locations', value: new Set(rows.map(r => r.location_id)).size, icon: '📍', bg: '#ede9fe', color: '#8b5cf6' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-5 border transition-all hover:-translate-y-0.5 cursor-default select-none"
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

      {/* Toolbar */}
      <div className="rounded-2xl p-4 bg-white border border-slate-100 flex flex-wrap gap-3 items-center justify-between"
        style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 transition-colors">
          <span className="text-slate-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or location…"
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1" />
          {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          {[['grid','⊞ Grid'],['table','☰ Table']].map(([v,lbl]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 h-8 rounded-lg text-xs font-semibold transition-all duration-200
                ${view===v ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID VIEW ────────────────────────────────────────────────────── */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {!loading && filtered.map((d, i) => {
            const c = colorPalette[i % colorPalette.length];
            const icon = DEPT_ICONS[i % DEPT_ICONS.length];
            return (
              <div key={d.department_id}
                className="rounded-2xl bg-white border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group overflow-hidden"
                style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.06)' }}>

                {/* Colour bar */}
                <div className="h-1.5 w-full" style={{ background: c.color }} />

                <div className="p-5">
                  {/* Icon + name row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      {icon}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                      style={{ color: c.color, background: c.bg }}>
                      {d.location_name?.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{d.department_name}</h3>
                  {d.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{d.description}</p>
                  )}

                  {/* Head */}
                  <div className="mt-3 flex items-center gap-2 py-2.5 px-3 rounded-xl border"
                    style={{ background: d.head_name ? c.bg : '#f8fafc', borderColor: d.head_name ? c.border : '#e2e8f0' }}>
                    {d.head_name ? (
                      <>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: c.color }}>
                          {d.head_name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.color + '99' }}>Head</p>
                          <p className="text-xs font-semibold text-slate-700 truncate">{d.head_name}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-300 text-sm">👤</span>
                        <span className="text-xs text-slate-400 italic">No head assigned</span>
                      </>
                    )}
                  </div>

                  {/* Member count badge */}
                  <button onClick={() => openMembers(d)}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: c.bg, color: c.color }}>
                    <span>👥</span>
                    <span>{d.member_count ?? 0} active member{d.member_count !== 1 ? 's' : ''}</span>
                    <span className="ml-auto opacity-50">→</span>
                  </button>

                  {/* Action buttons (appear on hover) */}
                  <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button onClick={() => openEdit(d)}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                      ✏️ Edit
                    </button>
                    <button onClick={() => del(d.department_id, d.department_name)}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors">
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="col-span-4 flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-5xl mb-3 opacity-30">🏢</span>
              <p className="text-sm font-medium">No departments found</p>
            </div>
          )}

          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 h-52 animate-pulse"
              style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.04)' }} />
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ───────────────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white"
          style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.06)' }}>
          <DataTable columns={columns} data={filtered} loading={loading} emptyMsg="No departments found" />
        </div>
      )}

      {/* ── ADD / EDIT MODAL ─────────────────────────────────────────────── */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={form.department_id ? '✏️ Edit Department' : '🏢 New Department'} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Name *</label>
            <input value={form.department_name || ''}
              onChange={e => setForm(f => ({ ...f, department_name: e.target.value }))}
              placeholder="e.g. Engineering, Security…"
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location *</label>
            <select value={form.location_id || ''}
              onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors">
              <option value="">— Select location —</option>
              {locs.map(l => <option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Head</label>
            <select value={form.head_staff_id || ''}
              onChange={e => setForm(f => ({ ...f, head_staff_id: e.target.value }))}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors">
              <option value="">— No head assigned —</option>
              {staff.map(s => (
                <option key={s.staff_id} value={s.staff_id}>
                  {s.staff_name} ({s.staff_type})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">The staff member who leads this department</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="What does this department do?"
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 transition-colors resize-none" />
          </div>

          {/* Head preview */}
          {form.head_staff_id && (() => {
            const s = staff.find(s => String(s.staff_id) === String(form.head_staff_id));
            if (!s) return null;
            return (
              <div className="rounded-xl p-3 bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {s.staff_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-800">{s.staff_name}</p>
                  <p className="text-xs text-indigo-400 capitalize">{s.staff_type} · {s.shift} shift</p>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
              {saving ? 'Saving…' : form.department_id ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MEMBERS MODAL ────────────────────────────────────────────────── */}
      <Modal open={membersModal} onClose={() => setMembersModal(false)}
        title={selectedDept ? `👥 ${selectedDept.department_name} — Members` : 'Members'} size="lg">
        {membersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="text-4xl mb-2 opacity-30">👥</span>
            <p className="text-sm font-medium">No active members in this department</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Head callout */}
            {selectedDept?.head_name && (
              <div className="rounded-xl p-3 bg-indigo-50 border border-indigo-100 flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {selectedDept.head_name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Department Head</p>
                  <p className="text-sm font-bold text-indigo-800">{selectedDept.head_name}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-600">Head</span>
              </div>
            )}

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
              {members.length} Active Member{members.length !== 1 ? 's' : ''}
            </p>

            {members.map((m, i) => {
              const tb = typeBadge[m.staff_type] || { bg: '#f1f5f9', color: '#64748b' };
              const sb = shiftBadge[m.shift] || { bg: '#f1f5f9', color: '#64748b' };
              return (
                <div key={m.staff_id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-150">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${colorPalette[i%colorPalette.length].color},${colorPalette[(i+2)%colorPalette.length].color})` }}>
                    {m.staff_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.staff_name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.email || m.phone_no || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold capitalize" style={{ ...tb }}>{m.staff_type}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold capitalize" style={{ ...sb }}>{m.shift}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
