import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, X, Save, Clock, Users, UserPlus, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  academicService,
  type AcademicTerm,
  type ClassSection,
  type CourseOffering,
  type SectionSchedule,
  type InstructorAssignment,
} from '../services/academicService';
import { validateScheduleSlot, type ScheduleSlot } from '../services/scheduleValidation';
import SectionCapacityBadge from '../components/SectionCapacityBadge';
import ScheduleConflictAlert from '../components/ScheduleConflictAlert';

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export default function ClassSectionsPage() {
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [activeTerm, setActiveTerm] = useState<AcademicTerm | null>(null);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create section form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSectionOfferingId, setNewSectionOfferingId] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionCapacity, setNewSectionCapacity] = useState(40);
  const [creating, setCreating] = useState(false);

  // Expanded section (for schedules & instructors)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<SectionSchedule[]>([]);
  const [assignments, setAssignments] = useState<InstructorAssignment[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [allSchedulesForTerm, setAllSchedulesForTerm] = useState<(SectionSchedule & { section_name: string })[]>([]);

  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedDay, setSchedDay] = useState<DayOfWeek>('Mon');
  const [schedStart, setSchedStart] = useState('08:00');
  const [schedEnd, setSchedEnd] = useState('09:30');
  const [schedRoom, setSchedRoom] = useState('');
  const [schedConflict, setSchedConflict] = useState<string | null>(null);
  const [addingSched, setAddingSched] = useState(false);

  // Instructor assignment
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [assigningInstructor, setAssigningInstructor] = useState(false);

  // Load terms
  useEffect(() => {
    academicService.getTerms().then((data) => {
      setTerms(data);
      const current = data.find((t) => t.is_current);
      if (current) { setSelectedTermId(current.id); setActiveTerm(current); }
      else if (data.length > 0) { setSelectedTermId(data[0].id); setActiveTerm(data[0]); }
    });
  }, []);

  // Load sections & offerings when term changes
  const loadData = useCallback(async () => {
    if (!selectedTermId) return;
    setIsLoading(true);
    try {
      const [secs, offs] = await Promise.all([
        academicService.getClassSections(selectedTermId),
        academicService.getCourseOfferings(selectedTermId),
      ]);
      setSections(secs);
      setOfferings(offs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTermId]);

  useEffect(() => {
    const run = async () => { await loadData(); };
    void run();
  }, [loadData]);

  // Load expanded section details
  async function loadSectionDetails(sectionId: string) {
    try {
      const [scheds, assigns, instrs] = await Promise.all([
        academicService.getSectionSchedules(sectionId),
        academicService.getInstructorAssignments(sectionId),
        academicService.getInstructors(),
      ]);
      setSchedules(scheds);
      setAssignments(assigns);
      setInstructors(instrs);

      // Load all schedules for conflict detection
      if (selectedTermId) {
        try {
          const allScheds = await academicService.getAllSchedulesForTerm(selectedTermId);
          setAllSchedulesForTerm(allScheds);
        } catch {
          // Non-critical, conflict checking will be degraded
          setAllSchedulesForTerm([]);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function toggleExpand(sectionId: string) {
    if (expandedId === sectionId) {
      setExpandedId(null);
    } else {
      setExpandedId(sectionId);
      loadSectionDetails(sectionId);
    }
  }

  // Create section
  async function handleCreateSection() {
    if (!newSectionOfferingId || !newSectionName.trim()) {
      setError('Please select an offering and enter a section name.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await academicService.createClassSection({
        offering_id: newSectionOfferingId,
        section_name: newSectionName.trim(),
        max_capacity: newSectionCapacity,
      });
      setShowCreateForm(false);
      setNewSectionName('');
      setNewSectionCapacity(40);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  // Delete section
  async function handleDeleteSection(id: string) {
    if (!window.confirm('Delete this section? This will also remove its schedules.')) return;
    try {
      await academicService.deleteClassSection(id);
      if (expandedId === id) setExpandedId(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Add schedule
  async function handleAddSchedule() {
    if (!expandedId || !schedRoom.trim()) {
      setError('Room is required.');
      return;
    }

    // Validate for conflicts
    const newSlot: ScheduleSlot = {
      day_of_week: schedDay,
      start_time: schedStart,
      end_time: schedEnd,
      room: schedRoom.trim(),
      section_name: sections.find((s) => s.id === expandedId)?.section_name,
    };

    const existingSlots: ScheduleSlot[] = allSchedulesForTerm
      .filter((s) => s.section_id !== expandedId)
      .map((s) => ({
        day_of_week: s.day_of_week as ScheduleSlot['day_of_week'],
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
        section_name: s.section_name,
      }));

    const conflict = validateScheduleSlot(existingSlots, newSlot);
    if (conflict.hasConflict) {
      setSchedConflict(conflict.message || 'Schedule conflict detected.');
      return;
    }

    setAddingSched(true);
    setError(null);
    setSchedConflict(null);
    try {
      await academicService.createSchedule({
        section_id: expandedId,
        day_of_week: schedDay,
        start_time: schedStart,
        end_time: schedEnd,
        room: schedRoom.trim(),
      });
      setShowScheduleForm(false);
      setSchedRoom('');
      await loadSectionDetails(expandedId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingSched(false);
    }
  }

  async function handleDeleteSchedule(schedId: string) {
    if (!expandedId) return;
    try {
      await academicService.deleteSchedule(schedId);
      await loadSectionDetails(expandedId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Assign instructor
  async function handleAssignInstructor() {
    if (!expandedId || !selectedInstructorId) return;
    setAssigningInstructor(true);
    setError(null);
    try {
      await academicService.assignInstructor(expandedId, selectedInstructorId);
      setShowAssignForm(false);
      setSelectedInstructorId('');
      await loadSectionDetails(expandedId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAssigningInstructor(false);
    }
  }

  async function handleRemoveAssignment(assignId: string) {
    if (!expandedId) return;
    try {
      await academicService.removeInstructorAssignment(assignId);
      await loadSectionDetails(expandedId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1',
    fontSize: '0.82rem', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: '#0c1e3d', margin: 0, fontSize: '1.85rem' }}>Class Sections & Schedules</h1>
          <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
            Create sections, assign schedules and instructors for {activeTerm ? activeTerm.academic_year : 'the current term'}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedTermId}
            onChange={(e) => {
              setSelectedTermId(e.target.value);
              setActiveTerm(terms.find((t) => t.id === e.target.value) || null);
              setExpandedId(null);
            }}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, color: '#0c1e3d', background: '#fff' }}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.academic_year} – Sem {t.semester} {t.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', background: '#0c1e3d', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Section
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', color: '#be123c', fontSize: '0.82rem', marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#be123c' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Create section form */}
      {showCreateForm && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#0c1e3d', fontSize: '1rem' }}>Create New Section</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.75fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>Course Offering *</label>
              <select value={newSectionOfferingId} onChange={(e) => setNewSectionOfferingId(e.target.value)} style={inputStyle}>
                <option value="">Select offering…</option>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>{o.course_code} – {o.course_title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>Section Name *</label>
              <input style={inputStyle} placeholder="e.g. BSCRIM 1-A" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem', display: 'block' }}>Capacity</label>
              <input type="number" style={inputStyle} value={newSectionCapacity} min={1} max={100} onChange={(e) => setNewSectionCapacity(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button onClick={() => setShowCreateForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreateSection} disabled={creating} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#0c1e3d', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', opacity: creating ? 0.6 : 1 }}>
              <Save size={15} /> {creating ? 'Creating…' : 'Create Section'}
            </button>
          </div>
        </div>
      )}

      {/* Sections list */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading sections…</div>
      ) : sections.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          No class sections for this term yet. Add course offerings first, then create sections.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sections.map((s) => (
            <div key={s.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {/* Section row */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', cursor: 'pointer' }}
                onClick={() => toggleExpand(s.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0c1e3d', fontSize: '0.9rem' }}>{s.section_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.course_code} – {s.course_title || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <SectionCapacityBadge current={s.current_enrolled} max={s.max_capacity} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSection(s.id); }}
                    title="Delete section"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.3rem' }}
                  >
                    <Trash2 size={15} />
                  </button>
                  {expandedId === s.id ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === s.id && (
                <div style={{ borderTop: '1px solid #e2e8f0', padding: '1.25rem', background: '#fafbfc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Schedules column */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, color: '#0c1e3d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={15} /> Schedules
                        </h4>
                        <button
                          onClick={() => { setShowScheduleForm(!showScheduleForm); setSchedConflict(null); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>

                      {schedConflict && <ScheduleConflictAlert message={schedConflict} />}

                      {showScheduleForm && (
                        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>Day</label>
                              <select value={schedDay} onChange={(e) => setSchedDay(e.target.value as DayOfWeek)} style={{ ...inputStyle, fontSize: '0.78rem' }}>
                                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>Start</label>
                              <input type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)} style={{ ...inputStyle, fontSize: '0.78rem' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>End</label>
                              <input type="time" value={schedEnd} onChange={(e) => setSchedEnd(e.target.value)} style={{ ...inputStyle, fontSize: '0.78rem' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569' }}>Room</label>
                              <input value={schedRoom} onChange={(e) => setSchedRoom(e.target.value)} placeholder="e.g. Room 201" style={{ ...inputStyle, fontSize: '0.78rem' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowScheduleForm(false); setSchedConflict(null); }} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.72rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleAddSchedule} disabled={addingSched} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: '#0c1e3d', color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', opacity: addingSched ? 0.6 : 1 }}>
                              {addingSched ? 'Adding…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}

                      {schedules.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No schedules assigned yet.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {schedules.map((sched) => (
                            <div key={sched.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                              <span style={{ fontWeight: 600, color: '#0c1e3d' }}>
                                {sched.day_of_week} {sched.start_time}–{sched.end_time}
                              </span>
                              <span style={{ color: '#64748b' }}>{sched.room}</span>
                              <button onClick={() => handleDeleteSchedule(sched.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.15rem' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Instructors column */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, color: '#0c1e3d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Users size={15} /> Assigned Instructors
                        </h4>
                        <button
                          onClick={() => setShowAssignForm(!showAssignForm)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          <UserPlus size={12} /> Assign
                        </button>
                      </div>

                      {showAssignForm && (
                        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.75rem', marginBottom: '0.75rem' }}>
                          <select value={selectedInstructorId} onChange={(e) => setSelectedInstructorId(e.target.value)} style={{ ...inputStyle, marginBottom: '0.5rem' }}>
                            <option value="">Select instructor…</option>
                            {instructors
                              .filter((inst) => !assignments.some((a) => a.instructor_id === inst.id))
                              .map((inst) => (
                                <option key={inst.id} value={inst.id}>{inst.full_name} ({inst.email})</option>
                              ))}
                          </select>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAssignForm(false)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.72rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleAssignInstructor} disabled={assigningInstructor || !selectedInstructorId} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: '#0c1e3d', color: '#fff', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', opacity: assigningInstructor || !selectedInstructorId ? 0.6 : 1 }}>
                              {assigningInstructor ? 'Assigning…' : 'Assign'}
                            </button>
                          </div>
                        </div>
                      )}

                      {assignments.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No instructors assigned yet.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {assignments.map((a) => (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                              <div>
                                <span style={{ fontWeight: 600, color: '#0c1e3d' }}>{a.instructor_name || 'Unknown'}</span>
                                <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>{a.instructor_email || ''}</span>
                              </div>
                              <button onClick={() => handleRemoveAssignment(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.15rem' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
