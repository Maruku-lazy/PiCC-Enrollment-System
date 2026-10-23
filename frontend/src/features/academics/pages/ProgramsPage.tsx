import { useEffect, useState } from 'react';
import { academicService, type AcademicProgram, type CurriculumCourse } from '../services/academicService';
import CurriculumCourseTable from '../components/CurriculumCourseTable';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<AcademicProgram | null>(null);
  const [courses, setCourses] = useState<CurriculumCourse[]>([]);

  useEffect(() => {
    academicService.getPrograms().then((data) => {
      setPrograms(data);
      if (data.length > 0) setSelectedProgram(data[0]);
    });
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      academicService.getCurriculumVersions(selectedProgram.id).then((versions) => {
        if (versions.length > 0) {
          academicService.getCurriculumCourses(versions[0].id).then(setCourses);
        } else {
          setCourses([]);
        }
      });
    }
  }, [selectedProgram]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#0c1e3d', marginBottom: '0.5rem' }}>Degree Programs &amp; Curriculum Prospectus</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Official curriculum tracks under Pilar Community College administration.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {programs.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProgram(p)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: selectedProgram?.id === p.id ? '2px solid #0c1e3d' : '1px solid #cbd5e1',
              backgroundColor: selectedProgram?.id === p.id ? '#0c1e3d' : '#ffffff',
              color: selectedProgram?.id === p.id ? '#ffffff' : '#1e293b',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {p.code}
          </button>
        ))}
      </div>

      {selectedProgram && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#0c1e3d', margin: 0 }}>{selectedProgram.name}</h2>
          {selectedProgram.major && (
            <div style={{ color: '#cda34f', fontWeight: 600, marginTop: '0.25rem' }}>
              Major: {selectedProgram.major}
            </div>
          )}
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Department: {selectedProgram.department}
          </div>
        </div>
      )}

      {courses.length > 0 ? (
        <CurriculumCourseTable courses={courses} />
      ) : (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          No curriculum subjects registered yet for this program version.
        </div>
      )}
    </div>
  );
}