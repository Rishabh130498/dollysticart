'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Heart, User, ShoppingBag, Menu, X, ShieldAlert, Globe, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCountry, SUPPORTED_COUNTRIES } from '@/context/CountryContext';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { selectedCountry, selectCountry } = useCountry();
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
                target="_blank"
                rel="noopener noreferrer"
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

            {/* Country, Currency & Language Switcher */}
            <button
              onClick={() => setCountryModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 border border-zinc-800 rounded bg-zinc-950/60 text-foreground/80 hover:text-accent hover:border-accent/40 transition-all font-display text-[9px] font-bold uppercase tracking-wider"
              title="Select Country, Currency & Language"
            >
              <span className="text-xs">{selectedCountry.flag}</span>
              <span className="font-mono">{selectedCountry.currency}</span>
            </button>

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

      {/* Country, Currency & Language Selector Modal Popup */}
      {countryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCountryModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-accent" />
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Select Country & Currency
                </h3>
              </div>
              <button
                onClick={() => setCountryModalOpen(false)}
                className="text-zinc-400 hover:text-foreground transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-4">
              <input
                type="text"
                value={countrySearchQuery}
                onChange={(e) => setCountrySearchQuery(e.target.value)}
                placeholder="Search country, currency or language..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Country List Grid */}
            <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
              {SUPPORTED_COUNTRIES.filter(
                (c) =>
                  c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                  c.currency.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                  c.langName.toLowerCase().includes(countrySearchQuery.toLowerCase())
              ).map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <button
                    key={country.code}
                    onClick={() => {
                      selectCountry(country.code);
                      setCountryModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/10 text-foreground'
                        : 'border-zinc-900 bg-zinc-950/40 text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{country.flag}</span>
                      <div className="flex flex-col">
                        <span className="font-display text-xs font-semibold text-foreground">
                          {country.name}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-500">
                          {country.currency} ({country.symbol}) &bull; {country.langName}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-[9px] font-mono text-zinc-500 text-center">
              Real-time exchange rates & automatic language translation applied instantly.
            </p>
          </div>
        </div>
      )}

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
                  target="_blank"
                  rel="noopener noreferrer"
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
