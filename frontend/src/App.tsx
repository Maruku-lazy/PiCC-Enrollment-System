import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

// Registrar layout & pages
import RegistrarLayout from './components/layout/RegistrarLayout';
import RegistrarDashboardPage from './features/registrar/dashboard/RegistrarDashboardPage';
import AcademicDashboard from './features/academics/pages/AcademicDashboard';
import AcademicTermsPage from './features/academics/pages/AcademicTermsPage';
import ProgramsPage from './features/academics/pages/ProgramsPage';
import CourseOfferingsPage from './features/academics/pages/CourseOfferingsPage';
import ClassSectionsPage from './features/academics/pages/ClassSectionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Portal Protected Routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Student Enrollment Portal</h2>
                  <p>Welcome to the PiCC Student Dashboard. Enrollment forms will load here.</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Registrar Portal Protected Routes */}
          <Route
            path="/registrar"
            element={
              <ProtectedRoute allowedRoles={['registrar', 'admin', 'system_admin']}>
                <RegistrarLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/registrar/dashboard" replace />} />
            <Route path="dashboard" element={<RegistrarDashboardPage />} />
            <Route path="academics" element={<AcademicDashboard />} />
            <Route path="academics/terms" element={<AcademicTermsPage />} />
            <Route path="academics/programs" element={<ProgramsPage />} />
            <Route path="academics/offerings" element={<CourseOfferingsPage />} />
            <Route path="academics/sections" element={<ClassSectionsPage />} />
          </Route>

          {/* Instructor Portal Protected Routes */}
          <Route
            path="/instructor/*"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin', 'system_admin']}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h2>Instructor Electronic Grading Portal</h2>
                  <p>Welcome to the PiCC Electronic Grading Dashboard.</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
