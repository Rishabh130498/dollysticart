'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Calendar, CheckCircle, Eye, EyeOff, Archive, CalendarIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminMessagesPage() {
  const [activeTab, setActiveTab] = useState<'customizations' | 'contacts'>('customizations');
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch custom requests
      const { data: custData } = await supabase
        .from('customize_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setCustomRequests(custData || []);

      // 2. Fetch contact messages
      const { data: contData } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      setContactMessages(contData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Custom request status
  const updateCustomStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('customize_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setCustomRequests(items => items.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  // Update Contact message status
  const updateContactStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setContactMessages(items => items.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING MESSAGES LOGS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-border-subtle pb-6">
        <div>
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">Communications Panel</span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide">Customer Messages</h1>
        </div>
      </div>

      {/* Tab Filter bar */}
      <div className="flex gap-4 border-b border-zinc-900 pb-4 font-display text-[9px] tracking-widest uppercase">
        <button
          onClick={() => setActiveTab('customizations')}
          className={`pb-1.5 border-b font-bold transition-all ${
            activeTab === 'customizations' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          CUSTOM ART INQUIRIES ({customRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`pb-1.5 border-b font-bold transition-all ${
            activeTab === 'contacts' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          CONTACT FORM ENTRIES ({contactMessages.length})
        </button>
      </div>

      {/* Contents based on active tab */}
      {activeTab === 'customizations' ? (
        
        /* ------------------------------------------------------------- */
        /* CUSTOM ART COMMISSIONS REQUESTS LIST */
        /* ------------------------------------------------------------- */
        customRequests.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-900">
            <span className="font-display text-xs text-muted tracking-widest uppercase">No custom requests logged</span>
          </div>
        ) : (
          <div className="space-y-6">
            {customRequests.map((request) => (
              <div 
                key={request.id} 
                className="border border-border-subtle bg-[#0c0c0e] p-5 sm:p-6 space-y-4 relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-zinc-900 pb-4 items-start sm:items-center">
                  <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                      {request.full_name}
                    </h3>
                    <span className="text-[10px] text-muted block mt-0.5">{request.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs">
                    {/* Delivery target */}
                    <span className="flex items-center gap-1 text-[11px] text-muted font-sans">
                      <CalendarIcon className="h-3.5 w-3.5 text-zinc-700" />
                      Target Date: {new Date(request.expected_delivery_date).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                    
                    {/* Status badge */}
                    <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                      request.status === 'pending'
                        ? 'border-amber-500/20 bg-amber-500/5 text-amber-500'
                        : 'border-green-500/20 bg-green-500/5 text-green-500'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                {/* Description details */}
                <div className="space-y-2 font-sans text-xs">
                  <h4 className="font-display text-[9px] uppercase tracking-widest text-zinc-500">Vision Details / Customizations:</h4>
                  <p className="text-foreground/80 leading-relaxed max-w-3xl whitespace-pre-line bg-background/50 border border-zinc-950 p-4 font-sans text-xs">
                    {request.description}
                  </p>
                </div>

                {/* Actions toggles */}
                <div className="flex justify-end gap-3 pt-2">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => updateCustomStatus(request.id, 'reviewed')}
                      className="h-8 px-3 border border-zinc-800 hover:border-accent text-zinc-400 hover:text-accent font-display text-[8px] uppercase tracking-widest transition-all rounded"
                    >
                      MARK AS REVIEWED
                    </button>
                  )}
                  {request.status === 'reviewed' && (
                    <button
                      onClick={() => updateCustomStatus(request.id, 'responded')}
                      className="h-8 px-3 border border-green-500/30 text-green-500/70 hover:text-green-500 font-display text-[8px] uppercase tracking-widest transition-all rounded"
                    >
                      MARK RESPONDED
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        
        /* ------------------------------------------------------------- */
        /* PUBLIC CONTACT SUPPORT MESSAGES LIST */
        /* ------------------------------------------------------------- */
        contactMessages.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-900">
            <span className="font-display text-xs text-muted tracking-widest uppercase">No messages logged</span>
          </div>
        ) : (
          <div className="space-y-6">
            {contactMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="border border-border-subtle bg-[#0c0c0e] p-5 sm:p-6 space-y-4 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-zinc-900 pb-4 items-start sm:items-center">
                  <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                      {msg.name} &bull; <span className="text-muted font-normal lowercase">{msg.email}</span>
                    </h3>
                    <span className="font-display text-[10px] text-accent uppercase tracking-wider block mt-1">
                      Subject: {msg.subject}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[10px] text-muted font-sans">
                      Received: {new Date(msg.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                    
                    <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                      msg.status === 'unread'
                        ? 'border-amber-500/20 bg-amber-500/5 text-amber-500'
                        : msg.status === 'read'
                        ? 'border-green-500/20 bg-green-500/5 text-green-500'
                        : 'border-zinc-800 bg-background text-muted'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                </div>

                {/* Message body */}
                <div className="space-y-2 font-sans text-xs">
                  <h4 className="font-display text-[9px] uppercase tracking-widest text-zinc-500">Message Body:</h4>
                  <p className="text-foreground/80 leading-relaxed max-w-3xl whitespace-pre-line bg-background/50 border border-zinc-950 p-4 font-sans text-xs">
                    {msg.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  {msg.status === 'unread' && (
                    <button
                      onClick={() => updateContactStatus(msg.id, 'read')}
                      className="h-8 px-3 border border-zinc-800 hover:border-accent text-zinc-400 hover:text-accent font-display text-[8px] uppercase tracking-widest transition-all rounded"
                    >
                      MARK AS READ
                    </button>
                  )}
                  {msg.status === 'read' && (
                    <button
                      onClick={() => updateContactStatus(msg.id, 'archived')}
                      className="h-8 px-3 border border-zinc-800 hover:border-red-500 text-zinc-500 hover:text-red-500 font-display text-[8px] uppercase tracking-widest transition-all rounded"
                    >
                      ARCHIVE MESSAGE
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
