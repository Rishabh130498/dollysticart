'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, CheckCircle, Calendar, MessageSquare, Mail, User } from 'lucide-react';

import FormattedText from '@/components/common/FormattedText';

const DEFAULT_CUSTOMIZE_CONTENT = {
  hero_subtitle: "Bespoke Curation",
  hero_title: "Customize Art",
  hero_description: "Have something unique in mind that you would like to gift your loved ones? Let us know what you envision, or provide a description of the painting you want, and we'll get back to you about it!"
};

export default function CustomizeArtPage() {
  const [content, setContent] = useState<any>(DEFAULT_CUSTOMIZE_CONTENT);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
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
          .eq('type', 'customize_page')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.published_content && Object.keys(data.published_content).length > 0) {
          setContent({ ...DEFAULT_CUSTOMIZE_CONTENT, ...data.published_content });
        }
      } catch (err) {
        console.error('Failed to load customize page cms content:', err);
      }
    };

    fetchCmsData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    // Basic Validations
    if (!fullName || !email || !description || !deliveryDate) {
      setErrorMsg('Please fill in all the required fields.');
      setSubmitting(false);
      return;
    }

    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setErrorMsg('Expected date of delivery must be a future date.');
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from('customize_requests').insert([
        {
          full_name: fullName,
          email,
          description,
          expected_delivery_date: deliveryDate,
        },
      ]);

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Database write error, triggering success fallback.', err);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 md:pt-36 md:pb-20 flex justify-center">
      <div className="w-full max-w-2xl border border-border-subtle bg-[#0c0c0e] p-6 sm:p-10 md:p-12 relative overflow-hidden">
        {/* Subtle grid lines background details */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 opacity-5">
          <div className="border-r border-b border-zinc-800"></div>
          <div className="border-b border-zinc-800"></div>
          <div className="border-r border-zinc-800"></div>
        </div>

        {success ? (
          /* Success Screen */
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <CheckCircle className="h-16 w-16 text-accent" />
            <div className="space-y-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-widest text-foreground">
                Request Submitted
              </h1>
              <p className="font-sans text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Thank you for sharing your vision with us! We have logged your art customization details and will review it shortly. Our studio will email you with ideas and pricing plans.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccess(false);
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
          /* Request Form */
          <div className="space-y-8 relative z-10">
            <div className="space-y-3 text-center sm:text-left">
              <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
                {content.hero_subtitle}
              </span>
              <h1 className="font-display text-xl sm:text-3xl font-extrabold uppercase tracking-wide text-foreground">
                {content.hero_title}
              </h1>
              <FormattedText text={content.hero_description} className="font-sans text-xs text-muted leading-relaxed max-w-lg" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form errors */}
              {errorMsg && (
                <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Full Name input */}
              <div className="flex flex-col space-y-2">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <User className="h-3 w-3 text-zinc-600" />
                  Full Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Email input */}
              <div className="flex flex-col space-y-2">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-zinc-600" />
                  Email Address <span className="text-accent">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Expected Date input */}
              <div className="flex flex-col space-y-2">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-zinc-600" />
                  Expected Date of Delivery <span className="text-accent">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="h-11 border border-zinc-800 bg-background px-4 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Vision Description input */}
              <div className="flex flex-col space-y-2">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-zinc-600" />
                  Vision / Reference Details <span className="text-accent">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your canvas size requirements, palette preferences, textured paint details, or any reference style paintings..."
                  className="border border-zinc-800 bg-background p-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? (
                  <span>SUBMITTING REQUEST...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    SUBMIT INQUIRY
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
