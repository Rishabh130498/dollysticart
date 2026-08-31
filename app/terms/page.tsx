import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FormattedText from '@/components/common/FormattedText';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Terms of Service | Dollysticart Studio',
  description: 'Terms of Service and Store Policy Agreement at Dollysticart Studio.',
};

const DEFAULT_TERMS_CONTENT = {
  title: 'Terms of Service',
  subtitle: 'Store Agreement & Service Terms',
  last_updated: 'August 30, 2026',
  section_1_title: '1. Overview & General Conditions',
  section_1_body: 'By visiting our website and purchasing textured canvas artwork, art prints, stationery, or custom commissions from Dollysticart Studio, you engage in our service and agree to be bound by the following Terms of Service. These terms apply to all users of the site.',
  section_2_title: '2. Artwork Authenticity & Product Representations',
  section_2_body: 'Each original canvas painting is handcrafted with real heavy-acrylic impasto textures. Due to the handcrafted nature of original palette knife artwork, slight organic variations in knife strokes and depth exist, making every piece unique. Digital photographs attempt to display true color accuracy, but minor variations may occur depending on display lighting and screen settings.',
  section_3_title: '3. Pricing & Billing Integrity',
  section_3_body: 'All product prices are quoted in Indian Rupees (INR) or localized currency equivalents. Total billing amounts are calculated directly on our secure server at checkout using verified catalog pricing to prevent tampering. Orders are processed upon successful payment confirmation.',
  section_4_title: '4. Fulfillment & Shipping Coordinates',
  section_4_body: 'Physical artwork packages are carefully packed with multi-layer protective materials and dispatched via express insured courier services. Tracking details are automatically dispatched to your email address upon shipment.',
  section_5_title: '5. Governed Law & Contact Information',
  section_5_body: 'These Terms of Service shall be governed by and construed in accordance with the laws of India. For any questions regarding terms or order inquiries, reach out to us at letsmaildoly@gmail.com.'
};

export default async function TermsPage() {
  const supabase = await createClient();

  let content = DEFAULT_TERMS_CONTENT;

  try {
    const { data: secData } = await supabase
      .from('homepage_sections')
      .select('published_content')
      .eq('type', 'terms_of_service')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (secData?.published_content && Object.keys(secData.published_content).length > 0) {
      content = { ...DEFAULT_TERMS_CONTENT, ...secData.published_content };
    }
  } catch (e) {
    console.error('Failed to load terms of service from DB, using fallback defaults', e);
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-36 md:pb-24 text-foreground">
      
      {/* Header */}
      <div className="border-b border-border-subtle pb-8 mb-10 space-y-4">
        <Link href="/" className="inline-flex items-center gap-1.5 font-display text-[9px] uppercase tracking-widest text-muted hover:text-accent transition-colors mb-2">
          <ArrowLeft className="h-3 w-3" /> RETURN TO STORE
        </Link>
        
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
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

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_1_title}
          </h2>
          <FormattedText text={content.section_1_body} />
        </div>

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_2_title}
          </h2>
          <FormattedText text={content.section_2_body} />
        </div>

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_3_title}
          </h2>
          <FormattedText text={content.section_3_body} />
        </div>

        <div className="space-y-3 border-b border-zinc-900 pb-6">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_4_title}
          </h2>
          <FormattedText text={content.section_4_body} />
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-foreground">
            {content.section_5_title}
          </h2>
          <FormattedText text={content.section_5_body} />
        </div>

      </div>

    </div>
  );
}
