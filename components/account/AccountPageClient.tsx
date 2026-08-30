'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LogIn, LogOut, ShoppingBag, User, Mail, Lock, Shield, Eye, EyeOff, Calendar, DollarSign, ExternalLink, Check, X } from 'lucide-react';

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

export default function AccountPageClient() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // If query string has ?login=true, default tab to login
    if (searchParams?.get('login') === 'true') {
      setActiveTab('login');
    }
  }, [searchParams]);

  // Load User details and Order history
  const loadUserData = async (currentUser: any) => {
    setUser(currentUser);
    if (currentUser) {
      try {
        // 1. Load profile details
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(prof);

        // 2. Load order history
        const { data: ords } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        setOrders(ords || []);
      } catch (e) {
        console.error('Error loading account database details', e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      loadUserData(session?.user || null);
    };

    checkUser();

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      loadUserData(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Refresh count event trigger in case cart elements require merge
      window.dispatchEvent(new Event('cart-updated'));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err: any) {
      setAuthError(err.message || 'Invalid login details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Signup submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError('');

    if (!name) {
      setAuthError('Name is required.');
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify your confirm password field.');
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name
          }
        }
      });
      if (error) throw error;
      
      // Auto toggle state
      setAuthError('Sign up successful! Please check your email inbox to verify your account registration.');
      setActiveTab('login');
    } catch (err: any) {
      setAuthError(err.message || 'Sign up failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'OAuth initiation failed.');
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrders([]);
    router.push('/');
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING DASHBOARD...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10 md:pt-36 md:pb-16">
      
      {/* Dynamic view depending on auth state */}
      {!user ? (
        
        /* ------------------------------------------------------------- */
        /* AUTH SECTION (Login / Signup Forms) */
        /* ------------------------------------------------------------- */
        <div className="w-full max-w-md mx-auto border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 md:p-10 relative overflow-hidden">
          {/* Subtle design box grid lines */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 opacity-5">
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-b border-zinc-800"></div>
            <div className="border-r border-zinc-800"></div>
          </div>

          <div className="relative z-10 space-y-6">
            
            {/* Header Tabs */}
            <div className="flex border-b border-zinc-900 pb-3 justify-center gap-6">
              <button
                onClick={() => { setActiveTab('login'); setAuthError(''); setConfirmPassword(''); }}
                className={`font-display text-xs font-bold uppercase tracking-widest pb-1 transition-colors ${
                  activeTab === 'login' ? 'text-accent border-b border-accent' : 'text-zinc-600 hover:text-zinc-300'
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setAuthError(''); setConfirmPassword(''); }}
                className={`font-display text-xs font-bold uppercase tracking-widest pb-1 transition-colors ${
                  activeTab === 'signup' ? 'text-accent border-b border-accent' : 'text-zinc-600 hover:text-zinc-300'
                }`}
              >
                REGISTER
              </button>
            </div>

            {/* Error notifications */}
            {authError && (
              <div className="p-3 border border-accent/20 bg-accent/5 text-accent font-sans text-xs leading-relaxed">
                {authError}
              </div>
            )}

            {/* Main Email Form */}
            <form onSubmit={activeTab === 'login' ? handleLogin : handleSignup} className="space-y-4">
              
              {/* Optional Name for Signup */}
              {activeTab === 'signup' && (
                <div className="flex flex-col space-y-2">
                  <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                    <User className="h-3 w-3 text-zinc-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col space-y-2">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-zinc-600" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@domain.com"
                  className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-zinc-600" />
                    Password
                  </label>
                  {activeTab === 'signup' && password.length > 0 && (
                    <span className={`flex items-center gap-1 font-sans text-[10px] font-medium transition-colors ${
                      password.length >= 6 ? 'text-emerald-400' : 'text-zinc-500'
                    }`}>
                      <Check className={`h-3 w-3 ${password.length >= 6 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      {password.length >= 6 ? '6+ characters' : 'Min 6 chars'}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full border border-zinc-800 bg-background pl-4 pr-10 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-zinc-500 hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (only for signup) */}
              {activeTab === 'signup' && (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-zinc-600" />
                      Confirm Password
                    </label>
                    {confirmPassword.length > 0 && (
                      password === confirmPassword ? (
                        <span className="flex items-center gap-1 font-sans text-[10px] font-semibold text-emerald-400 animate-in fade-in duration-200">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Passwords match
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-sans text-[10px] font-medium text-rose-400 animate-in fade-in duration-200">
                          <X className="h-3.5 w-3.5 text-rose-400" />
                          Passwords do not match
                        </span>
                      )
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`h-11 w-full border bg-background pl-4 pr-16 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:outline-none transition-all ${
                        confirmPassword.length > 0
                          ? password === confirmPassword
                            ? 'border-emerald-500/60 focus:border-emerald-400 bg-emerald-950/10'
                            : 'border-rose-500/60 focus:border-rose-400 bg-rose-950/10'
                          : 'border-zinc-800 focus:border-accent'
                      }`}
                    />
                    <div className="absolute right-3 flex items-center gap-1.5">
                      {confirmPassword.length > 0 && (
                        password === confirmPassword ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-in zoom-in-50 duration-200" title="Passwords Match">
                            <Check className="h-3 w-3 text-emerald-400 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-in zoom-in-50 duration-200" title="Passwords Do Not Match">
                            <X className="h-3 w-3 text-rose-400 stroke-[3]" />
                          </div>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-zinc-500 hover:text-foreground transition-colors p-1"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit CTA button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300 disabled:opacity-50 mt-6"
              >
                {submitting ? (
                  <span>PROCESSING...</span>
                ) : activeTab === 'login' ? (
                  <>
                    <LogIn className="h-3.5 w-3.5" />
                    SIGN IN TO ACCOUNT
                  </>
                ) : (
                  <>
                    <User className="h-3.5 w-3.5" />
                    CREATE AN ACCOUNT
                  </>
                )}
              </button>
            </form>

            {/* SSO Separator */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-900"></div>
              <span className="flex-shrink mx-4 font-display text-[9px] text-zinc-600 tracking-widest uppercase">OR</span>
              <div className="flex-grow border-t border-zinc-900"></div>
            </div>

            {/* Google OAuth action */}
            <button
              onClick={handleGoogleLogin}
              className="w-full h-11 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest border border-zinc-800 hover:border-zinc-500 hover:text-foreground text-foreground/80 bg-background transition-all duration-300"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              CONTINUE WITH GOOGLE
            </button>

          </div>
        </div>
      ) : (
        
        /* ------------------------------------------------------------- */
        /* AUTHENTICATED CUSTOMER DASHBOARD */
        /* ------------------------------------------------------------- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left panel: Profile specs and sign out */}
          <div className="lg:col-span-4 border border-border-subtle bg-[#0c0c0e] p-6 space-y-6">
            <div className="border-b border-border-subtle pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent text-black font-display text-md font-bold flex items-center justify-center uppercase select-none">
                {profile?.name?.substring(0, 2) || user.email.substring(0, 2)}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground truncate">
                  {profile?.name || 'Customer Account'}
                </h2>
                <span className="font-sans text-[11px] text-muted truncate block">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-muted">Account ID</span>
                <span className="text-foreground font-mono text-[10px]">{user.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-muted">Registered Role</span>
                <span className="text-accent uppercase tracking-widest text-[9px] font-semibold flex items-center gap-1">
                  <Shield className="h-3 w-3 text-accent" />
                  {profile?.role || 'customer'}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-muted">Verification Status</span>
                <span className="text-green-500 uppercase tracking-widest text-[9px] font-semibold">Verified</span>
              </div>
            </div>

            {/* Admin Portal Button */}
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest border border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-black transition-all duration-300"
              >
                <Shield className="h-3.5 w-3.5" />
                OPEN ADMIN PANEL
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}

            {/* Logout trigger */}
            <button
              onClick={handleSignOut}
              className="w-full h-11 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest border border-zinc-800 text-foreground/75 hover:text-accent hover:border-accent bg-transparent transition-all duration-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              SIGN OUT OF SESSION
            </button>
          </div>

          {/* Right panel: Order histories */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="font-display text-md font-bold uppercase tracking-widest text-foreground/50 border-b border-border-subtle pb-4">
              My Orders ({orders.length})
            </h2>

            {orders.length === 0 ? (
              /* Empty orders list */
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-900 rounded-lg text-center px-4">
                <ShoppingBag className="h-10 w-10 text-zinc-800 mb-3" />
                <span className="font-display text-xs tracking-widest text-zinc-500 uppercase">No orders placed yet</span>
                <p className="font-sans text-[11px] text-zinc-600 mt-2 max-w-xs leading-relaxed">
                  You haven&rsquo;t finalized any checkout payments under this email address. Run standard orders to update records.
                </p>
                <Link 
                  href="/shop" 
                  className="mt-6 border border-zinc-800 hover:border-accent px-5 py-2 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                >
                  VISIT SHOP
                </Link>
              </div>
            ) : (
              /* Orders table view */
              <div className="border border-border-subtle bg-[#0c0c0e] divide-y divide-border-subtle">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    
                    {/* Main order info columns */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500">Order ID:</span>
                        <span className="font-mono text-xs text-foreground font-semibold uppercase">{order.id.substring(0, 8)}...</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-sans text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-700" />
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-zinc-700" />
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Fulfillments status tags & detailed confirmation redirect */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex gap-2">
                        {/* Payment tag */}
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                          order.payment_status === 'paid'
                            ? 'border-green-500/20 bg-green-500/5 text-green-500'
                            : 'border-amber-500/20 bg-amber-500/5 text-amber-500'
                        }`}>
                          {order.payment_status}
                        </span>
                        
                        {/* Fulfillment tag */}
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                          order.status === 'completed' || order.status === 'shipped'
                            ? 'border-green-500/20 bg-green-500/5 text-green-500'
                            : 'border-zinc-800 bg-background text-muted'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="h-8 border border-zinc-800 hover:border-accent px-3 py-1 flex items-center gap-1.5 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                      >
                        VIEW INVOICE
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
