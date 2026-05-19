'use client';
import React, { useState } from 'react';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Zap, Trophy, Users,
  ArrowRight, Copy, Check, Shield, User,
  ChevronRight, Star,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import ToastProvider from '@/components/ui/Toast';
import Icon from '@/components/ui/AppIcon';

// GitHub SVG icon (inline, since lucide-react v1.x removed Github export)
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

type AuthMode = 'login' | 'signup';
type Role = 'student' | 'admin';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignupForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const mockCredentials = {
  student: { email: 'rahul.kumar@bytearena.dev', password: 'Student@2026' },
  admin: { email: 'admin@bytearena.dev', password: 'Admin@2026' },
};

const platformStats = [
  { label: 'Active Users', value: '84,219', icon: Users },
  { label: 'Contests Run', value: '1,847', icon: Trophy },
  { label: 'Problems Solved', value: '2.3M+', icon: Zap },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'SDE @ Google', text: 'ByteArena transformed my prep. Hit Expert rating in 3 months.' },
  { name: 'Arjun Mehta', role: 'CS @ IIT Bombay', text: 'The live contest UI is unreal. Feels like a real competition.' },
];

// Star field component
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: `star-${i}`,
    top: `${(i * 37 + 11) % 100}%`,
    left: `${(i * 53 + 7) % 100}%`,
    opacity: 0.1 + (i % 5) * 0.1,
    duration: 2 + (i % 4),
    delay: (i % 6) * 0.5,
    size: i % 3 === 0 ? 3 : 2,
  }));

  return (
    <div className="star-field">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--opacity': s.opacity,
            '--duration': `${s.duration}s`,
            '--delay': `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Credential copy row
function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xs font-mono text-foreground truncate">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginForm>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const signupForm = useForm<SignupForm>({
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', agreeTerms: false },
  });

  // Fill demo credentials
  const fillDemo = (r: Role) => {
    const creds = mockCredentials[r];
    loginForm.setValue('email', creds.email);
    loginForm.setValue('password', creds.password);
    setRole(r);
    toast.success(`Demo credentials filled for ${r}`);
  };

  const handleLogin = loginForm.handleSubmit(async (data) => {
    setIsLoading(true);
    // BACKEND: POST /api/auth/login { email, password, role }
    await new Promise((r) => setTimeout(r, 1200));

    const validStudent = data.email === mockCredentials.student.email && data.password === mockCredentials.student.password;
    const validAdmin = data.email === mockCredentials.admin.email && data.password === mockCredentials.admin.password;

    if (!validStudent && !validAdmin) {
      loginForm.setError('email', {
        message: 'Invalid credentials — use the demo accounts below to sign in',
      });
      setIsLoading(false);
      return;
    }

    toast.success('Welcome back to ByteArena!');
    setIsLoading(false);
    // BACKEND: redirect based on role from JWT
    if (validAdmin) {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/user-dashboard';
    }
  });

  const handleSignup = signupForm.handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    if (!data.agreeTerms) {
      signupForm.setError('agreeTerms', { message: 'You must agree to the terms' });
      return;
    }
    setIsLoading(true);
    // BACKEND: POST /api/auth/register { fullName, email, password, role }
    await new Promise((r) => setTimeout(r, 1400));
    toast.success('Account created! Welcome to ByteArena.');
    setIsLoading(false);
    setMode('login');
  });

  return (
    <div className="min-h-screen flex bg-galaxy overflow-hidden">
      <ToastProvider />

      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-[#0A0515] via-[#050508] to-[#020210]">
        <StarField />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <AppLogo size={36} />
            <span className="font-bold text-xl text-foreground tracking-tight">ByteArena</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-12">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-sky-300 font-medium mb-6">
              <Zap size={11} />
              Platform v2.6 — Now with AI Hints
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-4">
              Compete.{' '}
              <span className="text-gradient-primary">Code.</span>{' '}
              Conquer.
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              Join 84,000+ competitive programmers on the platform built for serious coders.
              Real-time contests, deep analytics, and a battleground that never sleeps.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {platformStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={`stat-${stat.label}`} className="bg-card-elevated rounded-xl p-4 text-center">
                    <Icon size={16} className="text-primary mx-auto mb-2" />
                    <p className="text-xl font-bold text-foreground metric-value">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Testimonials */}
            <div className="space-y-3">
              {testimonials.map((t) => (
                <div key={`testimonial-${t.name}`} className="glass-light rounded-xl p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={`star-t-${t.name}-${s}`} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 italic mb-2">"{t.text}"</p>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom divider glow */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col overflow-y-auto bg-background/95">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <AppLogo size={28} />
            <span className="font-bold text-lg text-foreground">ByteArena</span>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-xl p-1 bg-muted border border-border mb-8">
            {(['login', 'signup'] as AuthMode[]).map((m) => (
              <button
                key={`mode-${m}`}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            {(['student', 'admin'] as Role[]).map((r) => {
              const Icon = r === 'student' ? User : Shield;
              return (
                <button
                  key={`role-${r}`}
                  onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    role === r
                      ? r === 'admin' ?'border-amber-500/50 bg-amber-500/10 text-amber-300' :'border-primary/50 bg-primary/10 text-sky-300' :'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }`}
                >
                  <Icon size={15} />
                  {r === 'student' ? 'Student' : 'Admin'}
                </button>
              );
            })}
          </div>

          {mode === 'login' ? (
            /* ===== LOGIN FORM ===== */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@bytearena.dev"
                  className="input-field w-full px-4 py-2.5 text-sm"
                  {...loginForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Enter a valid email' },
                  })}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <button type="button" className="text-xs text-primary hover:text-sky-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="input-field w-full px-4 py-2.5 text-sm pr-11"
                    {...loginForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs text-danger">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-input accent-primary"
                  {...loginForm.register('rememberMe')}
                />
                <label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                style={{ minHeight: '48px' }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to ByteArena
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Social */}
              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                className="btn-secondary w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                onClick={() => toast.info('GitHub OAuth coming soon')}
              >
                <GithubIcon size={16} />
                Continue with GitHub
              </button>

              {/* Demo credentials */}
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-sky-300 mb-3 flex items-center gap-1.5">
                  <Zap size={11} />
                  Demo Accounts — Click to autofill
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(['student', 'admin'] as Role[]).map((r) => (
                    <button
                      key={`demo-btn-${r}`}
                      type="button"
                      onClick={() => fillDemo(r)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all duration-150 flex items-center justify-center gap-1.5 ${
                        r === 'admin' ?'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' :'border-primary/30 bg-primary/10 text-sky-300 hover:bg-primary/20'
                      }`}
                    >
                      {r === 'admin' ? <Shield size={10} /> : <User size={10} />}
                      Use {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <CredentialRow label="Student Email" value={mockCredentials.student.email} />
                  <CredentialRow label="Admin Email" value={mockCredentials.admin.email} />
                  <CredentialRow label="Password (both)" value="[Role]@2026" />
                </div>
              </div>
            </form>
          ) : (
            /* ===== SIGNUP FORM ===== */
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-foreground mb-1.5">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Rahul Kumar"
                  className="input-field w-full px-4 py-2.5 text-sm"
                  {...signupForm.register('fullName', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name too short' },
                  })}
                />
                {signupForm.formState.errors.fullName && (
                  <p className="mt-1.5 text-xs text-danger">{signupForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@college.edu"
                  className="input-field w-full px-4 py-2.5 text-sm"
                  {...signupForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Enter a valid email' },
                  })}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs text-danger">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">Min 8 characters, one uppercase, one number</p>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className="input-field w-full px-4 py-2.5 text-sm pr-11"
                    {...signupForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                      pattern: {
                        value: /(?=.*[A-Z])(?=.*[0-9])/,
                        message: 'Must include uppercase and number',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs text-danger">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-medium text-foreground mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className="input-field w-full px-4 py-2.5 text-sm pr-11"
                    {...signupForm.register('confirmPassword', { required: 'Please confirm your password' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-danger">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="agree-terms"
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-border bg-input accent-primary"
                  {...signupForm.register('agreeTerms')}
                />
                <label htmlFor="agree-terms" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                  I agree to the{' '}
                  <span className="text-primary hover:text-sky-300 cursor-pointer transition-colors">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-primary hover:text-sky-300 cursor-pointer transition-colors">Privacy Policy</span>
                </label>
              </div>
              {signupForm.formState.errors.agreeTerms && (
                <p className="text-xs text-danger">{signupForm.formState.errors.agreeTerms.message}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                style={{ minHeight: '48px' }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                className="btn-secondary w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                onClick={() => toast.info('GitHub OAuth coming soon')}
              >
                <GithubIcon size={16} />
                Sign up with GitHub
              </button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:text-sky-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}