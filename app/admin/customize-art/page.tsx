'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Eye, EyeOff, RotateCcw, Monitor, CheckCircle, ArrowLeft, Send, Calendar, MessageSquare, User, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InlineText from '@/components/admin/InlineText';

const DEFAULT_CUSTOMIZE_CONTENT = {
  hero_subtitle: "Bespoke Curation",
  hero_title: "Customize Art",
  hero_description: "Have something unique in mind that you would like to gift your loved ones? Let us know what you envision, or provide a description of the painting you want, and we'll get back to you about it!"
};

export default function AdminCustomizeEditor() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAdmin, setIsAdmin] = useState(false);

  // Customize form preview interactive states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState('');

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
          .eq('type', 'customize_page')
          .maybeSingle();

        if (secData) {
          setContent(secData.draft_content || DEFAULT_CUSTOMIZE_CONTENT);
        } else {
          const { data: newRow, error: insertError } = await supabase
            .from('homepage_sections')
            .insert([
              {
                type: 'customize_page',
                sort_order: 102,
                is_visible: false,
                draft_content: DEFAULT_CUSTOMIZE_CONTENT,
                published_content: DEFAULT_CUSTOMIZE_CONTENT
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          setContent(newRow.draft_content);
        }
      } catch (err) {
        console.error('Error loading customize admin details:', err);
        setContent(DEFAULT_CUSTOMIZE_CONTENT);
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
        .eq('type', 'customize_page');

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving customize page draft.');
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
        .eq('type', 'customize_page');

      if (error) throw error;
      setSaveStatus('saved');
      alert('Customize Art Page published successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing customize page.');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const handleReqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReq(true);
    setReqError('');

    if (!fullName || !email || !description || !deliveryDate) {
      setReqError('Please fill in all the required fields.');
      setSubmittingReq(false);
      return;
    }

    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setReqError('Expected date of delivery must be a future date.');
      setSubmittingReq(false);
      return;
    }

    try {
      const { error } = await supabase.from('customize_requests').insert([
        {
          full_name: fullName,
          email,
          description,
          expected_delivery_date: deliveryDate
        }
      ]);

      if (error) throw error;
      setReqSuccess(true);
    } catch (err: any) {
      console.error(err);
      setReqError(err.message || 'Error submitting request.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm('Discard all unsaved edits and restore published view?')) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('homepage_sections')
        .select('published_content')
        .eq('type', 'customize_page')
        .single();
      
      if (data) {
        setContent(data.published_content || DEFAULT_CUSTOMIZE_CONTENT);
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
            ✏️ CUSTOMIZE EDITOR
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex justify-center">
        <div className="w-full max-w-2xl border border-border-subtle bg-[#0c0c0e] p-6 sm:p-10 md:p-12 relative overflow-hidden">
          <div className="space-y-8 relative z-10">
            <div className="space-y-3 text-center sm:text-left">
              <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
                {editMode ? (
                  <InlineText
                    value={content.hero_subtitle || 'Bespoke Curation'}
                    onChange={(val) => updateDraft({ hero_subtitle: val })}
                  />
                ) : (
                  content.hero_subtitle
                )}
              </span>
              <h1 className="font-display text-xl sm:text-3xl font-extrabold uppercase tracking-wide text-foreground">
                {editMode ? (
                  <InlineText
                    value={content.hero_title || 'Customize Art'}
                    onChange={(val) => updateDraft({ hero_title: val })}
                  />
                ) : (
                  content.hero_title
                )}
              </h1>
              <p className="font-sans text-xs text-muted leading-relaxed max-w-lg">
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
            </div>

            {/* Interactive Form Preview Mode */}
            <div className="space-y-6 pt-6 relative overflow-hidden">
              {editMode && (
                <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center pointer-events-auto select-none">
                  <span className="font-display text-[8px] tracking-widest text-zinc-400 font-semibold bg-zinc-950 border border-zinc-900 px-3 py-1.5 uppercase">
                    ✏️ SWITCH TO PREVIEW TO TEST FORM SUBMISSION
                  </span>
                </div>
              )}

              {reqSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                  <CheckCircle className="h-16 w-16 text-accent" />
                  <div className="space-y-2">
                    <h3 className="font-display text-lg font-bold uppercase tracking-widest text-foreground">
                      Request Submitted (Test)
                    </h3>
                    <p className="font-sans text-xs text-muted max-w-sm mx-auto leading-relaxed">
                      Test request submitted successfully!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReqSuccess(false);
                      setFullName('');
                      setEmail('');
                      setDescription('');
                      setDeliveryDate('');
                    }}
                    className="border border-zinc-800 hover:border-accent px-6 py-2.5 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                  >
                    SUBMIT ANOTHER REQUEST
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReqSubmit} className="space-y-6">
                  {reqError && (
                    <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
                      {reqError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="flex flex-col space-y-2">
                    <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                      <User className="h-3 w-3 text-zinc-650" />
                      Full Name <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={editMode}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col space-y-2">
                    <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-zinc-650" />
                      Email Address <span className="text-accent">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      disabled={editMode}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Expected Date */}
                  <div className="flex flex-col space-y-2">
                    <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-zinc-650" />
                      Expected Date of Delivery <span className="text-accent">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      disabled={editMode}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors [color-scheme:dark] disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col space-y-2">
                    <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3 text-zinc-650" />
                      Vision / Reference Details <span className="text-accent">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      disabled={editMode}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe canvas sizes, color palette preferences..."
                      className="border border-zinc-800 bg-background p-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-650 focus:border-accent focus:outline-none transition-colors resize-none leading-relaxed disabled:cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReq || editMode}
                    className="w-full h-12 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReq ? (
                      <span>SUBMITTING REQUEST...</span>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        SUBMIT INQUIRY
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
