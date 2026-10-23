import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LockKeyhole, Mail, UserRound, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'student',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user) {
        setSuccessMessage('Registration successful! Redirecting to sign in…');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch {
      setErrorMessage('A connection error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <div className="register-header">
          <Link to="/login" className="back-link">
            <ArrowLeft size={18} />
            Back to Sign In
          </Link>
          <div className="brand-badge">
            <GraduationCap size={28} className="badge-icon" />
            <span className="badge-text">Pilar Community College</span>
          </div>
          <h1>Student Pre-Registration</h1>
          <p>Create your applicant account to begin or continue online enrollment.</p>
        </div>

        <form className="register-form" onSubmit={handleRegister} noValidate>
          <div className="form-field">
            <label htmlFor="full-name">Full Name (Last, First, Middle)</label>
            <div className="input-wrap">
              <UserRound size={18} aria-hidden="true" />
              <input
                id="full-name"
                type="text"
                placeholder="e.g. Dela Cruz, Juan Santos"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="reg-email">Official / Personal Email Address</label>
            <div className="input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="reg-password">Password (minimum 8 characters)</label>
            <div className="input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="reg-password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="reg-confirm-password">Confirm Password</label>
            <div className="input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="reg-confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {errorMessage && (
            <p className="form-message form-message--error" role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="form-message form-message--success" role="status">
              {successMessage}
            </p>
          )}

          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account…' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </main>
  );
}