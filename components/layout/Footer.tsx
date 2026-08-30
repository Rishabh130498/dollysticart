'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const footerLinks = {
    learn: [
      { label: 'About Dollysticart', href: '/about' },
      { label: 'Bespoke Commissions', href: '/customize-art' },
      { label: 'Studio Contact', href: '/contact' },
    ],
    brand: [
      { label: 'Home Page', href: '/' },
      { label: 'Art Shop', href: '/shop' },
      { label: 'Canvas Collections', href: '/shop/original-art' },
      { label: 'Prints Curation', href: '/shop/art-prints' },
    ],
    policies: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Shipping Coordinate Policies', href: '/about' },
    ],
    follow: [
      { label: 'Instagram Feed', href: 'https://instagram.com' },
      { label: 'Facebook Page', href: 'https://facebook.com' },
      { label: 'Pinterest Boards', href: 'https://pinterest.com' },
    ]
  };

  return (
    <footer className="w-full border-t border-border-subtle bg-background py-16 text-foreground/80 overflow-x-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        
        {/* Footers Column Grid - 5 columns layout */}
        <div className="grid grid-cols-5 gap-4 md:gap-12 items-start min-w-[720px] md:min-w-0">
          
          {/* Column 1: Newsletter */}
          <div className="flex flex-col space-y-4 md:col-span-1">
            <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              NEWSLETTER
            </h4>
            <p className="font-sans text-[10px] leading-relaxed text-muted max-w-[200px]">
              Subscribe to receive updates on new canvas releases, lookbook campaigns, and easel stories.
            </p>
            
            <form onSubmit={handleSubscribe} className="relative flex items-center border-b border-zinc-800 max-w-[200px] py-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={subscribed ? 'SUBSCRIBED' : 'ENTER EMAIL'}
                disabled={subscribed}
                className="w-full bg-transparent font-display text-[9px] tracking-widest uppercase text-foreground placeholder:text-zinc-700 focus:outline-none"
              />
              <button
                type="submit"
                disabled={subscribed}
                className="text-foreground hover:text-accent transition-colors"
                aria-label="Subscribe"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Column 2: Learn */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              LEARN MORE
            </h4>
            <ul className="space-y-3 font-display text-[9px] tracking-widest uppercase">
              {footerLinks.learn.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Dollysticart */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              DOLLYSTICART
            </h4>
            <ul className="space-y-3 font-display text-[9px] tracking-widest uppercase">
              {footerLinks.brand.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Policies */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              POLICIES
            </h4>
            <ul className="space-y-3 font-display text-[9px] tracking-widest uppercase">
              {footerLinks.policies.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Follow */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              FOLLOW US
            </h4>
            <ul className="space-y-3 font-display text-[9px] tracking-widest uppercase">
              {footerLinks.follow.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Lower copyright bar */}
        <div className="mt-16 pt-8 border-t border-zinc-950 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <span className="font-display text-[9px] uppercase tracking-widest text-muted">
            &copy; {currentYear} DOLLYSTICART. ALL RIGHTS RESERVED.
          </span>
          <span className="font-display text-[9px] uppercase tracking-widest text-zinc-800">
            BANGALORE &bull; INDIA
          </span>
        </div>

      </div>
    </footer>
  );
}
