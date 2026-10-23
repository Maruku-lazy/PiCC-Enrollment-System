import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import {
  academicService,
  type AcademicTerm,
  type AcademicProgram,
  type CurriculumVersion,
  type CurriculumCourse,
  type CourseOffering,
} from '../services/academicService';

export default function CourseOfferingsPage() {
  const [activeTerm, setActiveTerm] = useState<AcademicTerm | null>(null);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [courses, setCourses] = useState<CurriculumCourse[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    Promise.all([academicService.getTerms(), academicService.getPrograms()])
      .then(([termsData, progsData]) => {
        setTerms(termsData);
        setPrograms(progsData);
        const current = termsData.find((t) => t.is_current);
        if (current) {
          setSelectedTermId(current.id);
          setActiveTerm(current);
        } else if (termsData.length > 0) {
          setSelectedTermId(termsData[0].id);
          setActiveTerm(termsData[0]);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Load offerings when term changes
  const loadOfferings = useCallback(async () => {
    if (!selectedTermId) return;
    setIsLoading(true);
    try {
      const data = await academicService.getCourseOfferings(selectedTermId);
      setOfferings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTermId]);

  useEffect(() => {
    loadOfferings().catch(() => { /* surfaced via setError inside loadOfferings() */ });
  }, [loadOfferings]);

  // Load versions when program changes
  useEffect(() => {
    if (!selectedProgramId) {
      Promise.resolve().then(() => {
        setVersions([]);
        setCourses([]);
      });
      return;
    }
    academicService.getCurriculumVersions(selectedProgramId).then((v) => {
      setVersions(v);
      const active = v.find((ver) => ver.is_active);
      if (active) setSelectedVersionId(active.id);
      else if (v.length > 0) setSelectedVersionId(v[0].id);
      else {
        setSelectedVersionId('');
        setCourses([]);
      }
    });
  }, [selectedProgramId]);

  // Load courses when version changes
  useEffect(() => {
    if (!selectedVersionId) {
      Promise.resolve().then(() => setCourses([]));
      return;
    }
    academicService.getCurriculumCourses(selectedVersionId).then(setCourses);
  }, [selectedVersionId]);

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }

  async function handleAddOfferings() {
    if (selectedCourseIds.length === 0) return;
    setAdding(true);
    setError(null);
    try {
      // Filter out courses that already have offerings in this term
      const existingCourseIds = new Set(offerings.map((o) => o.course_id));
      const newCourseIds = selectedCourseIds.filter((id) => !existingCourseIds.has(id));

      for (const courseId of newCourseIds) {
        await academicService.createCourseOffering({ term_id: selectedTermId, course_id: courseId });
      }

      setSelectedCourseIds([]);
      setShowAddPanel(false);
      await loadOfferings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveOffering(id: string) {
    if (!window.confirm('Remove this course offering? Sections under it may be affected.')) return;
    try {
      await academicService.deleteCourseOffering(id);
      await loadOfferings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Group offerings by year_level + semester for display
  const grouped = offerings.reduce<Record<string, CourseOffering[]>>((acc, o) => {
    const key = `Year ${o.year_level || '?'} – Sem ${o.semester || '?'}`;
    (acc[key] = acc[key] || []).push(o);
    return acc;
  }, {});

  const termLabel = activeTerm
    ? `${activeTerm.academic_year} (Semester ${activeTerm.semester})`
    : 'No term selected';

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#0c1e3d', margin: 0, fontSize: '1.85rem' }}>Course Offerings</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
            Activate curriculum courses for enrollment during a given term.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedTermId}
            onChange={(e) => {
              setSelectedTermId(e.target.value);
              setActiveTerm(terms.find((t) => t.id === e.target.value) || null);
            }}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1',
              fontSize: '0.82rem', fontWeight: 600, color: '#0c1e3d', background: '#fff',
            }}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.academic_year} – Sem {t.semester} {t.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', background: '#0c1e3d', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Courses
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', color: '#be123c', fontSize: '0.82rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Add courses panel */}
      {showAddPanel && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#0c1e3d', fontSize: '1rem' }}>
            Add Curriculum Courses to {termLabel}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>
                Program
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%' }}
              >
                <option value="">Select a program…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} – {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>
                Curriculum Version
              </label>
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                disabled={versions.length === 0}
                style={{ padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%' }}
              >
                {versions.length === 0 && <option value="">No versions</option>}
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>{v.version_name} {v.is_active ? '(Active)' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {courses.length > 0 && (
            <>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.length === courses.length && courses.length > 0}
                          onChange={() => {
                            if (selectedCourseIds.length === courses.length) setSelectedCourseIds([]);
                            else setSelectedCourseIds(courses.map((c) => c.id));
                          }}
                        />
                      </th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Code</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Title</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Yr/Sem</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => {
                      const alreadyOffered = offerings.some((o) => o.course_id === c.id);
                      return (
                        <tr
                          key={c.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            opacity: alreadyOffered ? 0.4 : 1,
                            background: selectedCourseIds.includes(c.id) ? '#eff6ff' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input
                              type="checkbox"
                              checked={selectedCourseIds.includes(c.id)}
                              disabled={alreadyOffered}
                              onChange={() => toggleCourse(c.id)}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: '#0c1e3d' }}>{c.course_code}</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#334155' }}>{c.course_title}</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>Y{c.year_level}/S{c.semester}</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{c.credit_units}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  onClick={() => { setShowAddPanel(false); setSelectedCourseIds([]); }}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOfferings}
                  disabled={adding || selectedCourseIds.length === 0}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
                    background: '#0c1e3d', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                    opacity: adding || selectedCourseIds.length === 0 ? 0.6 : 1,
                  }}
                >
                  <Layers size={15} /> {adding ? 'Adding…' : `Add ${selectedCourseIds.length} Course(s)`}
                </button>
              </div>
            </>
          )}
          {selectedProgramId && courses.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              No courses in this curriculum version.
            </div>
          )}
        </div>
      )}

      {/* Offerings list */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading offerings…</div>
      ) : offerings.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          No course offerings for this term yet. Use "Add Courses" to activate curriculum courses.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).sort().map(([group, items]) => (
            <div key={group} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.85rem', color: '#0c1e3d' }}>
                {group}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.78rem' }}>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left' }}>Course Code</th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left' }}>Descriptive Title</th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left' }}>Units</th>
                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#0c1e3d' }}>{o.course_code || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>{o.course_title || 'N/A'}</td>
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>{o.credit_units ?? '—'}</td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemoveOffering(o.id)}
                          title="Remove offering"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.3rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
