import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Layers,
  Calendar,
  CalendarDays,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';

const NAV_ITEMS = [
  { to: '/registrar/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/registrar/academics', label: 'Academic Overview', icon: GraduationCap },
  { to: '/registrar/academics/terms', label: 'Academic Terms', icon: CalendarDays },
  { to: '/registrar/academics/programs', label: 'Programs & Curricula', icon: BookOpen },
  { to: '/registrar/academics/offerings', label: 'Course Offerings', icon: Layers },
  { to: '/registrar/academics/sections', label: 'Class Sections', icon: Calendar },
];

export default function RegistrarLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          background: '#0c1e3d',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '1.5rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#cda34f', letterSpacing: '-0.02em' }}>
            Pilar Community College
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: 500 }}>
            Registrar Management Portal
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/registrar/academics'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 1.25rem',
                margin: '0.1rem 0.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#cda34f' : '#cbd5e1',
                background: isActive ? 'rgba(205,163,79,0.1)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
              })}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
              {profile?.full_name || 'Registrar'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>
              {profile?.role || 'staff'}
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sign Out"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main style={{ flex: 1, background: '#f8fafc', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
