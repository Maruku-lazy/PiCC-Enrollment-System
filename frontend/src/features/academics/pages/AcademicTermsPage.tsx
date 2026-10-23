import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Check, Trash2, Edit3, X, Save } from 'lucide-react';
import { academicService, type AcademicTerm, type CreateTermPayload } from '../services/academicService';

const SEMESTER_LABELS: Record<number, string> = { 1: '1st Semester', 2: '2nd Semester', 3: 'Summer' };

const emptyForm: CreateTermPayload = {
  academic_year: '',
  semester: 1,
  is_current: false,
  enrollment_start: null,
  enrollment_end: null,
  grading_start: null,
  grading_end: null,
};

export default function AcademicTermsPage() {
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateTermPayload>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicService.getTerms();
      setTerms(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => { await load(); };
    void run();
  }, [load]);

  async function handleSave() {
    if (!form.academic_year.trim()) {
      setError('Academic year is required (e.g. "2026-2027").');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await academicService.updateTerm(editingId, form);
      } else {
        await academicService.createTerm(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetCurrent(id: string) {
    setError(null);
    try {
      await academicService.setCurrentTerm(id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this academic term? This cannot be undone if there are no dependent records.')) return;
    setError(null);
    try {
      await academicService.deleteTerm(id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function startEdit(term: AcademicTerm) {
    setForm({
      academic_year: term.academic_year,
      semester: term.semester,
      is_current: term.is_current,
      enrollment_start: term.enrollment_start,
      enrollment_end: term.enrollment_end,
      grading_start: term.grading_start,
      grading_end: term.grading_end,
    });
    setEditingId(term.id);
    setShowForm(true);
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '0.3rem',
    display: 'block',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#0c1e3d', margin: 0, fontSize: '1.85rem' }}>Academic Terms</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
            Configure enrollment and grading windows for each academic period.
          </p>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setShowForm(true); setError(null); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1.1rem', background: '#0c1e3d', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Add Term
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', color: '#be123c', fontSize: '0.82rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#0c1e3d', fontSize: '1rem' }}>
              {editingId ? 'Edit Academic Term' : 'New Academic Term'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Academic Year *</label>
              <input
                style={inputStyle}
                placeholder="e.g. 2026-2027"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Semester *</label>
              <select
                style={inputStyle}
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
              >
                <option value={1}>1st Semester</option>
                <option value={2}>2nd Semester</option>
                <option value={3}>Summer</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                />
                Set as Current Term
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Enrollment Start</label>
              <input type="datetime-local" style={inputStyle} value={form.enrollment_start || ''} onChange={(e) => setForm({ ...form, enrollment_start: e.target.value || null })} />
            </div>
            <div>
              <label style={labelStyle}>Enrollment End</label>
              <input type="datetime-local" style={inputStyle} value={form.enrollment_end || ''} onChange={(e) => setForm({ ...form, enrollment_end: e.target.value || null })} />
            </div>
            <div>
              <label style={labelStyle}>Grading Start</label>
              <input type="datetime-local" style={inputStyle} value={form.grading_start || ''} onChange={(e) => setForm({ ...form, grading_start: e.target.value || null })} />
            </div>
            <div>
              <label style={labelStyle}>Grading End</label>
              <input type="datetime-local" style={inputStyle} value={form.grading_end || ''} onChange={(e) => setForm({ ...form, grading_end: e.target.value || null })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                background: '#0c1e3d', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Save size={15} /> {saving ? 'Saving…' : 'Save Term'}
            </button>
          </div>
        </div>
      )}

      {/* Terms list */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading terms…</div>
      ) : terms.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          No academic terms configured yet. Click "Add Term" to create one.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Academic Year</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Semester</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Enrollment Window</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Grading Window</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#0c1e3d' }}>
                    {t.academic_year}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#334155' }}>
                    {SEMESTER_LABELS[t.semester] || `Semester ${t.semester}`}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontSize: '0.78rem' }}>
                    {t.enrollment_start
                      ? `${new Date(t.enrollment_start).toLocaleDateString()} – ${t.enrollment_end ? new Date(t.enrollment_end).toLocaleDateString() : '—'}`
                      : 'Not set'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontSize: '0.78rem' }}>
                    {t.grading_start
                      ? `${new Date(t.grading_start).toLocaleDateString()} – ${t.grading_end ? new Date(t.grading_end).toLocaleDateString() : '—'}`
                      : 'Not set'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    {t.is_current ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem',
                        fontWeight: 700, background: '#dcfce7', color: '#15803d',
                      }}>
                        <Check size={12} /> CURRENT
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetCurrent(t.id)}
                        style={{
                          padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem',
                          fontWeight: 600, background: '#f1f5f9', color: '#475569',
                          border: '1px solid #e2e8f0', cursor: 'pointer',
                        }}
                      >
                        Set Current
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => startEdit(t)}
                        title="Edit"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0.3rem' }}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.3rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
