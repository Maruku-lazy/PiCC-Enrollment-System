import type { CurriculumCourse } from '../services/academicService';

interface CurriculumCourseTableProps {
  courses: CurriculumCourse[];
}

export default function CurriculumCourseTable({ courses }: CurriculumCourseTableProps) {
  const semesters = [
    { year: 1, sem: 1, label: 'First Year - First Semester' },
    { year: 1, sem: 2, label: 'First Year - Second Semester' },
    { year: 2, sem: 1, label: 'Second Year - First Semester' },
    { year: 2, sem: 2, label: 'Second Year - Second Semester' },
    { year: 3, sem: 1, label: 'Third Year - First Semester' },
    { year: 3, sem: 2, label: 'Third Year - Second Semester' },
    { year: 4, sem: 1, label: 'Fourth Year - First Semester' },
    { year: 4, sem: 2, label: 'Fourth Year - Second Semester' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {semesters.map((term) => {
        const termCourses = courses.filter(
          (c) => c.year_level === term.year && c.semester === term.sem
        );
        if (termCourses.length === 0) return null;

        const totalUnits = termCourses.reduce((sum, c) => sum + Number(c.credit_units), 0);

        return (
          <div
            key={`${term.year}-${term.sem}`}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#0c1e3d',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <span>{term.label}</span>
              <span style={{ color: '#cda34f' }}>Total Units: {totalUnits}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.78rem' }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Course Code</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Descriptive Title</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Lec</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Lab</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Units</th>
                </tr>
              </thead>
              <tbody>
                {termCourses.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#0c1e3d' }}>
                      {c.course_code}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>{c.course_title}</td>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>{c.lecture_units}</td>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b' }}>{c.lab_units}</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#0c1e3d' }}>
                      {c.credit_units}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}