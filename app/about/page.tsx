import React from 'react';
import { createClient } from '@/lib/supabase/server';
import FormattedText from '@/components/common/FormattedText';

export const dynamic = 'force-dynamic';

const DEFAULT_ABOUT_CONTENT = {
  hero_subtitle: "Editorial Story",
  hero_title: "Dollysticart Studio",
  hero_description: "An independent art lab dedicated to crafting premium, textured impasto canvas paintings and custom aesthetic artifacts.",
  origin_subtitle: "Origin",
  origin_title: "Bespoke Textures & Impasto Work",
  origin_body_1: "Dollysticart was founded with a single mission: to create tangible, physical depth in art. In a world increasingly saturated with digital flat screens, our work focuses on the tactile weight of acrylic paints. Using professional-grade canvas boards and palette knives, every piece features intentional shadows that shift organically depending on the lighting in your home.",
  origin_body_2: "What started as experimental palette knife studies on mini canvas panels has grown into an international studio catalog of prints, desk accents, and large-scale textured commissions.",
  origin_image_url: "",
  process_subtitle: "Process",
  process_title: "The Archival Philosophy",
  process_body_1: "We believe that fine art is an investment meant to endure. Our original canvas collections are protected using UV-resistant, non-yellowing artist varnishes that preserve the vibrant fluorescent accents and deep titanium pigments.",
  process_body_2: "For our art prints and calendars, we use 310gsm museum-grade cotton rag acid-free papers. This guarantees that your desk setup, calendar accents, or bedroom prints maintain their high-contrast, premium resolution colors without fading for up to a century.",
  process_image_url: "",
  timeline_title: "Studio Timeline",
  timeline_phase_1_num: "01 /",
  timeline_phase_1_title: "Draft & Composition",
  timeline_phase_1_body: "Every painting starts as a raw charcoal sketch, planning balance, lighting relationships, and the structural depth of heavy paint applications.",
  timeline_phase_2_num: "02 /",
  timeline_phase_2_title: "Knife Modeling",
  timeline_phase_2_body: "Layering thick acrylic paints using specialized steel palette knives to sculpt heavy textured flows and rich monochrome reliefs.",
  timeline_phase_3_num: "03 /",
  timeline_phase_3_title: "Varnishing & Insured Packing",
  timeline_phase_3_body: "Applying gloss/matte varnishes for UV protection, then packaging in heavy-duty structural crates to secure safe, insured delivery."
};

export default async function AboutPage() {
  let content = DEFAULT_ABOUT_CONTENT;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('homepage_sections')
      .select('published_content')
      .eq('type', 'about_page')
      .maybeSingle();

    if (data?.published_content) {
      content = { ...DEFAULT_ABOUT_CONTENT, ...data.published_content };
    }
  } catch (err) {
    console.error('Error fetching about page CMS content, loading fallbacks:', err);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 md:pt-36 md:pb-20 space-y-16 md:space-y-24">
      
      {/* 1. Header Hero section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
          {content.hero_subtitle}
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-wide text-foreground">
          {content.hero_title}
        </h1>
        <FormattedText text={content.hero_description} className="font-sans text-xs sm:text-sm text-muted leading-relaxed max-w-xl mx-auto pt-2" />
      </section>

      {/* 2. Side-by-Side Grid Column (Narrative 1) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          {content.origin_image_url ? (
            <div className="w-full aspect-[4/5] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={content.origin_image_url} 
                alt="Studio origin shot" 
                className="w-full h-full object-cover" 
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/5] bg-[#0c0c0e] border border-zinc-900 flex flex-col items-center justify-center p-4">
              <span className="font-display text-[9px] tracking-[0.2em] text-zinc-500 uppercase">STUDIO TABLE LAYOUT</span>
              <span className="font-mono text-[7px] text-zinc-700 uppercase tracking-widest mt-1">4:5 ASPECT RATIO</span>
            </div>
          )}
        </div>
        <div className="space-y-4 md:space-y-6">
          <span className="font-display text-[9px] uppercase tracking-widest text-accent font-semibold">
            {content.origin_subtitle}
          </span>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            {content.origin_title}
          </h2>
          <FormattedText text={content.origin_body_1} className="font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed" />
          <FormattedText text={content.origin_body_2} className="font-sans text-xs sm:text-sm text-foreground/70 leading-relaxed" />
        </div>
      </section>

      {/* 3. Narrative 2 (Process) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="order-2 md:order-1 space-y-4 md:space-y-6">
          <span className="font-display text-[9px] uppercase tracking-widest text-accent font-semibold">
            {content.process_subtitle}
          </span>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            {content.process_title}
          </h2>
          <FormattedText text={content.process_body_1} className="font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed" />
          <FormattedText text={content.process_body_2} className="font-sans text-xs sm:text-sm text-foreground/70 leading-relaxed" />
        </div>
        <div className="order-1 md:order-2">
          {content.process_image_url ? (
            <div className="w-full aspect-[4/5] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={content.process_image_url} 
                alt="Studio process shot" 
                className="w-full h-full object-cover" 
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/5] bg-[#0c0c0e] border border-zinc-900 flex flex-col items-center justify-center p-4">
              <span className="font-display text-[9px] tracking-[0.2em] text-zinc-500 uppercase">EASEL WORK IN PROGRESS</span>
              <span className="font-mono text-[7px] text-zinc-700 uppercase tracking-widest mt-1">4:5 ASPECT RATIO</span>
            </div>
          )}
        </div>
      </section>

      {/* 4. Three-Column Quick Process Timeline */}
      <section className="border-t border-zinc-900 pt-16 space-y-12">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-foreground/50 text-center uppercase">
          {content.timeline_title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          
          {/* Phase 1 */}
          <div className="space-y-3">
            <span className="font-display text-2xl font-black text-zinc-800">{content.timeline_phase_1_num}</span>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">{content.timeline_phase_1_title}</h4>
            <FormattedText text={content.timeline_phase_1_body} className="font-sans text-xs text-muted leading-relaxed" />
          </div>

          {/* Phase 2 */}
          <div className="space-y-3">
            <span className="font-display text-2xl font-black text-zinc-800">{content.timeline_phase_2_num}</span>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">{content.timeline_phase_2_title}</h4>
            <FormattedText text={content.timeline_phase_2_body} className="font-sans text-xs text-muted leading-relaxed" />
          </div>

          {/* Phase 3 */}
          <div className="space-y-3">
            <span className="font-display text-2xl font-black text-zinc-800">{content.timeline_phase_3_num}</span>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">{content.timeline_phase_3_title}</h4>
            <FormattedText text={content.timeline_phase_3_body} className="font-sans text-xs text-muted leading-relaxed" />
          </div>
        </div>
      </section>
    </div>
  );
}
