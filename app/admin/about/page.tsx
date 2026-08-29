'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Eye, EyeOff, RotateCcw, Monitor, CheckCircle, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InlineText from '@/components/admin/InlineText';
import ImageDropzone from '@/components/admin/ImageDropzone';

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

export default function AdminAboutEditor() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          window.location.href = '/admin';
          return;
        }

        const email = session.user.email?.toLowerCase() || '';
        const { data: whitelist } = await supabase
          .from('admin_whitelist')
          .select('email')
          .eq('email', email);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const isRoot = email === 'rishabhagarwal.me@gmail.com';
        const isWhitelisted = whitelist && whitelist.length > 0;
        const isProfileAdmin = profile?.role === 'admin';

        if (!isRoot && !isWhitelisted && !isProfileAdmin) {
          window.location.href = '/';
          return;
        }

        setIsAdmin(true);

        const { data: secData } = await supabase
          .from('homepage_sections')
          .select('*')
          .eq('type', 'about_page')
          .maybeSingle();

        if (secData) {
          setContent(secData.draft_content || DEFAULT_ABOUT_CONTENT);
        } else {
          const { data: newRow, error: insertError } = await supabase
            .from('homepage_sections')
            .insert([
              {
                type: 'about_page',
                sort_order: 100,
                is_visible: false,
                draft_content: DEFAULT_ABOUT_CONTENT,
                published_content: DEFAULT_ABOUT_CONTENT
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          setContent(newRow.draft_content);
        }
      } catch (err) {
        console.error('Error loading about admin details:', err);
        setContent(DEFAULT_ABOUT_CONTENT);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [supabase]);

  const updateDraft = (newFields: any) => {
    setContent((prev: any) => ({ ...prev, ...newFields }));
    setSaveStatus('idle');
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ draft_content: content })
        .eq('type', 'about_page');

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving about page draft.');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ 
          draft_content: content,
          published_content: content,
          is_visible: true 
        })
        .eq('type', 'about_page');

      if (error) throw error;
      setSaveStatus('saved');
      alert('About Page published successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing about page.');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm('Discard all unsaved edits and restore published view?')) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('homepage_sections')
        .select('published_content')
        .eq('type', 'about_page')
        .single();
      
      if (data) {
        setContent(data.published_content || DEFAULT_ABOUT_CONTENT);
        setSaveStatus('idle');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse">Loading Editor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground pt-14 pb-20">
      
      {/* 1. TOP BUILDER BAR */}
      <header className="fixed top-0 inset-x-0 h-14 bg-[#0a0a0c] border-b border-zinc-900 z-50 px-4 sm:px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-1 hover:text-accent transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-display text-[10px] font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
            ✏️ ABOUT EDITOR
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-[#121215] border border-zinc-800 rounded p-0.5">
            <button
              onClick={() => setEditMode(true)}
              className={`px-2.5 py-1 text-[8px] font-display uppercase tracking-widest font-semibold rounded-sm transition-all ${
                editMode ? 'bg-accent text-black shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setEditMode(false)}
              className={`px-2.5 py-1 text-[8px] font-display uppercase tracking-widest font-semibold rounded-sm transition-all ${
                !editMode ? 'bg-accent text-black shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-foreground font-display text-[8px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
            >
              Discard
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-foreground font-display text-[8px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-3 py-1.5 bg-accent hover:bg-accent/95 text-black font-display text-[8px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      {/* 2. REUSABLE SAVED STATUS CHIP */}
      {saveStatus !== 'idle' && (
        <div className="fixed bottom-4 right-4 z-40 bg-zinc-950/90 border border-zinc-800 px-3 py-2 flex items-center gap-2 rounded-sm text-[8px] font-mono uppercase tracking-widest">
          {saveStatus === 'saving' ? (
            <span className="text-zinc-500 animate-pulse">Saving changes...</span>
          ) : (
            <span className="text-accent flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" /> Changes saved
            </span>
          )}
        </div>
      )}

      {/* 3. VISUAL CANVAS */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16 md:space-y-24">
        
        {/* 3.1 Hero Banner */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
            {editMode ? (
              <InlineText
                value={content.hero_subtitle || 'Editorial Story'}
                onChange={(val) => updateDraft({ hero_subtitle: val })}
              />
            ) : (
              content.hero_subtitle
            )}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-wide text-foreground">
            {editMode ? (
              <InlineText
                value={content.hero_title || 'Dollysticart Studio'}
                onChange={(val) => updateDraft({ hero_title: val })}
              />
            ) : (
              content.hero_title
            )}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-muted leading-relaxed max-w-xl mx-auto pt-2">
            {editMode ? (
              <InlineText
                value={content.hero_description || ''}
                type="textarea"
                onChange={(val) => updateDraft({ hero_description: val })}
              />
            ) : (
              content.hero_description
            )}
          </p>
        </section>

        {/* 3.2 Origin story */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            {editMode ? (
              <ImageDropzone
                imageUrl={content.origin_image_url}
                ratioClass="aspect-[4/5]"
                label="Studio Table Layout"
                onUploadSuccess={(url) => updateDraft({ origin_image_url: url })}
              />
            ) : content.origin_image_url ? (
              <div className="w-full aspect-[4/5] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.origin_image_url} alt="Studio origin shot" className="w-full h-full object-cover" />
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
              {editMode ? (
                <InlineText
                  value={content.origin_subtitle || 'Origin'}
                  onChange={(val) => updateDraft({ origin_subtitle: val })}
                />
              ) : (
                content.origin_subtitle
              )}
            </span>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              {editMode ? (
                <InlineText
                  value={content.origin_title || 'Bespoke Textures & Impasto Work'}
                  onChange={(val) => updateDraft({ origin_title: val })}
                />
              ) : (
                content.origin_title
              )}
            </h2>
            <div className="font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed space-y-4">
              <p>
                {editMode ? (
                  <InlineText
                    value={content.origin_body_1 || ''}
                    type="textarea"
                    onChange={(val) => updateDraft({ origin_body_1: val })}
                  />
                ) : (
                  content.origin_body_1
                )}
              </p>
              <p>
                {editMode ? (
                  <InlineText
                    value={content.origin_body_2 || ''}
                    type="textarea"
                    onChange={(val) => updateDraft({ origin_body_2: val })}
                  />
                ) : (
                  content.origin_body_2
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 3.3 Process Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1 space-y-4 md:space-y-6">
            <span className="font-display text-[9px] uppercase tracking-widest text-accent font-semibold">
              {editMode ? (
                <InlineText
                  value={content.process_subtitle || 'Process'}
                  onChange={(val) => updateDraft({ process_subtitle: val })}
                />
              ) : (
                content.process_subtitle
              )}
            </span>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
              {editMode ? (
                <InlineText
                  value={content.process_title || 'The Archival Philosophy'}
                  onChange={(val) => updateDraft({ process_title: val })}
                />
              ) : (
                content.process_title
              )}
            </h2>
            <div className="font-sans text-xs sm:text-sm text-foreground/80 leading-relaxed space-y-4">
              <p>
                {editMode ? (
                  <InlineText
                    value={content.process_body_1 || ''}
                    type="textarea"
                    onChange={(val) => updateDraft({ process_body_1: val })}
                  />
                ) : (
                  content.process_body_1
                )}
              </p>
              <p>
                {editMode ? (
                  <InlineText
                    value={content.process_body_2 || ''}
                    type="textarea"
                    onChange={(val) => updateDraft({ process_body_2: val })}
                  />
                ) : (
                  content.process_body_2
                )}
              </p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            {editMode ? (
              <ImageDropzone
                imageUrl={content.process_image_url}
                ratioClass="aspect-[4/5]"
                label="Easel Work In Progress"
                onUploadSuccess={(url) => updateDraft({ process_image_url: url })}
              />
            ) : content.process_image_url ? (
              <div className="w-full aspect-[4/5] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.process_image_url} alt="Studio process shot" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-[4/5] bg-[#0c0c0e] border border-zinc-900 flex flex-col items-center justify-center p-4">
                <span className="font-display text-[9px] tracking-[0.2em] text-zinc-500 uppercase">EASEL WORK IN PROGRESS</span>
                <span className="font-mono text-[7px] text-zinc-700 uppercase tracking-widest mt-1">4:5 ASPECT RATIO</span>
              </div>
            )}
          </div>
        </section>

        {/* 3.4 Timeline grid */}
        <section className="border-t border-zinc-900 pt-16 space-y-12">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-foreground/50 text-center">
            {editMode ? (
              <InlineText
                value={content.timeline_title || 'Studio Timeline'}
                onChange={(val) => updateDraft({ timeline_title: val })}
              />
            ) : (
              content.timeline_title
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            
            {/* Phase 1 */}
            <div className="space-y-3">
              <span className="font-display text-2xl font-black text-zinc-800">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_1_num || '01 /'}
                    onChange={(val) => updateDraft({ timeline_phase_1_num: val })}
                  />
                ) : (
                  content.timeline_phase_1_num
                )}
              </span>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_1_title || ''}
                    onChange={(val) => updateDraft({ timeline_phase_1_title: val })}
                  />
                ) : (
                  content.timeline_phase_1_title
                )}
              </h4>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_1_body || ''}
                    type="textarea"
                    onChange={(val) => updateDraft({ timeline_phase_1_body: val })}
                  />
                ) : (
                  content.timeline_phase_1_body
                )}
              </p>
            </div>

            {/* Phase 2 */}
            <div className="space-y-3">
              <span className="font-display text-2xl font-black text-zinc-800">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_2_num || '02 /'}
                    onChange={(val) => updateDraft({ timeline_phase_2_num: val })}
                  />
                ) : (
                  content.timeline_phase_2_num
                )}
              </span>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_2_title || ''}
                    onChange={(val) => updateDraft({ timeline_phase_2_title: val })}
                  />
                ) : (
                  content.timeline_phase_2_title
                )}
              </h4>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_2_body || ''}
                    type="textarea"
                    onChange={(val) => updateDraft({ timeline_phase_2_body: val })}
                  />
                ) : (
                  content.timeline_phase_2_body
                )}
              </p>
            </div>

            {/* Phase 3 */}
            <div className="space-y-3">
              <span className="font-display text-2xl font-black text-zinc-800">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_3_num || '03 /'}
                    onChange={(val) => updateDraft({ timeline_phase_3_num: val })}
                  />
                ) : (
                  content.timeline_phase_3_num
                )}
              </span>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_3_title || ''}
                    onChange={(val) => updateDraft({ timeline_phase_3_title: val })}
                  />
                ) : (
                  content.timeline_phase_3_title
                )}
              </h4>
              <p className="font-sans text-xs text-muted leading-relaxed">
                {editMode ? (
                  <InlineText
                    value={content.timeline_phase_3_body || ''}
                    type="textarea"
                    onChange={(val) => updateDraft({ timeline_phase_3_body: val })}
                  />
                ) : (
                  content.timeline_phase_3_body
                )}
              </p>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}
