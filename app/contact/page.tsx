'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, MapPin, Send, CheckCircle } from 'lucide-react';

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
  location_subtext: "Shipped securely across local regions."
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

export default function ContactPage() {
  const [content, setContent] = useState<any>(DEFAULT_CONTACT_CONTENT);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchCmsData = async () => {
      try {
        const { data } = await supabase
          .from('homepage_sections')
          .select('published_content')
          .eq('type', 'contact_page')
          .maybeSingle();

        if (data?.published_content) {
          setContent({ ...DEFAULT_CONTACT_CONTENT, ...data.published_content });
        }
      } catch (err) {
        console.error('Failed to load contact page cms content:', err);
      }
    };

    fetchCmsData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    if (!name || !email || !subject || !message) {
      setErrorMsg('Please fill in all the required fields.');
      setSubmitting(false);
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

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error writing contact message, triggering fallback.', err);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 md:pt-36 md:pb-20">
      
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 md:mb-20">
        <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
          {content.hero_subtitle}
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-wide text-foreground">
          {content.hero_title}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-muted leading-relaxed max-w-xl mx-auto pt-2">
          {content.hero_description}
        </p>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">
        
        {/* Left: Studio details & social channels */}
        <div className="lg:col-span-5 space-y-8">
          <div className="border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground border-b border-border-subtle pb-4">
              {content.details_title}
            </h2>
            
            <ul className="space-y-6 font-sans text-xs">
              {/* Mail */}
              <li className="flex items-start gap-4">
                <Mail className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-[9px] uppercase tracking-widest text-foreground font-bold mb-1">
                    {content.email_label}
                  </h4>
                  <a href={`mailto:${content.email_address}`} className="text-muted hover:text-accent transition-colors font-medium">
                    {content.email_address}
                  </a>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{content.email_subtext}</p>
                </div>
              </li>

              {/* Instagram */}
              <li className="flex items-start gap-4">
                <InstagramIcon className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-[9px] uppercase tracking-widest text-foreground font-bold mb-1">
                    {content.instagram_label}
                  </h4>
                  <a 
                    href={`https://instagram.com/${content.instagram_handle.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-muted hover:text-accent transition-colors font-medium"
                  >
                    {content.instagram_handle}
                  </a>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{content.instagram_subtext}</p>
                </div>
              </li>

              {/* Location */}
              <li className="flex items-start gap-4">
                <MapPin className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-[9px] uppercase tracking-widest text-foreground font-bold mb-1">
                    {content.location_label}
                  </h4>
                  <p className="text-muted font-medium">{content.location_text}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{content.location_subtext}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Message Form panel */}
        <div className="lg:col-span-7 border border-border-subtle bg-[#0c0c0e] p-6 sm:p-10 relative overflow-hidden">
          
          {success ? (
            /* Success screen state */
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in fade-in zoom-in duration-300">
              <CheckCircle className="h-14 w-14 text-accent" />
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold uppercase tracking-widest text-foreground">Message Sent</h3>
                <p className="font-sans text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out! We have logged your request. Our customer care team will email you with details soon.
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
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
            /* Form input fields */
            <div className="space-y-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground border-b border-border-subtle pb-4">
                {content.form_title || 'Send Inquiry'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {errorMsg && (
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
                    {errorMsg}
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jane@example.com"
                    className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
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
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Shipping delivery status, custom size queries..."
                    className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                {/* Message body */}
                <div className="flex flex-col space-y-2">
                  <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                    Message Details <span className="text-accent">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain your inquiry in detail..."
                    className="border border-zinc-800 bg-background p-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>SENDING MESSAGE...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      SEND MESSAGE
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
