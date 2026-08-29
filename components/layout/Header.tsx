'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Heart, User, ShoppingBag, Menu, X, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setSearchOpen(false);
    setIsOpen(false);
  }, [pathname]);


  useEffect(() => {
    // 1. Scroll listener for transparent-to-solid transition
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    // 2. Get current session
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    
    getSession();

    // 3. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });


    // 4. Load Cart & Wishlist counts
    const updateCounts = () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem('dollysticart_cart') || '[]');
        const count = storedCart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        setCartCount(count);

        const storedWishlist = JSON.parse(localStorage.getItem('dollysticart_wishlist') || '[]');
        setWishlistCount(storedWishlist.length);
      } catch (e) {
        console.error('Error reading localStorage count', e);
      }
    };

    updateCounts();
    
    window.addEventListener('cart-updated', updateCounts);
    window.addEventListener('wishlist-updated', updateCounts);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
      window.removeEventListener('cart-updated', updateCounts);
      window.removeEventListener('wishlist-updated', updateCounts);
    };
  }, [supabase]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Customize Art', href: '/customize-art' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  // Determine header classes based on active route and scroll state
  const isHomepage = pathname === '/';
  
  let headerClasses = 'fixed top-0 z-50 w-full h-[74px] transition-all duration-300 ';
  
  if (isHomepage) {
    if (scrolled) {
      headerClasses += 'bg-[#060606]/95 border-b border-border-subtle backdrop-blur-md';
    } else {
      headerClasses += 'bg-transparent border-b border-transparent';
    }
  } else {
    headerClasses += 'bg-[#060606]/95 border-b border-border-subtle backdrop-blur-md';
  }

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header className={headerClasses}>
        <div className="w-full h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* 1. LEFT SLOT: Desktop Navigation Menu / Mobile Drawer Trigger */}
          <div className="flex flex-1 items-center">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden hover:text-accent focus:outline-none"
              aria-label="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Left Nav Links */}
            <nav className="hidden md:flex space-x-6 lg:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-display text-[11px] font-bold uppercase tracking-[0.25em] transition-colors duration-300 hover:text-accent ${
                    pathname === link.href ? 'text-accent' : 'text-foreground/75'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 2. CENTER SLOT: Centered Logo Branding */}
          <div className="flex justify-center shrink-0">
            <Link 
              href="/" 
              className="font-display text-base font-extrabold tracking-[0.3em] text-foreground hover:opacity-85 transition-opacity"
            >
              DOLLYSTICART
            </Link>
          </div>

          {/* 3. RIGHT SLOT: Action Menus */}
          <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
            
            {/* Admin Portal link */}
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1 border border-accent/20 bg-accent/5 px-2.5 py-1 font-display text-[8px] font-bold uppercase tracking-widest text-accent hover:bg-accent hover:text-black transition-all"
              >
                <ShieldAlert className="h-3 w-3" />
                ADMIN
              </Link>
            )}

            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex h-9 w-9 items-center justify-center text-foreground/75 hover:text-accent transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Account Settings */}
            <Link
              href={user ? '/account' : '/account?login=true'}
              onClick={() => setSearchOpen(false)}
              className="flex h-9 w-9 items-center justify-center text-foreground/75 hover:text-accent transition-colors"
              aria-label="Account"
            >
              <User className="h-4 w-4" />
            </Link>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              onClick={() => setSearchOpen(false)}
              className="relative flex h-9 w-9 items-center justify-center text-foreground/75 hover:text-accent transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-black">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Cart Bag */}
            <Link
              href="/cart"
              onClick={() => setSearchOpen(false)}
              className="relative flex h-9 w-9 items-center justify-center text-foreground/75 hover:text-accent transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </Link>

          </div>
        </div>

        {/* Dynamic Slide-Down Search Overlay */}
        {searchOpen && (
          <div className="border-b border-border-subtle bg-[#060606]/95 backdrop-blur-md px-6 py-4 shadow-lg transition-all">
            <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto flex items-center justify-between">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search art pieces, canvases, collections..."
                className="w-full bg-transparent font-display text-xs tracking-widest uppercase text-foreground placeholder:text-muted focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="ml-4 text-foreground/60 hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-overlay backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative flex w-full max-w-xs flex-col border-r border-border-subtle bg-[#0c0c0e] p-6 shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-900">
              <span className="font-display text-sm font-extrabold tracking-widest text-foreground">DOLLYSTICART</span>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-foreground hover:text-accent"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 flex flex-col space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`font-display text-xs font-bold uppercase tracking-[0.2em] transition-colors ${
                    pathname === link.href ? 'text-accent' : 'text-foreground/80'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 border-t border-zinc-900 pt-6 font-display text-xs font-bold uppercase tracking-[0.2em] text-accent"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
