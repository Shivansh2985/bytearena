'use client';
import { apiFetch } from '@/lib/api';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Zap, Trophy, Users,
  ArrowRight, Check, ChevronRight, Star,
  ShieldAlert, UserPlus, Loader2,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import ToastProvider from '@/components/ui/Toast';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

type AuthMode = 'login' | 'signup';

interface LoginForm { email: string; password: string; }
interface SignupForm { fullName: string; email: string; password: string; confirmPassword: string; agreeTerms: boolean; }

const platformStats = [
  { label: 'Active Users', value: '84,219', icon: Users },
  { label: 'Contests Run', value: '1,847', icon: Trophy },
  { label: 'Problems Solved', value: '2.3M+', icon: Zap },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'SDE @ Google', text: 'ByteArena transformed my prep. Hit Expert rating in 3 months.' },
  { name: 'Arjun Mehta', role: 'CS @ IIT Bombay', text: 'The live contest UI is unreal. Feels like a real competition.' },
];

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
          style={{ top: s.top, left: s.left, width: s.size, height: s.size,
            '--opacity': s.opacity, '--duration': `${s.duration}s`, '--delay': `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function AuthScreen() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  React.useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/user-dashboard');
      }
    }
  }, [session, status, router]);

  const loginForm = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });
  const signupForm = useForm<SignupForm>({ defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', agreeTerms: false } });

  /* ── Google OAuth ── */
  const handleGoogleAuth = async () => {
    try {
      await signIn('google', { callbackUrl: '/user-dashboard' });
    } catch (err: any) {
      toast.error('Google authentication failed');
    }
  };

  /* ── Login ── */
  const onLogin = loginForm.handleSubmit(async (data) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        // Admin redirect logic should be based on session role now, but here we don't have the full session yet synchronously.
        // Wait, the router will handle the redirect if session updates. But we can check role if we fetch it.
        // For simplicity, let's just push to user-dashboard, and the useEffect will bounce them to admin if role is ADMIN.
        toast.success('Login successful!');
        router.push('/user-dashboard');
      }
    } catch (err: any) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  });

  /* ── Signup ── */
  const onSignup = signupForm.handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    if (!data.agreeTerms) {
      toast.error('Please agree to the Terms of Service');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: data.fullName, email: data.email, password: data.password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      toast.success('Account created successfully! Logging you in...');
      
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Auto login failed. Please login manually.');
        setMode('login');
      } else {
        router.push('/user-dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  });

  const loginDisabled = isLoading;
  const signupDisabled = isLoading;

  return (
    <div className="min-h-screen flex bg-galaxy overflow-hidden">
      <ToastProvider />

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-[#0A0515] via-[#050508] to-[#020210] border-r border-border/10">
        <StarField />
        <motion.div animate={{ scale: [1,1.05,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
        <motion.div animate={{ scale:[1,1.1,1], opacity:[0.2,0.4,0.2] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut', delay:2 }}
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/15 blur-[80px] pointer-events-none" />

        <div className="relative z-10 p-10">
          <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} className="flex items-center gap-3">
            <AppLogo size={36} />
            <span className="font-bold text-xl text-foreground tracking-tight">ByteArena</span>
          </motion.div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-12">
          <div className="max-w-md">
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-6">
                <Zap size={12} className="animate-pulse" /> Platform v2.6 — Now with AI Hints
              </div>
              <h1 className="text-4xl xl:text-5xl font-display font-bold text-foreground leading-tight mb-4">
                Compete. <span className="text-gradient-primary">Code.</span><br />Conquer.
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed mb-8">
                Join 84,000+ competitive programmers on the platform built for serious coders.
                Real-time contests, deep analytics, and a battleground that never sleeps.
              </p>
            </motion.div>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="grid grid-cols-3 gap-4 mb-10">
              {platformStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-card-elevated rounded-xl p-4 text-center border border-border hover:border-primary/50 transition-colors">
                    <Icon size={16} className="text-primary mx-auto mb-2" />
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </motion.div>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }} className="space-y-3">
              {testimonials.map((t) => (
                <div key={t.name} className="glass-light rounded-xl p-4 border border-border/50">
                  <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(s => <Star key={s} size={10} className="text-amber-400 fill-amber-400" />)}</div>
                  <p className="text-sm text-foreground/80 italic mb-2">&quot;{t.text}&quot;</p>
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-[500px] xl:w-[560px] flex flex-col justify-center overflow-y-auto bg-background relative">
        <div className="absolute inset-0 bg-galaxy opacity-30 pointer-events-none" />
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-10 relative z-10 max-w-md w-full mx-auto">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <AppLogo size={28} />
            <span className="font-bold text-lg text-foreground">ByteArena</span>
          </div>

          <div className="w-full glass border border-primary/20 rounded-2xl p-6 sm:p-8 shadow-soft relative overflow-hidden">
            {/* decorative lightning */}
            <div className="absolute -top-10 -right-10 text-primary/5 rotate-12 pointer-events-none">
              <Zap size={140} fill="currentColor" />
            </div>

            <div className="text-center mb-6 relative z-10">
              <h2 className="font-display text-2xl font-bold mb-1">
                {mode === 'login' ? 'Welcome back' : 'Join the Arena'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? 'Sign in to access your dashboard.' : 'Create your free account.'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex p-1 bg-muted/50 rounded-xl mb-6 border border-border/50 relative z-10">
                {(['login', 'signup'] as AuthMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>


            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <form onSubmit={onLogin} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1.5">Email</label>
                  <input type="email" placeholder="you@bytearena.dev"
                    className="input-field w-full px-4 py-3 text-sm"
                    {...loginForm.register('email', { required: 'Email is required' })}
                  />
                  {loginForm.formState.errors.email && <p className="mt-1 text-xs text-red-400">{loginForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-foreground">Password</label>
                    <button type="button" className="text-xs text-primary hover:underline">Forgot?</button>
                  </div>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                      className="input-field w-full px-4 py-3 text-sm pr-11"
                      {...loginForm.register('password', { required: 'Password is required' })}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p className="mt-1 text-xs text-red-400">{loginForm.formState.errors.password.message}</p>}
                </div>

                <button type="submit" disabled={loginDisabled}
                  className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                  {loginDisabled ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button type="button" onClick={handleGoogleAuth}
                  className="btn-secondary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 border border-border hover:border-primary/50 transition-all">
                  <GoogleIcon size={18} /> Continue with Google
                </button>
              </form>
            )}

            {/* ── SIGNUP ── */}
            {mode === 'signup' && (
              <form onSubmit={onSignup} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1.5">Full Name</label>
                  <input type="text" placeholder="Alex Coder" className="input-field w-full px-4 py-3 text-sm"
                    {...signupForm.register('fullName', { required: true })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1.5">Email</label>
                  <input type="email" placeholder="alex@college.edu" className="input-field w-full px-4 py-3 text-sm"
                    {...signupForm.register('email', { required: true })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} placeholder="Strong password" className="input-field w-full px-4 py-3 text-sm pr-11"
                      {...signupForm.register('password', { required: true, minLength: { value: 8, message: 'Min 8 characters' } })} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && <p className="mt-1 text-xs text-red-400">{signupForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-foreground mb-1.5">Confirm Password</label>
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" className="input-field w-full px-4 py-3 text-sm"
                    {...signupForm.register('confirmPassword', { required: true })} />
                  {signupForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{signupForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="terms" className="w-4 h-4 rounded border-border accent-primary"
                    {...signupForm.register('agreeTerms')} />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                    I agree to the <span className="text-primary hover:underline">Terms of Service</span>
                  </label>
                </div>

                <button type="submit" disabled={isLoading}
                  className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                  {signupDisabled ? <Loader2 size={18} className="animate-spin" /> : <>Join the Arena <UserPlus size={16} /></>}
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button type="button" onClick={handleGoogleAuth}
                  className="btn-secondary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 border border-border hover:border-primary/50 transition-all">
                  <GoogleIcon size={18} /> Sign up with Google
                </button>
              </form>
            )}


          </div>


            <p className="text-center text-xs text-muted-foreground mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline font-medium">
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
        </div>
      </div>
    </div>
  );
}