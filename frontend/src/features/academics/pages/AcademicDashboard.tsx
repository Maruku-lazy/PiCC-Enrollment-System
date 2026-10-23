import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Layers, Calendar, ArrowRight } from 'lucide-react';
import { academicService, type AcademicProgram, type AcademicTerm } from '../services/academicService';

export default function AcademicDashboard() {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [activeTerm, setActiveTerm] = useState<AcademicTerm | null>(null);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicService.getPrograms(),
      academicService.getActiveTerm(),
    ])
      .then(([progData, termData]) => {
        setPrograms(progData);
        setActiveTerm(termData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#0c1e3d', margin: 0, fontSize: '1.85rem' }}>Academic Management</h1>
        <p style={{ color: '#64748b', margin: '0.4rem 0 0' }}>
          Current Term: {activeTerm ? `${activeTerm.academic_year} (Semester ${activeTerm.semester})` : 'No Active Term Configured'}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.65rem', background: '#fef8eb', borderRadius: '10px', color: '#cda34f' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ACADEMIC TRACKS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c1e3d' }}>{programs.length} Programs</div>
            </div>
          </div>
          <Link to="/registrar/academics/programs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0c1e3d', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
            Manage Programs &amp; Curricula <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.65rem', background: '#f0fdf4', borderRadius: '10px', color: '#16a34a' }}>
              <Layers size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>COURSE OFFERINGS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c1e3d' }}>Active Term</div>
            </div>
          </div>
          <Link to="/registrar/academics/offerings" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0c1e3d', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
            View &amp; Assign Offerings <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.65rem', background: '#f8fafc', borderRadius: '10px', color: '#0c1e3d' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>CLASS SECTIONS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c1e3d' }}>Schedule Manager</div>
            </div>
          </div>
          <Link to="/registrar/academics/sections" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0c1e3d', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
            Configure Sections &amp; Timetables <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}