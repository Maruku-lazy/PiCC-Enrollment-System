import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, CalendarDays, Layers, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { academicService, type AcademicProgram, type AcademicTerm } from '../../academics/services/academicService';

export default function RegistrarDashboardPage() {
  const { profile } = useAuth();
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [activeTerm, setActiveTerm] = useState<AcademicTerm | null>(null);
  const [termsCount, setTermsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicService.getPrograms(),
      academicService.getActiveTerm(),
      academicService.getTerms(),
    ])
      .then(([progData, termData, allTerms]) => {
        setPrograms(progData);
        setActiveTerm(termData);
        setTermsCount(allTerms.length);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const cards = [
    {
      icon: CalendarDays,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      label: 'ACADEMIC TERMS',
      value: `${termsCount} Term${termsCount !== 1 ? 's' : ''}`,
      link: '/registrar/academics/terms',
      linkLabel: 'Manage Terms',
    },
    {
      icon: GraduationCap,
      iconBg: '#fef8eb',
      iconColor: '#cda34f',
      label: 'DEGREE PROGRAMS',
      value: `${programs.length} Program${programs.length !== 1 ? 's' : ''}`,
      link: '/registrar/academics/programs',
      linkLabel: 'Manage Programs',
    },
    {
      icon: Layers,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      label: 'COURSE OFFERINGS',
      value: activeTerm ? `${activeTerm.academic_year}` : 'No Active Term',
      link: '/registrar/academics/offerings',
      linkLabel: 'View Offerings',
    },
    {
      icon: Calendar,
      iconBg: '#f8fafc',
      iconColor: '#0c1e3d',
      label: 'CLASS SECTIONS',
      value: 'Schedule Manager',
      link: '/registrar/academics/sections',
      linkLabel: 'Configure Sections',
    },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#0c1e3d', margin: 0, fontSize: '1.85rem' }}>
          Welcome, {profile?.full_name || 'Registrar'}
        </h1>
        <p style={{ color: '#64748b', margin: '0.4rem 0 0' }}>
          {activeTerm
            ? `Current Term: ${activeTerm.academic_year} (Semester ${activeTerm.semester})`
            : 'No active academic term configured'}
        </p>
      </header>

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading dashboard…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.65rem', background: card.iconBg, borderRadius: '10px', color: card.iconColor }}>
                  <card.icon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c1e3d' }}>{card.value}</div>
                </div>
              </div>
              <Link
                to={card.link}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#0c1e3d',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                {card.linkLabel} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
