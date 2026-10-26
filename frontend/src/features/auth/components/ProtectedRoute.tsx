import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'student' | 'instructor' | 'registrar' | 'admin' | 'system_admin'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0c1e3d',
        color: '#cda34f',
        fontSize: '1.2rem',
        fontWeight: 600,
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading Pilar Community College Portal…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile || profile.account_status !== 'active') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: '#f8fafc',
        color: '#1e293b',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1 style={{ color: '#0c1e3d', marginBottom: '0.5rem' }}>Account Inactive or Pending Activation</h1>
        <p style={{ maxWidth: '500px', color: '#64748b' }}>
          Your profile is currently awaiting Registrar verification. Please contact the Pilar Community College Registrar's Office.
        </p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: '#f8fafc',
        color: '#1e293b',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Access Restricted</h1>
        <p style={{ maxWidth: '500px', color: '#64748b', marginBottom: '1.5rem' }}>
          You do not have institutional authorization to access this portal section.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.65rem 1.5rem',
            background: '#0c1e3d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Return to Authorized Portal
        </button>
      </div>
    );
  }

  return <>{children}</>;
}