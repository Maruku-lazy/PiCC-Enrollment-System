import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  MapPin,
  UserRound,
} from 'lucide-react';
import { supabase, setRememberMePreference } from '../../../lib/supabase';
import './LoginPage.css';

type LoginMode = 'student' | 'staff';

type ProfileForLogin = {
  role: string;
  account_status: 'pending' | 'active' | 'suspended';
};

const STAFF_ROLES = new Set(['registrar', 'admin', 'staff', 'system_admin']);

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return typeof window !== 'undefined' &&
      window.localStorage.getItem('pcc_auth_remember_me') === 'true';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  function changeMode(nextMode: LoginMode) {
    setMode(nextMode);
    setErrorMessage('');
    setNoticeMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setNoticeMessage('');

    const normalizedIdentifier = identifier.trim().toLowerCase();
    if (!normalizedIdentifier || !password) {
      setErrorMessage('Enter your email address and password to continue.');
      return;
    }

    // Supabase password authentication uses email. Do not expose a public
    // student-ID-to-email lookup: it can reveal which students have accounts.
    // Enable ID-based sign-in only after a trusted, rate-limited auth flow is designed.
    if (!normalizedIdentifier.includes('@')) {
      setErrorMessage(
        'Student ID sign-in is not configured yet. For now, use the email address registered with the school.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // The preference is read by the custom auth storage adapter in supabase.ts.
      setRememberMePreference(rememberMe);

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedIdentifier,
          password,
        });

      if (authError || !authData.user) {
        setErrorMessage(
          'Sign-in failed. Check your credentials or contact the school administrator.',
        );
        return;
      }

      // Roles and account activation status come from the database, never from
      // the selected tab or values supplied by the browser.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, account_status')
        .eq('id', authData.user.id)
        .maybeSingle();
      const profile = profileData as ProfileForLogin | null;

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setErrorMessage(
          'Your account profile is not ready. Please contact the school administrator.',
        );
        return;
      }

      if (profile.account_status !== 'active') {
        await supabase.auth.signOut();
        setErrorMessage(
          'Your account is pending activation or is currently unavailable. Please contact the school administrator.',
        );
        return;
      }

      const role = profile.role.trim().toLowerCase();
      const isStudent = role === 'student';
      const isStaff = STAFF_ROLES.has(role);

      if (!isStudent && !isStaff) {
        await supabase.auth.signOut();
        setErrorMessage(
          'Your account does not have an enabled portal role. Please contact the school administrator.',
        );
        return;
      }

      // The tab is only a user-interface choice. This check prevents a confusing
      // portal mismatch; RLS must still enforce all data permissions.
      if ((mode === 'student' && !isStudent) || (mode === 'staff' && !isStaff)) {
        await supabase.auth.signOut();
        setErrorMessage(
          mode === 'student'
            ? 'This account is not registered for the Student / Applicant portal. Select Admin / Staff instead.'
            : 'This account is not registered for the Admin / Staff portal. Select Student / Applicant instead.',
        );
        return;
      }

      navigate(isStudent ? '/student/dashboard' : '/registrar/dashboard', {
        replace: true,
      });
    } catch {
      setErrorMessage(
        'We could not complete sign-in. Check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMessage('');
    setNoticeMessage('');
    const email = identifier.trim().toLowerCase();

    if (!email.includes('@')) {
      setErrorMessage(
        'Enter your registered email address first to request a password reset.',
      );
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMessage(
          'We could not send the reset request. Please try again later or contact the school administrator.',
        );
        return;
      }

      // Keep the response generic to avoid revealing whether an email is registered.
      setNoticeMessage(
        'If an account exists for that email, password reset instructions will be sent.',
      );
    } catch {
      setErrorMessage('Password reset is temporarily unavailable. Please try again later.');
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Pilar Community College login">
        <aside className="login-hero">
          <div className="hero-diagonal" aria-hidden="true" />
          <div className="hero-dot-pattern" aria-hidden="true" />

          <div className="hero-brand">
            <div className="hero-brand-mark" aria-hidden="true">
              <GraduationCap size={31} strokeWidth={2.4} />
            </div>
            <div className="hero-brand-name">
              <span>PILAR</span>
              <span>COMMUNITY</span>
              <span>COLLEGE</span>
            </div>
          </div>

          <p className="hero-tagline">
            ONLINE <strong>ENROLLMENT</strong> SYSTEM
          </p>

          <div className="photo-collage" role="img" aria-label="College life photo collage">
            <div className="collage-tile collage-tile--study">
              <div className="collage-photo" />
            </div>
            <div className="collage-tile collage-tile--graduation">
              <div className="collage-photo" />
            </div>
            <div className="collage-tile collage-tile--students">
              <div className="collage-photo" />
            </div>
            <div className="collage-tile collage-tile--classroom">
              <div className="collage-photo" />
            </div>
          </div>

          <section className="announcement-card" aria-labelledby="announcement-title">
            <h2 id="announcement-title">System Announcements &amp; Deadlines</h2>
            <div className="announcement-rule" />
            <p>
              <strong>Current Enrollment:</strong> 1st Semester A.Y. 2026-2027
            </p>
            <p>
              <strong>Application Deadline:</strong> Enroll early to secure your slots!
            </p>
          </section>

          <footer className="hero-footer">
            <span>
              <MapPin size={15} fill="currentColor" aria-hidden="true" />
              Pilar, Sorsogon
            </span>
            <a href="mailto:pica2018.pilar@gmail.com">
              <Mail size={15} fill="currentColor" aria-hidden="true" />
              pica2018.pilar@gmail.com
            </a>
          </footer>
        </aside>

        <section className="login-panel">
          <div className="login-content">
            <div className="panel-brand">
              <span className="panel-brand-mark" aria-hidden="true">
                <GraduationCap size={19} strokeWidth={2.5} />
              </span>
              <span>PILAR COMMUNITY COLLEGE</span>
            </div>

            <header className="login-heading">
              <h1>
                Welcome back, <span>PICCian!</span>
              </h1>
              <p>Please enter your details to sign in or access your portal.</p>
            </header>

            <div className="login-mode-switch" role="group" aria-label="Choose portal">
              <button
                type="button"
                className={mode === 'student' ? 'mode-button is-active' : 'mode-button'}
                aria-pressed={mode === 'student'}
                onClick={() => changeMode('student')}
              >
                Student / Applicant
              </button>
              <button
                type="button"
                className={mode === 'staff' ? 'mode-button is-active' : 'mode-button'}
                aria-pressed={mode === 'staff'}
                onClick={() => changeMode('staff')}
              >
                Admin / Staff
              </button>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <label htmlFor="login-identifier">
                  {mode === 'student' ? 'Student ID or Email Address' : 'Staff Email Address'}
                </label>
                <div className="input-wrap">
                  <UserRound size={18} aria-hidden="true" />
                  <input
                    id="login-identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder={
                      mode === 'student'
                        ? 'e.g., 2024-01234 or your email address'
                        : 'Enter your official staff email'
                    }
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="login-password">Password</label>
                <div className="input-wrap">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>Remember me</span>
                </label>
                <div className="recovery-links">
                  <button
                    type="button"
                    className="text-link"
                    onClick={handleForgotPassword}
                    disabled={isSendingReset || isSubmitting}
                  >
                    {isSendingReset ? 'Sending reset link…' : 'Forgot Password?'}
                  </button>
                  <a
                    className="text-link text-link--small"
                    href="mailto:pica2018.pilar@gmail.com?subject=Forgot%20Student%20ID"
                  >
                    Forgot Student ID?
                  </a>
                </div>
              </div>

              {errorMessage && (
                <p className="form-message form-message--error" role="alert">
                  {errorMessage}
                </p>
              )}
              {noticeMessage && (
                <p className="form-message form-message--success" role="status">
                  {noticeMessage}
                </p>
              )}

              <button className="sign-in-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In…' : 'Sign In'}
              </button>
            </form>

            <div className="new-student-divider">
              <span />
              <p>New Student?</p>
              <span />
            </div>

            <Link className="register-cta" to="/register">
              <span>FIRST TIME ENROLLING?</span>
              <strong>Click here to Apply / Pre-Register</strong>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
