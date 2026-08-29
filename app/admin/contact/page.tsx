'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Eye, EyeOff, RotateCcw, Monitor, CheckCircle, ArrowLeft, Mail, MapPin, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InlineText from '@/components/admin/InlineText';

const DEFAULT_CONTACT_CONTENT = {
  hero_subtitle: "Customer Care",
  hero_title: "Contact Us",
  hero_description: "Have questions about shipping coordinates, packaging safety, print collections, or existing orders? Leave us a message.",
  details_title: "Studio Details",
  email_label: "Email Inquiry",
  email_address: "support@dollysticart.com",
  email_subtext: "We respond within 24 business hours.",
  instagram_label: "Instagram DMs",
  instagram_handle: "@dollysticart",
  instagram_subtext: "Follow for behind-the-scenes easel stories.",
  location_label: "Location Coordinates",
  location_text: "Bangalore, Karnataka, India",
  location_subtext: "Shipped securely across local regions.",
  form_title: "Send Inquiry"
};

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function AdminContactEditor() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAdmin, setIsAdmin] = useState(false);

  // Contact form preview interactive states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submittingMsg, setSubmittingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [msgError, setMsgError] = useState('');

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
          .eq('type', 'contact_page')
          .maybeSingle();

        if (secData) {
          setContent(secData.draft_content || DEFAULT_CONTACT_CONTENT);
        } else {
          const { data: newRow, error: insertError } = await supabase
            .from('homepage_sections')
            .insert([
              {
                type: 'contact_page',
                sort_order: 101,
                is_visible: false,
                draft_content: DEFAULT_CONTACT_CONTENT,
                published_content: DEFAULT_CONTACT_CONTENT
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          setContent(newRow.draft_content);
        }
      } catch (err) {
        console.error('Error loading contact admin details:', err);
        setContent(DEFAULT_CONTACT_CONTENT);
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
        .eq('type', 'contact_page');

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving contact page draft.');
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
        .eq('type', 'contact_page');

      if (error) throw error;
      setSaveStatus('saved');
      alert('Contact Page published successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing contact page.');
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
        .eq('type', 'contact_page')
        .single();
      
      if (data) {
        setContent(data.published_content || DEFAULT_CONTACT_CONTENT);
        setSaveStatus('idle');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMsgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMsg(true);
    setMsgError('');

    if (!name || !email || !subject || !message) {
      setMsgError('Please fill in all the required fields.');
      setSubmittingMsg(false);
      return;
    }

    try {
      const { error } = await supabase.from('contact_messages').insert([
        {
          name,
          email,
          subject,
          message
        }
      ]);

      if (error) throw error;
      setMsgSuccess(true);
    } catch (err: any) {
      console.error(err);
      setMsgError(err.message || 'Error submitting message.');
    } finally {
      setSubmittingMsg(false);
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
            ✏️ CONTACT EDITOR
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* Page Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 md:mb-20">
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
            {editMode ? (
              <InlineText
                value={content.hero_subtitle || 'Customer Care'}
                onChange={(val) => updateDraft({ hero_subtitle: val })}
              />
            ) : (
              content.hero_subtitle
            )}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-wide text-foreground">
            {editMode ? (
              <InlineText
                value={content.hero_title || 'Contact Us'}
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
        </div>

        {/* Main Grid Row layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">
          
          {/* Left Details Cards */}
          <div className="lg:col-span-5 space-y-8">
            <div className="border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground border-b border-border-subtle pb-4">
                {editMode ? (
                  <InlineText
                    value={content.details_title || 'Studio Details'}
                    onChange={(val) => updateDraft({ details_title: val })}
                  />
                ) : (
                  content.details_title
                )}
              </h2>
              
              <ul className="space-y-6 font-sans text-xs">
                {/* Mail */}
                <li className="flex items-start gap-4">
                  <Mail className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <h4 className="font-display text-[9px] uppercase tracking-widest text-foreground font-bold mb-1">
                      {editMode ? (
                        <InlineText
                          value={content.email_label || 'Email Inquiry'}
                          onChange={(val) => updateDraft({ email_label: val })}
                        />
                      ) : (
                        content.email_label
                      )}
                    </h4>
                    <div className="text-muted hover:text-accent transition-colors font-medium">
                      {editMode ? (
                        <InlineText
                          value={content.email_address || 'support@dollysticart.com'}
                          onChange={(val) => updateDraft({ email_address: val })}
                        />
                      ) : (
                        content.email_address
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {editMode ? (
                        <InlineText
                          value={content.email_subtext || ''}
                          onChange={(val) => updateDraft({ email_subtext: val })}
                        />
                      ) : (
                        content.email_subtext
                      )}
                    </p>
                  </div>
                </li>

                {/* Instagram */}
                <li className="flex items-start gap-4">
                  <InstagramIcon className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-display text-[9px] uppercase tracking-widest text-foreground font-bold mb-1">
                      {editMode ? (
                        <InlineText
                          value={content.instagram_label || 'Instagram DMs'}
                          onChange={(val) => updateDraft({ instagram_label: val })}
                        />
                      ) : (
                        content.instagram_label
                      )}
                    </h4>
                    <div className="text-muted hover:text-accent transition-colors font-medium">
                      {editMode ? (
                        <InlineText
                          value={content.instagram_handle || '@dollysticart'}
                          onChange={(val) => updateDraft({ instagram_handle: val })}
                        />
                      ) : (
                        content.instagram_handle
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {editMode ? (
                        <InlineText
                          value={content.instagram_subtext || ''}
                          onChange={(val) => updateDraft({ instagram_subtext: val })}
                        />
                      ) : (
                        content.instagram_subtext
                      )}
                    </p>
                  </div>
                </li>

                {/* Location */}
                <li className="flex items-start gap-4">
                  <MapPin className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-display text-[9px] uppercase tracking-widest text-foreground font-bold mb-1">
                      {editMode ? (
                        <InlineText
                          value={content.location_label || 'Location Coordinates'}
                          onChange={(val) => updateDraft({ location_label: val })}
                        />
                      ) : (
                        content.location_label
                      )}
                    </h4>
                    <p className="text-muted font-medium">
                      {editMode ? (
                        <InlineText
                          value={content.location_text || 'Bangalore, Karnataka, India'}
                          onChange={(val) => updateDraft({ location_text: val })}
                        />
                      ) : (
                        content.location_text
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {editMode ? (
                        <InlineText
                          value={content.location_subtext || ''}
                          onChange={(val) => updateDraft({ location_subtext: val })}
                        />
                      ) : (
                        content.location_subtext
                      )}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Preview Side Form */}
          <div className="lg:col-span-7 border border-border-subtle bg-[#0c0c0e] p-6 sm:p-10 relative overflow-hidden transition-all">
            {msgSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <CheckCircle className="h-14 w-14 text-accent" />
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold uppercase tracking-widest text-foreground">Message Sent (Test)</h3>
                  <p className="font-sans text-xs text-muted max-w-sm mx-auto leading-relaxed">
                    Test submission completed successfully!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMsgSuccess(false);
                    setName('');
                    setEmail('');
                    setSubject('');
                    setMessage('');
                  }}
                  className="border border-zinc-800 hover:border-accent px-6 py-2.5 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleMsgSubmit} className="space-y-6">
                <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground border-b border-border-subtle pb-4">
                  {editMode ? (
                    <InlineText
                      value={content.form_title || 'Send Inquiry'}
                      onChange={(val) => updateDraft({ form_title: val })}
                    />
                  ) : (
                    content.form_title || 'Send Inquiry'
                  )}
                </h2>

                <div className="relative overflow-hidden pt-2">
                  {editMode && (
                    <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center pointer-events-auto select-none">
                      <span className="font-display text-[8px] tracking-widest text-zinc-400 bg-zinc-950 border border-zinc-900 px-3 py-1.5 uppercase font-semibold">
                        ✏️ SWITCH TO PREVIEW TO TEST FORM SUBMISSION
                      </span>
                    </div>
                  )}

                  <div className={`space-y-6 ${editMode ? 'opacity-30' : ''}`}>
                    {msgError && (
                      <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
                        {msgError}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex flex-col space-y-2">
                      <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                        Your Name <span className="text-accent">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={editMode}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col space-y-2">
                      <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                        Email Address <span className="text-accent">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        disabled={editMode}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. jane@example.com"
                        className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Subject */}
                    <div className="flex flex-col space-y-2">
                      <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                        Subject / Concern <span className="text-accent">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={editMode}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Shipping delivery status..."
                        className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Message */}
                    <div className="flex flex-col space-y-2">
                      <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                        Message Details <span className="text-accent">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        disabled={editMode}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Explain your inquiry in detail..."
                        className="border border-zinc-800 bg-background p-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors resize-none leading-relaxed disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingMsg || editMode}
                      className="w-full h-12 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingMsg ? (
                        <span>SENDING MESSAGE...</span>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          SEND MESSAGE
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
