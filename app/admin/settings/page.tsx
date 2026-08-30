'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Save, User, Mail, ShieldAlert, CheckCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createOptimizedWebPFile, generateStorageFileNames } from '@/lib/utils/image-optimization';

export default function AdminSettingsPage() {
  const [adminLimit, setAdminLimit] = useState<number>(1);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [activeAdmins, setActiveAdmins] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [updatingLimit, setUpdatingLimit] = useState(false);
  const [addingEmail, setAddingEmail] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabase = createClient();

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch admin limit
      const { data: setting } = await supabase
        .from('admin_settings')
        .select('admin_limit')
        .eq('id', 1)
        .single();
      if (setting) {
        setAdminLimit(setting.admin_limit);
      }

      // 2. Fetch admin whitelist
      const { data: wlData } = await supabase
        .from('admin_whitelist')
        .select('*')
        .order('created_at', { ascending: false });
      setWhitelist(wlData || []);

      // 3. Fetch currently active admins
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: true });
      setActiveAdmins(adminProfiles || []);

    } catch (e) {
      console.error('Error fetching admin config settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // Update limit handler
  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingLimit(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (adminLimit < 1) {
      setErrorMsg('Admin limit must be at least 1.');
      setUpdatingLimit(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ admin_limit: adminLimit, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (error) throw error;
      setSuccessMsg('Administrator capacity limit updated successfully.');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update admin capacity settings.');
    } finally {
      setUpdatingLimit(false);
    }
  };

  // Add email to whitelist handler
  const handleAddToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEmail(true);
    setErrorMsg('');
    setSuccessMsg('');

    const emailToRegister = newEmail.trim().toLowerCase();
    if (!emailToRegister) {
      setAddingEmail(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_whitelist')
        .insert([{ email: emailToRegister }]);

      if (error) throw error;
      
      setNewEmail('');
      setSuccessMsg('Email address added to admin whitelist.');
      setTimeout(() => setSuccessMsg(''), 2000);
      
      // Reload lists
      const { data: wlData } = await supabase
        .from('admin_whitelist')
        .select('*')
        .order('created_at', { ascending: false });
      setWhitelist(wlData || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Email already exists or invalid whitelist request.');
    } finally {
      setAddingEmail(false);
    }
  };

  // Remove email from whitelist handler
  const handleRemoveFromWhitelist = async (id: string) => {
    if (!confirm('Are you sure you want to remove this email from the whitelist? Registering users with this email will no longer be promoted to admins.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWhitelist(items => items.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to remove email from whitelist.');
    }
  };

  const [runningOptimizer, setRunningOptimizer] = useState(false);
  const [optimizerLog, setOptimizerLog] = useState<string[]>([]);

  // Batch Image Optimization Handler
  const handleRunBatchOptimization = async () => {
    if (!confirm('This will convert all existing legacy JPG/PNG images in your database to optimized WebP format and update DB records. Continue?')) {
      return;
    }
    setRunningOptimizer(true);
    setErrorMsg('');
    setSuccessMsg('');
    setOptimizerLog(['Starting batch image conversion to WebP...']);

    try {
      let convertedCount = 0;

      // 1. Process homepage_sections
      const { data: sections } = await supabase.from('homepage_sections').select('*');
      if (sections) {
        for (const sec of sections) {
          let secUpdated = false;
          let draftStr = JSON.stringify(sec.draft_content || {});
          let pubStr = JSON.stringify(sec.published_content || {});

          const urlRegex = /https:\/\/[^"'\s]+\.(jpg|jpeg|png)/gi;
          const draftMatches = Array.from(draftStr.matchAll(urlRegex)).map(m => m[0]);
          const pubMatches = Array.from(pubStr.matchAll(urlRegex)).map(m => m[0]);
          const urls = Array.from(new Set([...draftMatches, ...pubMatches]));

          for (const oldUrl of urls) {
            try {
              const fileName = oldUrl.substring(oldUrl.lastIndexOf('/') + 1);
              setOptimizerLog(prev => [...prev, `Processing CMS image: ${fileName}`]);

              const res = await fetch(oldUrl);
              const blob = await res.blob();
              const { webFileName } = generateStorageFileNames(fileName, 'cms-legacy');
              const webFile = await createOptimizedWebPFile(blob, webFileName, 1400, 1400, 0.82);

              let deliveryBucket = 'products-web';
              const { error: webErr } = await supabase.storage.from('products-web').upload(webFileName, webFile);
              if (webErr) {
                deliveryBucket = 'products';
                await supabase.storage.from('products').upload(webFileName, webFile);
              }

              const { data: { publicUrl } } = supabase.storage.from(deliveryBucket).getPublicUrl(webFileName);

              draftStr = draftStr.replaceAll(oldUrl, publicUrl);
              pubStr = pubStr.replaceAll(oldUrl, publicUrl);
              secUpdated = true;
              convertedCount++;
              setOptimizerLog(prev => [...prev, `Converted -> ${webFileName}`]);
            } catch (err: any) {
              console.warn('Failed converting CMS image:', oldUrl, err);
            }
          }

          if (secUpdated) {
            await supabase.from('homepage_sections').update({
              draft_content: JSON.parse(draftStr),
              published_content: JSON.parse(pubStr),
              updated_at: new Date().toISOString(),
            }).eq('id', sec.id);
          }
        }
      }

      // 2. Process product_images
      const { data: prodImgs } = await supabase.from('product_images').select('*');
      if (prodImgs) {
        for (const imgRow of prodImgs) {
          if (imgRow.image_url && /\.(jpg|jpeg|png)/i.test(imgRow.image_url)) {
            try {
              const fileName = imgRow.image_url.substring(imgRow.image_url.lastIndexOf('/') + 1);
              setOptimizerLog(prev => [...prev, `Processing Product image: ${fileName}`]);

              const res = await fetch(imgRow.image_url);
              const blob = await res.blob();
              const { webFileName } = generateStorageFileNames(fileName, 'prod-legacy');
              const webFile = await createOptimizedWebPFile(blob, webFileName, 1400, 1400, 0.82);

              let deliveryBucket = 'products-web';
              const { error: webErr } = await supabase.storage.from('products-web').upload(webFileName, webFile);
              if (webErr) {
                deliveryBucket = 'products';
                await supabase.storage.from('products').upload(webFileName, webFile);
              }

              const { data: { publicUrl } } = supabase.storage.from(deliveryBucket).getPublicUrl(webFileName);

              await supabase.from('product_images').update({
                image_url: publicUrl
              }).eq('id', imgRow.id);

              convertedCount++;
              setOptimizerLog(prev => [...prev, `Converted Product Image -> ${webFileName}`]);
            } catch (err: any) {
              console.warn('Failed converting product image:', imgRow.image_url, err);
            }
          }
        }
      }

      setOptimizerLog(prev => [...prev, `✅ Complete! Converted ${convertedCount} legacy images to WebP.`]);
      setSuccessMsg(`Successfully converted ${convertedCount} legacy images to WebP format! Refresh your browser.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Batch optimization failed.');
    } finally {
      setRunningOptimizer(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING SECURITY CONFIGS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-border-subtle pb-6">
        <div>
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">Security Settings</span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide">Administrator Controls</h1>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-500 font-sans text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {/* Batch Image WebP Optimizer Tool */}
      <div className="border border-border-subtle bg-[#0c0c0e] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-accent" />
              Batch Legacy Image Optimizer (JPG/PNG &rarr; WebP)
            </h2>
            <p className="font-sans text-[11px] text-zinc-400 mt-1">
              Converts existing legacy JPG/PNG images in your database (homepage sections & products) into compressed, web-ready WebP files stored in Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunBatchOptimization}
            disabled={runningOptimizer}
            className="h-10 px-5 bg-accent text-black font-display text-[9px] font-extrabold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 rounded"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${runningOptimizer ? 'animate-spin' : ''}`} />
            {runningOptimizer ? 'OPTIMIZING IMAGES...' : 'RUN BATCH WEBP CONVERTER'}
          </button>
        </div>

        {optimizerLog.length > 0 && (
          <div className="p-3 border border-zinc-900 bg-black/90 font-mono text-[9px] text-zinc-400 max-h-40 overflow-y-auto space-y-1 rounded">
            {optimizerLog.map((logItem, idx) => (
              <div key={idx} className={logItem.includes('✅') ? 'text-accent font-bold' : ''}>
                {logItem}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tri-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Admin Capacity settings */}
        <div className="lg:col-span-4 border border-border-subtle bg-[#0c0c0e] p-6 space-y-6">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Admin Capacity Limit
          </h2>

          <form onSubmit={handleUpdateLimit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Maximum Administrators
              </label>
              <input
                type="number"
                min="1"
                required
                value={adminLimit}
                onChange={(e) => setAdminLimit(parseInt(e.target.value) || 1)}
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none"
              />
              <p className="font-sans text-[10px] text-zinc-500 leading-relaxed pt-1">
                Specifies the absolute count of admins authorized to login. If the count of registered admin profiles exceeds this setting, only the oldest created accounts are granted access.
              </p>
            </div>

            <button
              type="submit"
              disabled={updatingLimit}
              className="w-full h-11 bg-accent text-black font-display text-[10px] font-bold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              {updatingLimit ? 'SAVING...' : 'UPDATE LIMIT'}
            </button>
          </form>
        </div>

        {/* Column 2: Whitelisting admin email addresses */}
        <div className="lg:col-span-4 border border-border-subtle bg-[#0c0c0e] p-6 space-y-6">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent" />
            Admin Whitelist
          </h2>

          <form onSubmit={handleAddToWhitelist} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Add Whitelisted Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin-colleague@domain.com"
                  className="flex-grow h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-700 focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={addingEmail}
                  className="h-10 w-10 flex items-center justify-center border border-zinc-800 hover:border-accent text-zinc-500 hover:text-accent transition-all rounded"
                  title="Add to Whitelist"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="font-sans text-[10px] text-zinc-500 leading-relaxed pt-1">
                Whitelisted emails are automatically upgraded to admins upon customer sign-up (if the admin limit permits).
              </p>
            </div>
          </form>

          {/* Whitelisted emails list */}
          <div className="space-y-2 pt-2 border-t border-zinc-900">
            <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500 block mb-2">
              Whitelisted Emails ({whitelist.length})
            </span>
            {whitelist.length === 0 ? (
              <span className="font-display text-[9px] text-zinc-700 uppercase tracking-widest block py-4 text-center">
                Whitelist empty
              </span>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-sans text-xs">
                {whitelist.map((item) => (
                  <div key={item.id} className="p-2.5 border border-zinc-900 bg-background flex items-center justify-between text-xs transition-colors">
                    <span className="text-foreground truncate max-w-[80%] font-medium">{item.email}</span>
                    <button
                      onClick={() => handleRemoveFromWhitelist(item.id)}
                      className="text-zinc-600 hover:text-red-500 transition-colors"
                      title="Remove from Whitelist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Current active admin accounts logs */}
        <div className="lg:col-span-4 border border-border-subtle bg-[#0c0c0e] p-6 space-y-6">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            Registered Admins ({activeAdmins.length})
          </h2>

          <div className="space-y-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {activeAdmins.map((adm, idx) => {
                const isWithinLimit = idx < adminLimit;
                return (
                  <div key={adm.id} className={`p-3 border flex flex-col space-y-1 ${
                    isWithinLimit ? 'border-zinc-900 bg-background' : 'border-red-500/20 bg-red-500/5'
                  }`}>
                    <div className="flex items-center justify-between min-w-0">
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground truncate max-w-[80%]">
                        {adm.name || 'Admin User'}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-600">#{idx + 1}</span>
                    </div>
                    <span className="font-sans text-[11px] text-muted block truncate">{adm.email}</span>
                    
                    {!isWithinLimit && (
                      <span className="text-[8px] font-display font-semibold uppercase tracking-wider text-red-500 flex items-center gap-1 mt-1">
                        <ShieldAlert className="h-3 w-3" />
                        ACCESS BLOCKED (LIMIT EXCEEDED)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-3 border border-zinc-900 bg-[#060606] font-sans text-[10px] text-zinc-500 leading-relaxed">
              <span className="font-display text-[9px] uppercase tracking-widest text-accent font-bold block mb-1">
                SYSTEM SEED ROOT
              </span>
              The email <strong className="text-foreground">rishabhagarwal.me@gmail.com</strong> is hardcoded as a fallback whitelisted administrator.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
