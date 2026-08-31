'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InlineText from '@/components/admin/InlineText';
import FormattedText from '@/components/common/FormattedText';
import { revalidateCmsPaths } from '@/app/actions/cms-actions';

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

export default function AdminTermsEditor() {
  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

        const { data: secData } = await supabase
          .from('homepage_sections')
          .select('*')
          .eq('type', 'terms_of_service')
          .maybeSingle();

        if (secData && secData.draft_content && Object.keys(secData.draft_content).length > 0) {
          setContent({ ...DEFAULT_TERMS_CONTENT, ...secData.draft_content });
        } else if (secData) {
          setContent(DEFAULT_TERMS_CONTENT);
        } else {
          const { data: newRow, error: insertErr } = await supabase
            .from('homepage_sections')
            .insert([
              {
                type: 'terms_of_service',
                sort_order: 210,
                is_visible: true,
                draft_content: DEFAULT_TERMS_CONTENT,
                published_content: DEFAULT_TERMS_CONTENT
              }
            ])
            .select()
            .maybeSingle();

          if (insertErr) console.error('Insert initialization error:', insertErr);
          setContent(newRow?.draft_content ? { ...DEFAULT_TERMS_CONTENT, ...newRow.draft_content } : DEFAULT_TERMS_CONTENT);
        }
      } catch (err) {
        console.error('Error loading terms of service admin details:', err);
        setContent(DEFAULT_TERMS_CONTENT);
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
      const { data: updateData, error: updateErr } = await supabase
        .from('homepage_sections')
        .update({ 
          is_visible: true,
          draft_content: content,
          updated_at: new Date().toISOString()
        })
        .eq('type', 'terms_of_service')
        .select();

      if (updateErr) throw updateErr;

      if (!updateData || updateData.length === 0) {
        const { data: insertData, error: insertErr } = await supabase
          .from('homepage_sections')
          .insert([
            {
              type: 'terms_of_service',
              sort_order: 210,
              is_visible: true,
              draft_content: content,
              published_content: content
            }
          ])
          .select();

        if (insertErr) throw insertErr;
        if (!insertData || insertData.length === 0) {
          throw new Error('Failed to save terms of service draft to database.');
        }
      }
      setSaveStatus('saved');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving terms of service draft.');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const { data: updateData, error: updateErr } = await supabase
        .from('homepage_sections')
        .update({ 
          draft_content: content,
          published_content: content,
          is_visible: true,
          updated_at: new Date().toISOString()
        })
        .eq('type', 'terms_of_service')
        .select();

      if (updateErr) throw updateErr;

      if (!updateData || updateData.length === 0) {
        const { data: insertData, error: insertErr } = await supabase
          .from('homepage_sections')
          .insert([
            {
              type: 'terms_of_service',
              sort_order: 210,
              is_visible: true,
              draft_content: content,
              published_content: content
            }
          ])
          .select();

        if (insertErr) throw insertErr;
        if (!insertData || insertData.length === 0) {
          throw new Error('Failed to publish terms of service to database.');
        }
      }
      await revalidateCmsPaths(['/terms', '/admin/terms']);
      setSaveStatus('saved');
      router.refresh();
      alert('Terms of Service published successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing terms of service.');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse">Loading Terms Editor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground pt-14 pb-20">
      
      {/* Top Header Controls */}
      <header className="fixed top-0 inset-x-0 h-14 bg-[#0a0a0c] border-b border-zinc-900 z-50 px-4 sm:px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-1 hover:text-accent transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-display text-[10px] font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> TERMS OF SERVICE EDITOR
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

      {/* Saved Chip */}
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

      {/* Editor Canvas */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="border-b border-border-subtle pb-6 space-y-4">
          <span className="font-display text-[9px] uppercase tracking-widest text-accent font-semibold">
            {editMode ? (
              <InlineText value={content.subtitle || ''} onChange={(val) => updateDraft({ subtitle:val })} />
            ) : (
              content.subtitle
            )}
          </span>
          <h1 className="font-display text-3xl font-extrabold uppercase">
            {editMode ? (
              <InlineText value={content.title || ''} onChange={(val) => updateDraft({ title: val })} />
            ) : (
              content.title
            )}
          </h1>
          <div className="font-mono text-[9px] text-zinc-500">
            Last Updated:{' '}
            {editMode ? (
              <InlineText value={content.last_updated || ''} onChange={(val) => updateDraft({ last_updated: val })} />
            ) : (
              content.last_updated
            )}
          </div>
        </div>

        {/* Section 1 */}
        <div className="space-y-2 border-b border-zinc-900 pb-6">
          <h3 className="font-display text-sm font-bold uppercase text-foreground">
            {editMode ? (
              <InlineText value={content.section_1_title || ''} onChange={(val) => updateDraft({ section_1_title: val })} />
            ) : (
              content.section_1_title
            )}
          </h3>
          {editMode ? (
            <InlineText value={content.section_1_body || ''} type="textarea" onChange={(val) => updateDraft({ section_1_body: val })} />
          ) : (
            <FormattedText text={content.section_1_body} className="font-sans text-xs text-muted leading-relaxed" />
          )}
        </div>

        {/* Section 2 */}
        <div className="space-y-2 border-b border-zinc-900 pb-6">
          <h3 className="font-display text-sm font-bold uppercase text-foreground">
            {editMode ? (
              <InlineText value={content.section_2_title || ''} onChange={(val) => updateDraft({ section_2_title: val })} />
            ) : (
              content.section_2_title
            )}
          </h3>
          {editMode ? (
            <InlineText value={content.section_2_body || ''} type="textarea" onChange={(val) => updateDraft({ section_2_body: val })} />
          ) : (
            <FormattedText text={content.section_2_body} className="font-sans text-xs text-muted leading-relaxed" />
          )}
        </div>

        {/* Section 3 */}
        <div className="space-y-2 border-b border-zinc-900 pb-6">
          <h3 className="font-display text-sm font-bold uppercase text-foreground">
            {editMode ? (
              <InlineText value={content.section_3_title || ''} onChange={(val) => updateDraft({ section_3_title: val })} />
            ) : (
              content.section_3_title
            )}
          </h3>
          {editMode ? (
            <InlineText value={content.section_3_body || ''} type="textarea" onChange={(val) => updateDraft({ section_3_body: val })} />
          ) : (
            <FormattedText text={content.section_3_body} className="font-sans text-xs text-muted leading-relaxed" />
          )}
        </div>

        {/* Section 4 */}
        <div className="space-y-2 border-b border-zinc-900 pb-6">
          <h3 className="font-display text-sm font-bold uppercase text-foreground">
            {editMode ? (
              <InlineText value={content.section_4_title || ''} onChange={(val) => updateDraft({ section_4_title: val })} />
            ) : (
              content.section_4_title
            )}
          </h3>
          {editMode ? (
            <InlineText value={content.section_4_body || ''} type="textarea" onChange={(val) => updateDraft({ section_4_body: val })} />
          ) : (
            <FormattedText text={content.section_4_body} className="font-sans text-xs text-muted leading-relaxed" />
          )}
        </div>

        {/* Section 5 */}
        <div className="space-y-2">
          <h3 className="font-display text-sm font-bold uppercase text-foreground">
            {editMode ? (
              <InlineText value={content.section_5_title || ''} onChange={(val) => updateDraft({ section_5_title: val })} />
            ) : (
              content.section_5_title
            )}
          </h3>
          {editMode ? (
            <InlineText value={content.section_5_body || ''} type="textarea" onChange={(val) => updateDraft({ section_5_body: val })} />
          ) : (
            <FormattedText text={content.section_5_body} className="font-sans text-xs text-muted leading-relaxed" />
          )}
        </div>

      </div>

    </div>
  );
}
