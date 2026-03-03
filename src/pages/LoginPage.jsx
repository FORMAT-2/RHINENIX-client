import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiPhone,
  FiArrowLeft,
  FiLoader,
  FiShield,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

/* ─── Constants ─────────────────────────────────────────────────── */
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

/* ─── Helpers ───────────────────────────────────────────────────── */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

function maskPhone(phone) {
  if (phone.length <= 4) return phone;
  return '•'.repeat(phone.length - 4) + phone.slice(-4);
}

/* ─── OTP Input Component ───────────────────────────────────────── */
function OtpInput({ value, onChange, disabled, hasError }) {
  const inputRefs = useRef([]);

  const focusInput = (idx) => inputRefs.current[idx]?.focus();

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[idx] = char;
    onChange(next);
    if (char && idx < OTP_LENGTH - 1) focusInput(idx + 1);
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (!value[idx] && idx > 0) {
        const next = [...value];
        next[idx - 1] = '';
        onChange(next);
        focusInput(idx - 1);
      } else {
        const next = [...value];
        next[idx] = '';
        onChange(next);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusInput(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      focusInput(idx + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={idx === 0 ? handlePaste : undefined}
          className={`
            h-12 w-12 rounded-lg border-2 bg-white text-center text-xl font-semibold
            outline-none transition-all duration-150
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
            disabled:bg-gray-100 disabled:opacity-60
            ${hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-300'}
          `}
        />
      ))}
    </div>
  );
}

/* ─── Resend Timer Hook ─────────────────────────────────────────── */
function useResendTimer() {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setRemaining(RESEND_COOLDOWN);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { remaining, start, canResend: remaining === 0 };
}

/* ─── Step Wrapper (transition) ─────────────────────────────────── */
function StepWrapper({ visible, children }) {
  return (
    <div
      className={`
        transition-all duration-300 ease-in-out
        ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none absolute translate-y-4 opacity-0'}
      `}
    >
      {children}
    </div>
  );
}

/* ─── Spinner ───────────────────────────────────────────────────── */
function Spinner({ className = 'h-5 w-5' }) {
  return <FiLoader className={`animate-spin ${className}`} />;
}

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || '/';

  /* ── User flow state ───────────────────────────────────────────── */
  const [step, setStep] = useState(1);                      // 1 = target, 2 = otp
  const [mode, setMode] = useState('email');                 // 'email' | 'phone'
  const [target, setTarget] = useState('');                  // email or phone value
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [fullName, setFullName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  /* ── Loading / error state ─────────────────────────────────────── */
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [otpError, setOtpError] = useState('');

  /* ── Admin mode ────────────────────────────────────────────────── */
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const timer = useResendTimer();
  const targetInputRef = useRef(null);

  /* Focus the target input on mount / step change */
  useEffect(() => {
    if (step === 1) targetInputRef.current?.focus();
  }, [step, mode]);

  /* ── Validation ────────────────────────────────────────────────── */
  function validateTarget() {
    if (mode === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.trim())) {
        setFieldError('Please enter a valid email address');
        return false;
      }
    } else {
      const digits = target.replace(/\D/g, '');
      if (digits.length < 10) {
        setFieldError('Please enter a valid phone number');
        return false;
      }
    }
    setFieldError('');
    return true;
  }

  /* ── API: Request OTP ──────────────────────────────────────────── */
  async function handleSendOtp(e) {
    e?.preventDefault();
    if (!validateTarget()) return;

    setSendingOtp(true);
    setFieldError('');
    try {
      const payload = mode === 'email'
        ? { email: target.trim(), purpose: 'login' }
        : { phone: target.trim(), purpose: 'login' };

      const { data } = await api.post('/auth/request-otp', payload);

      setIsNewUser(!!data.isNewUser);
      setStep(2);
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      timer.start();
      toast.success(`OTP sent to ${mode === 'email' ? maskEmail(target.trim()) : maskPhone(target.trim())}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setFieldError(msg);
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  }

  /* ── API: Verify OTP ───────────────────────────────────────────── */
  const handleVerifyOtp = useCallback(
    async (otpDigits) => {
      const code = (otpDigits || otp).join('');
      if (code.length !== OTP_LENGTH) return;

      if (isNewUser && !fullName.trim()) {
        setOtpError('Please enter your full name');
        return;
      }

      setVerifying(true);
      setOtpError('');
      try {
        const payload = {
          target: target.trim(),
          otp: code,
          purpose: 'login',
          ...(isNewUser && fullName.trim() ? { fullName: fullName.trim() } : {}),
        };

        const { data } = await api.post('/auth/verify-otp', payload);

        login(data.data.user, data.data.tokens);
        toast.success('Welcome to RHINENIX!');
        navigate(from, { replace: true });
      } catch (err) {
        const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
        setOtpError(msg);
        toast.error(msg);
        setOtp(Array(OTP_LENGTH).fill(''));
      } finally {
        setVerifying(false);
      }
    },
    [otp, target, isNewUser, fullName, login, navigate, from],
  );

  /* Auto-submit when all digits are entered */
  function handleOtpChange(nextOtp) {
    setOtp(nextOtp);
    setOtpError('');
    if (nextOtp.every((d) => d !== '')) {
      // Small delay so the user sees the last digit appear
      setTimeout(() => handleVerifyOtp(nextOtp), 150);
    }
  }

  /* ── API: Admin Login ──────────────────────────────────────────── */
  async function handleAdminLogin(e) {
    e.preventDefault();
    if (!adminUser.trim() || !adminPass) {
      setAdminError('Both fields are required');
      return;
    }

    setAdminLoading(true);
    setAdminError('');
    try {
      const { data } = await api.post('/auth/admin-login', {
        username: adminUser.trim(),
        password: adminPass,
      });

      login(data.data.user, data.data.tokens);
      toast.success('Admin login successful');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      setAdminError(msg);
      toast.error(msg);
    } finally {
      setAdminLoading(false);
    }
  }

  /* ── Go back to step 1 ────────────────────────────────────────── */
  function handleBack() {
    setStep(1);
    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    setFullName('');
  }

  /* ── Derived ───────────────────────────────────────────────────── */
  const maskedTarget = mode === 'email' ? maskEmail(target.trim()) : maskPhone(target.trim());

  /* ═════════════════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`
        flex min-h-screen items-center justify-center px-4 py-8 transition-colors duration-500
        ${showAdmin ? 'bg-gray-900' : 'bg-gray-50 md:bg-gray-100'}
      `}
    >
      <div
        className={`
          relative w-full max-w-md overflow-hidden transition-all duration-500
          ${showAdmin
            ? 'rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-2xl sm:p-8'
            : 'bg-white p-6 md:rounded-2xl md:border md:border-gray-200 md:p-8 md:shadow-lg'
          }
        `}
      >
        {/* ─── Customer Flow ───────────────────────────────────────── */}
        {!showAdmin && (
          <>
            {/* Logo */}
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-primary-600 sm:text-4xl">
                RHINENIX
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {step === 1 ? 'Login or create an account' : 'Verify your identity'}
              </p>
            </div>

            {/* ── Step 1: Enter Email / Phone ────────────────────────── */}
            <StepWrapper visible={step === 1}>
              <form onSubmit={handleSendOtp} className="space-y-5">
                {/* Mode toggle pills */}
                <div className="flex rounded-lg bg-gray-100 p-1">
                  {[
                    { key: 'email', label: 'Email', Icon: FiMail },
                    { key: 'phone', label: 'Phone', Icon: FiPhone },
                  ].map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setMode(key); setTarget(''); setFieldError(''); }}
                      className={`
                        flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium
                        transition-all duration-200
                        ${mode === key
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div>
                  <label htmlFor="login-target" className="sr-only">
                    {mode === 'email' ? 'Email address' : 'Phone number'}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      {mode === 'email' ? <FiMail className="h-5 w-5" /> : <FiPhone className="h-5 w-5" />}
                    </div>
                    <input
                      ref={targetInputRef}
                      id="login-target"
                      type={mode === 'email' ? 'email' : 'tel'}
                      inputMode={mode === 'email' ? 'email' : 'tel'}
                      autoComplete={mode === 'email' ? 'email' : 'tel'}
                      placeholder={mode === 'email' ? 'you@example.com' : '+91 98765 43210'}
                      value={target}
                      onChange={(e) => { setTarget(e.target.value); setFieldError(''); }}
                      className={`
                        w-full rounded-lg border-2 bg-white py-3 pl-10 pr-4 text-gray-900
                        placeholder:text-gray-400 outline-none transition-all duration-150
                        focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
                        ${fieldError ? 'border-red-400' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  {fieldError && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldError}</p>
                  )}
                </div>

                {/* Send OTP button */}
                <button
                  type="submit"
                  disabled={sendingOtp || !target.trim()}
                  className="
                    flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3
                    font-semibold text-white transition-all duration-200
                    hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  {sendingOtp ? (
                    <>
                      <Spinner /> Sending…
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            </StepWrapper>

            {/* ── Step 2: Enter OTP ──────────────────────────────────── */}
            <StepWrapper visible={step === 2}>
              <div className="space-y-5">
                {/* Back button + info */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-primary-600"
                >
                  <FiArrowLeft className="h-4 w-4" /> Change {mode}
                </button>

                <p className="text-center text-sm text-gray-600">
                  OTP sent to{' '}
                  <span className="font-medium text-gray-900">{maskedTarget}</span>
                </p>

                {/* OTP boxes */}
                <OtpInput
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={verifying}
                  hasError={!!otpError}
                />
                {otpError && (
                  <p className="text-center text-sm text-red-500">{otpError}</p>
                )}

                {/* Timer / Resend */}
                <div className="text-center text-sm">
                  {timer.canResend ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="font-medium text-primary-600 transition hover:text-primary-700 hover:underline"
                    >
                      {sendingOtp ? 'Sending…' : 'Resend OTP'}
                    </button>
                  ) : (
                    <span className="text-gray-400">
                      Resend OTP in <span className="font-medium text-gray-600">{timer.remaining}s</span>
                    </span>
                  )}
                </div>

                {/* Full Name (new user) */}
                {isNewUser && (
                  <div className="animate-in fade-in">
                    <label htmlFor="full-name" className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <FiUser className="h-5 w-5" />
                      </div>
                      <input
                        id="full-name"
                        type="text"
                        autoComplete="name"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setOtpError(''); }}
                        className="
                          w-full rounded-lg border-2 border-gray-300 bg-white py-3 pl-10 pr-4
                          text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150
                          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
                        "
                      />
                    </div>
                  </div>
                )}

                {/* Verify button */}
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={verifying || otp.join('').length !== OTP_LENGTH || (isNewUser && !fullName.trim())}
                  className="
                    flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3
                    font-semibold text-white transition-all duration-200
                    hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  {verifying ? (
                    <>
                      <Spinner /> Verifying…
                    </>
                  ) : (
                    <>
                      <FiShield className="h-5 w-5" /> Verify
                    </>
                  )}
                </button>
              </div>
            </StepWrapper>

            {/* Admin link */}
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => { setShowAdmin(true); setAdminError(''); }}
                className="text-xs text-gray-400 transition hover:text-gray-600 hover:underline"
              >
                Admin? Login here
              </button>
            </div>
          </>
        )}

        {/* ─── Admin Login ─────────────────────────────────────────── */}
        {showAdmin && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
                <FiShield className="h-6 w-6 text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Admin Login</h2>
              <p className="mt-1 text-sm text-gray-400">RHINENIX Administration</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="admin-user" className="mb-1 block text-sm font-medium text-gray-300">
                  Username
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FiUser className="h-5 w-5" />
                  </div>
                  <input
                    id="admin-user"
                    type="text"
                    autoComplete="username"
                    placeholder="admin"
                    value={adminUser}
                    onChange={(e) => { setAdminUser(e.target.value); setAdminError(''); }}
                    className={`
                      w-full rounded-lg border-2 bg-gray-700 py-3 pl-10 pr-4 text-white
                      placeholder:text-gray-500 outline-none transition-all duration-150
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
                      ${adminError ? 'border-red-500' : 'border-gray-600'}
                    `}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-pass" className="mb-1 block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <FiLock className="h-5 w-5" />
                  </div>
                  <input
                    id="admin-pass"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={adminPass}
                    onChange={(e) => { setAdminPass(e.target.value); setAdminError(''); }}
                    className={`
                      w-full rounded-lg border-2 bg-gray-700 py-3 pl-10 pr-12 text-white
                      placeholder:text-gray-500 outline-none transition-all duration-150
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
                      ${adminError ? 'border-red-500' : 'border-gray-600'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showPass ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {adminError && (
                <p className="text-center text-sm text-red-400">{adminError}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={adminLoading || !adminUser.trim() || !adminPass}
                className="
                  flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3
                  font-semibold text-white transition-all duration-200
                  hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {adminLoading ? (
                  <>
                    <Spinner /> Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Back to customer login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAdmin(false)}
                className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
              >
                <FiArrowLeft className="h-4 w-4" /> Back to customer login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
