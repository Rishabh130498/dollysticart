'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InlineText from '@/components/admin/InlineText';

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

export default function AdminPrivacyEditor() {
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
          .eq('type', 'privacy_policy')
          .maybeSingle();

        if (secData) {
          setContent(secData.draft_content || DEFAULT_PRIVACY_CONTENT);
        } else {
          const { data: newRow } = await supabase
            .from('homepage_sections')
            .insert([
              {
                type: 'privacy_policy',
                sort_order: 200,
                is_visible: true,
                draft_content: DEFAULT_PRIVACY_CONTENT,
                published_content: DEFAULT_PRIVACY_CONTENT
              }
            ])
            .select()
            .single();

          setContent(newRow ? newRow.draft_content : DEFAULT_PRIVACY_CONTENT);
        }
      } catch (err) {
        console.error('Error loading privacy policy admin details:', err);
        setContent(DEFAULT_PRIVACY_CONTENT);
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
        .eq('type', 'privacy_policy');

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving privacy policy draft.');
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
        .eq('type', 'privacy_policy');

      if (error) throw error;
      setSaveStatus('saved');
      alert('Privacy Policy published successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing privacy policy.');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse">Loading Privacy Editor...</span>
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
            <ShieldCheck className="h-4 w-4" /> PRIVACY POLICY EDITOR
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
              <InlineText value={content.subtitle || ''} onChange={(val) => updateDraft({ subtitle: val })} />
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
          <p className="font-sans text-xs text-muted leading-relaxed">
            {editMode ? (
              <InlineText value={content.section_1_body || ''} type="textarea" onChange={(val) => updateDraft({ section_1_body: val })} />
            ) : (
              content.section_1_body
            )}
          </p>
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
          <p className="font-sans text-xs text-muted leading-relaxed">
            {editMode ? (
              <InlineText value={content.section_2_body || ''} type="textarea" onChange={(val) => updateDraft({ section_2_body: val })} />
            ) : (
              content.section_2_body
            )}
          </p>
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
          <p className="font-sans text-xs text-muted leading-relaxed">
            {editMode ? (
              <InlineText value={content.section_3_body || ''} type="textarea" onChange={(val) => updateDraft({ section_3_body: val })} />
            ) : (
              content.section_3_body
            )}
          </p>
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
          <p className="font-sans text-xs text-muted leading-relaxed">
            {editMode ? (
              <InlineText value={content.section_4_body || ''} type="textarea" onChange={(val) => updateDraft({ section_4_body: val })} />
            ) : (
              content.section_4_body
            )}
          </p>
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
          <p className="font-sans text-xs text-muted leading-relaxed">
            {editMode ? (
              <InlineText value={content.section_5_body || ''} type="textarea" onChange={(val) => updateDraft({ section_5_body: val })} />
            ) : (
              content.section_5_body
            )}
          </p>
        </div>

      </div>

    </div>
  );
}
