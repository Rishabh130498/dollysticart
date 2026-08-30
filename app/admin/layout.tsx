import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ShieldCheck, Tag, Home, ShoppingBag, MessageSquare, ArrowLeft, LayoutGrid } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect('/account?login=true');
  }

  // 1.5 Enforce email verification check for security
  if (!session.user.email_confirmed_at) {
    console.warn(`[SECURITY ALERT] Admin access blocked for unverified session: ${session.user.email}`);
    redirect('/account?login=true');
  }


  // 2. Authorize admin status
  const userEmail = session.user.email?.toLowerCase() || '';
  const isRootAdmin = userEmail === 'rishabhagarwal.me@gmail.com';

  const { data: whitelisted } = await supabase
    .from('admin_whitelist')
    .select('email')
    .ilike('email', userEmail)
    .single();

  const isWhitelisted = isRootAdmin || !!whitelisted;

  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  // Self-heal: If user is in admin_whitelist or root admin, auto-upgrade profile role to admin
  if (isWhitelisted && profile?.role !== 'admin') {
    await supabase
      .from('profiles')
      .upsert({ id: session.user.id, email: session.user.email!, role: 'admin' });
    profile = { role: 'admin' };
  }

  if (!isWhitelisted && profile?.role !== 'admin') {
    // Access denied - redirect to customer storefront
    redirect('/');
  }

  const sidebarLinks = [
    { label: 'Shop', href: '/admin/shop', icon: Tag },
    { label: 'Categories', href: '/admin/categories', icon: LayoutGrid },
    { label: 'Homepage Editor', href: '/admin/homepage', icon: Home },
    { label: 'About Editor', href: '/admin/about', icon: Home },
    { label: 'Customize Editor', href: '/admin/customize-art', icon: Home },
    { label: 'Contact Editor', href: '/admin/contact', icon: Home },
    { label: 'Privacy Editor', href: '/admin/privacy', icon: ShieldCheck },
    { label: 'Terms Editor', href: '/admin/terms', icon: ShieldCheck },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Customer Messages', href: '/admin/messages', icon: MessageSquare },
    { label: 'Admin Settings', href: '/admin/settings', icon: ShieldCheck },
  ];


  return (
    <div className="flex min-h-screen bg-[#060606] text-foreground font-sans">
      
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 border-r border-border-subtle bg-[#0c0c0e] shrink-0 hidden md:flex flex-col">
        {/* Branding header */}
        <div className="h-14 border-b border-border-subtle flex items-center px-6 gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
            ADMIN SYSTEM
          </span>
        </div>

        {/* Links list */}
        <nav className="flex-1 p-6 space-y-2">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 text-xs font-display font-medium uppercase tracking-widest text-foreground/70 hover:text-accent hover:bg-zinc-950 transition-all rounded"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer return link */}
        <div className="p-6 border-t border-border-subtle">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-display font-semibold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            STOREFRONT
          </Link>
        </div>
      </aside>

      {/* Main Admin Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header navigation */}
        <header className="h-14 border-b border-border-subtle bg-[#0c0c0e] md:hidden flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.2em]">ADMIN PORTAL</span>
          </div>
          <Link
            href="/"
            className="font-display text-[8px] uppercase tracking-widest text-accent flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> STORE
          </Link>
        </header>

        {/* Mobile navigation links */}
        <nav className="flex md:hidden bg-[#0c0c0e]/80 border-b border-border-subtle p-2 overflow-x-auto gap-2 shrink-0">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-[8px] font-display font-bold uppercase tracking-widest text-foreground/75 border border-zinc-900 bg-background rounded hover:text-accent shrink-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Dashboard inner panels content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
