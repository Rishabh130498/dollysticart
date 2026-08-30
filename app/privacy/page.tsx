import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Dollysticart Studio',
  description: 'Privacy Policy and Data Handling Commitment at Dollysticart Studio.',
};

const DEFAULT_PRIVACY_CONTENT = {
  title: 'Privacy Policy',
  subtitle: 'Data Handling & Security Standard',
  last_updated: 'August 30, 2026',
  section_1_title: '1. Information We Collect',
  section_1_body: 'Dollysticart Studio collects customer information strictly required for order processing, billing calculation, and shipment fulfillment. This includes your name, email address, shipping street address, phone number, and optional landline number. We do not store or process raw credit card or bank details on our servers; all payment transactions are processed through end-to-end PCI-DSS compliant payment gateways (Razorpay).',
  section_2_title: '2. Use of Data',
  section_2_body: 'Your personal data is used solely to execute fulfillment of your orders, generate official PDF invoices, send order status updates (tracking numbers, shipment dispatches), and provide customer support for bespoke art commissions.',
  section_3_title: '3. Data Protection & Confidentiality',
  section_3_body: 'We enforce strict Row Level Security (RLS) policies and encrypted server-side data fetching. We never sell, rent, or trade your personal information to third-party advertisers or data brokers.',
  section_4_title: '4. Cookies & Analytics',
  section_4_body: 'Our platform uses minimal essential cookies to maintain secure authentication sessions and cart state across page visits. You can clear local session storage at any time via your browser settings.',
  section_5_title: '5. Your Rights & Contact',
  section_5_body: 'You have full rights to request access to, correction of, or deletion of your personal data stored in our studio records. For any privacy-related inquiries, contact us directly at letsmaildoly@gmail.com.'
};

export default async function PrivacyPage() {
  const supabase = await createClient();

  let content = DEFAULT_PRIVACY_CONTENT;

  try {
    const { data: secData } = await supabase
      .from('homepage_sections')
      .select('published_content')
      .eq('type', 'privacy_policy')
      .maybeSingle();

    if (secData?.published_content) {
      content = { ...DEFAULT_PRIVACY_CONTENT, ...secData.published_content };
    }
  } catch (e) {
    console.error('Failed to load privacy policy from DB, using fallback defaults', e);
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-36 md:pb-24 text-foreground">
      
      {/* Header */}
      <div className="border-b border-border-subtle pb-8 mb-10 space-y-4">
        <Link href="/" className="inline-flex items-center gap-1.5 font-display text-[9px] uppercase tracking-widest text-muted hover:text-accent transition-colors mb-2">
          <ArrowLeft className="h-3 w-3" /> RETURN TO STORE
        </Link>
        
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            {content.subtitle}
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-wide">
          {content.title}
        </h1>

        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          LAST UPDATED: {content.last_updated}
        </p>
      </div>

      {/* Main Legal Content Sections */}
      <div className="space-y-8 font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed">
        
        <div className="p-4 border border-zinc-800 bg-[#0c0c0e] flex items-start gap-3">
          <Lock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400">
            Dollysticart Studio is committed to protecting your privacy. We calculate checkout totals strictly server-side and process all payments using certified PCI-DSS Compliant gateways.
          </p>
        </div>

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_1_title}
          </h2>
          <p>{content.section_1_body}</p>
        </div>

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_2_title}
          </h2>
          <p>{content.section_2_body}</p>
        </div>

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_3_title}
          </h2>
          <p>{content.section_3_body}</p>
        </div>

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_4_title}
          </h2>
          <p>{content.section_4_body}</p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_5_title}
          </h2>
          <p>{content.section_5_body}</p>
        </div>

      </div>

    </div>
  );
}
