'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Save, Globe, Eye, Plus, ArrowUp, ArrowDown, Trash2, Copy, 
  EyeOff, RotateCcw, RotateCw, Monitor, Tablet, Phone, 
  Upload, CheckCircle, AlertTriangle, HelpCircle 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import InlineText from '@/components/admin/InlineText';
import ImageDropzone from '@/components/admin/ImageDropzone';

// --- PREDEFINED ELEMENTOR BLUEPRINT CONFIGURATIONS ---
const PREDEFINED_SECTIONS: Record<string, { type: string; draft_content: any }> = {
  banner: {
    type: 'banner',
    draft_content: {
      heading: 'SUMMER CAMPAIGN 2026',
      description: 'Collaborate with Dollysticart to paint custom textured artwork for luxury living.',
      cta_text: 'EXPLORE SHOP',
      cta_link: '/shop',
      image_url: '',
      ratio: 'aspect-[2/1]',
      label: 'CAMPAIGN COVER'
    }
  },
  text: {
    type: 'text',
    draft_content: {
      heading: 'LATEST ANNOUNCEMENT',
      body: 'Our collection is now shipping worldwide with premium archival crates.',
      align: 'text-center',
      typography: 'font-georgia italic text-lg'
    }
  },
  product: {
    type: 'product',
    draft_content: {
      product_slug: '',
      heading: 'FEATURED ORIGINAL WORK',
      description: 'Hand-crafted impasto palette acrylic canvas.',
      cta_text: 'VIEW ITEM',
      image_url: '',
      label: 'ORIGINAL WORK'
    }
  },
  product_grid: {
    type: 'product_grid',
    draft_content: {
      heading: 'COLLECTION RELEASES',
      columns: 4,
      limit: 4,
      product_slugs: ''
    }
  },
  image: {
    type: 'image',
    draft_content: {
      image_url: '',
      ratio: 'aspect-[16/9]',
      caption: 'Studio layout visual study.'
    }
  },
  video: {
    type: 'video',
    draft_content: {
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      ratio: 'aspect-[16/9]',
      autoplay: false
    }
  },
  promo_banner: {
    type: 'promo_banner',
    draft_content: {
      heading: 'LIMITED EDITION RELEASES',
      promo_code: 'DOLLYSTICART10',
      discount: '10% OFF ON FINE PRINTS',
      cta_text: 'APPLY OFFER',
      cta_link: '/shop',
      image_url: ''
    }
  },
  featured_products: {
    type: 'featured_products',
    draft_content: {
      heading: 'NEW SEASON CAMPAIGN',
      description: 'Curate your latest release products directly next to this banner in a 4-card grid.',
      cta_text: 'SHOP NOW',
      cta_link: '/shop',
      label: 'FEATURED CAMPAIGN',
      image_url: ''
    }
  },
  featured_content: {
    type: 'featured_content',
    draft_content: {
      heading: 'BEHIND THE CANVAS',
      body: 'Dollysticart combines heavy-body textures and palette techniques to create tactile dimension.',
      cta_text: 'READ THE STORY',
      cta_link: '/about',
      image_url: ''
    }
  },
  collection: {
    type: 'collection',
    draft_content: {
      title: 'THE CORE EDITORIALS',
      items: [
        { heading: 'IMPASTO TEXTURES', image_url: '', cta_link: '/shop/original-art', ratio: 'aspect-[5/7]', label: 'ORIGINAL WORKS' },
        { heading: 'GALLERY PRINTS', image_url: '', cta_link: '/shop/art-prints', ratio: 'aspect-[5/7]', label: 'FINE ART PRINTS' }
      ]
    }
  },
  announcement: {
    type: 'announcement',
    draft_content: {
      text: 'FREE SHIPPING ON ORDERS OVER ₹5,000 | WORLDWIDE EXPRESS',
      bg_color: 'bg-accent',
      text_color: 'text-black'
    }
  },
  cta: {
    type: 'cta',
    draft_content: {
      heading: 'Ready to bring texture to your home?',
      button_text: 'BOOK FREE CONSULTATION',
      cta_link: '/customize-art'
    }
  },
  spacer: {
    type: 'spacer',
    draft_content: {
      height: 'h-12'
    }
  },
  custom_section: {
    type: 'custom_section',
    draft_content: {
      html: '<div class="text-center p-8 bg-zinc-950 rounded border border-zinc-900"><p class="text-accent text-[9px] uppercase tracking-widest font-bold">CUSTOM RAW HTML CONTAINER</p></div>'
    }
  },
  product_swiper: {
    type: 'product_swiper',
    draft_content: {
      heading: 'LATEST RELEASES',
      limit: 10
    }
  }
};

// --- MAIN VISUAL EDITOR COMPONENT ---
export default function ElementorHomepageEditor() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Elementor Component Selector & Deletion tracking states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerInsertIndex, setPickerInsertIndex] = useState<number>(0);
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);

  // Active user session debug state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Undo/Redo/Version history stacks
  const [history, setHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyTimestamps, setHistoryTimestamps] = useState<string[]>([]);
  
  // Autosave and update states
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // UI Modes & Viewports
  const [editMode, setEditMode] = useState<boolean>(true);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const [publishing, setPublishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();

  // Load initial sections data
  const loadSections = async () => {
    setLoading(true);
    try {
      // 1. Query client session securely using getUser()
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        // Query database role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) {
          setCurrentUserRole(profile.role);
        }
      }

      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      const initialSections = data || [];
      
      // Fallback default seeds if database sections are unconfigured
      const sectionsToUse = initialSections.length > 0 ? initialSections : [
        {
          id: 'sec-hero-1',
          type: 'banner',
          is_visible: true,
          sort_order: 0,
          draft_content: {
            heading: 'TEXTURE & DIMENSION',
            description: 'Original textured impasto acrylics and premium framed prints, crafted for modern luxury living.',
            cta_text: 'EXPLORE SHOP',
            cta_link: '/shop',
            ratio: 'aspect-[2/1]',
            label: 'HERO CAMPAIGN 01',
            image_url: ''
          }
        },
        {
          id: 'sec-collection-1',
          type: 'collection',
          is_visible: true,
          sort_order: 1,
          draft_content: {
            title: 'THE CORE EDITORIALS',
            items: [
              { heading: 'ORIGINAL TEXTURES', cta_link: '/shop/original-art', ratio: 'aspect-[5/7]', label: 'IMPASTO CANVAS', image_url: '' },
              { heading: 'GALLERY PRINTS', cta_link: '/shop/art-prints', ratio: 'aspect-[5/7]', label: 'ARCHIVAL PRINTS', image_url: '' },
              { heading: 'STUDIO DESIGNS', cta_link: '/shop/art-products/stationery', ratio: 'aspect-[5/7]', label: 'CALENDARS', image_url: '' },
              { heading: 'COLLECTIBLES', cta_link: '/shop/art-products/bookmarks', ratio: 'aspect-[5/7]', label: 'MAGNETS & MORE', image_url: '' }
            ]
          }
        },
        {
          id: 'sec-swiper-1',
          type: 'product_swiper',
          is_visible: true,
          sort_order: 2,
          draft_content: {
            heading: 'LATEST RELEASES',
            limit: 10
          }
        },
        {
          id: 'sec-hero-2',
          type: 'banner',
          is_visible: true,
          sort_order: 3,
          draft_content: {
            heading: 'BESPOKE ART COMMISSIONS',
            description: 'Collaborate with Dollysticart to paint a custom textured artwork designed uniquely to match your home\'s layout, color scheme, and specific canvas dimensions.',
            cta_text: 'REQUEST COMMISSION',
            cta_link: '/customize-art',
            ratio: 'aspect-[2/1]',
            label: 'HERO CAMPAIGN 02',
            image_url: ''
          }
        }
      ];

      setSections(sectionsToUse);
      // Initialize History Stack with raw copy
      const copy = JSON.parse(JSON.stringify(sectionsToUse));
      setHistory([copy]);
      setHistoryIndex(0);
      setHistoryTimestamps([new Date().toLocaleTimeString()]);
    } catch (e) {
      console.error('Error fetching homepage sections:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();

    // Listen for auth state changes on client side and check securely
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) {
          setCurrentUserRole(profile.role);
        }
      } else {
        setCurrentUser(null);
        setCurrentUserRole('');
      }
    });


    return () => {
      subscription.unsubscribe();
    };
  }, []);


  // Update editor state and record in undo history stack
  const updateSectionsState = (newSections: any[], label: string = 'Action') => {
    setSections(newSections);
    setIsDirty(true);
    setSaveStatus('unsaved');

    // Chop off future history if we were in middle of Undo stack
    const updatedHistory = history.slice(0, historyIndex + 1);
    const stateCopy = JSON.parse(JSON.stringify(newSections));
    
    setHistory([...updatedHistory, stateCopy]);
    setHistoryIndex(updatedHistory.length);
    setHistoryTimestamps([...historyTimestamps.slice(0, historyIndex + 1), `${label} (${new Date().toLocaleTimeString()})`]);
  };

  // --- ACTION: UNDO ---
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setSections(JSON.parse(JSON.stringify(history[prevIdx])));
      setIsDirty(true);
      setSaveStatus('unsaved');
    }
  };

  // --- ACTION: REDO ---
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setSections(JSON.parse(JSON.stringify(history[nextIdx])));
      setIsDirty(true);
      setSaveStatus('unsaved');
    }
  };

  // --- ACTION: ROLLBACK TO HISTORICAL SNAPSHOT ---
  const handleRollback = (idx: number) => {
    setHistoryIndex(idx);
    setSections(JSON.parse(JSON.stringify(history[idx])));
    setIsDirty(true);
    setSaveStatus('unsaved');
  };

  // --- SECTION CONTROL: REORDER UP ---
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const items = [...sections];
    const temp = items[idx];
    items[idx] = items[idx - 1];
    items[idx - 1] = temp;
    
    // Recalculate sort_order
    items.forEach((item, index) => {
      item.sort_order = index;
    });
    updateSectionsState(items, 'Reorder Up');
  };

  // --- SECTION CONTROL: REORDER DOWN ---
  const moveDown = (idx: number) => {
    if (idx === sections.length - 1) return;
    const items = [...sections];
    const temp = items[idx];
    items[idx] = items[idx + 1];
    items[idx + 1] = temp;
    
    // Recalculate sort_order
    items.forEach((item, index) => {
      item.sort_order = index;
    });
    updateSectionsState(items, 'Reorder Down');
  };

  // --- SECTION CONTROL: DUPLICATE ---
  const duplicateSection = (idx: number) => {
    const original = sections[idx];
    const clone = {
      ...JSON.parse(JSON.stringify(original)),
      id: `clone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sort_order: idx + 1
    };

    const items = [...sections];
    items.splice(idx + 1, 0, clone);
    
    // Fix sort order indexes
    items.forEach((item, index) => {
      item.sort_order = index;
    });
    
    updateSectionsState(items, 'Duplicate Section');
  };

  // --- SECTION CONTROL: DELETE ---
  const deleteSection = (idx: number) => {
    if (!confirm('Are you sure you want to remove this homepage section?')) return;
    const target = sections[idx];
    
    // Add real database UUIDs to the deletion buffer
    if (target.id && !target.id.startsWith('sec-') && !target.id.startsWith('new-') && !target.id.startsWith('clone-')) {
      setDeletedSectionIds(prev => [...prev, target.id]);
    }

    const items = sections.filter((_, i) => i !== idx);
    items.forEach((item, index) => {
      item.sort_order = index;
    });
    updateSectionsState(items, 'Delete Section');
  };

  // --- SECTION CONTROL: TOGGLE VISIBILITY ---
  const toggleVisibility = (idx: number) => {
    const items = [...sections];
    items[idx].is_visible = !items[idx].is_visible;
    updateSectionsState(items, `Toggle Visibility`);
  };

  // --- CANVAS CONTROLS: ADD NEW SECTION ---
  const addNewSection = (type: string, index: number) => {
    const blueprint = PREDEFINED_SECTIONS[type];
    if (!blueprint) return;

    const newSec = {
      id: `new-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: blueprint.type,
      is_visible: true,
      sort_order: index,
      draft_content: JSON.parse(JSON.stringify(blueprint.draft_content)),
      published_content: {}
    };

    const items = [...sections];
    items.splice(index, 0, newSec);
    items.forEach((item, index) => {
      item.sort_order = index;
    });

    updateSectionsState(items, `Add Section (${type})`);
  };  // --- DRAFT MUTATIONS IN CANVAS ---
  const updateSectionDraft = (sectionId: string, updatedDraft: any) => {
    const items = sections.map(item => {
      if (item.id === sectionId) {
        return { ...item, draft_content: updatedDraft };
      }
      return item;
    });
    updateSectionsState(items, 'Modify Section Content');
  };

  // --- API ROUTINES: SAVE CURRENT DRAFT TO DATABASE ---
  const handleSaveDraft = async () => {
    setSubmitting(true);
    setSaveStatus('saving');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Client-side authentication and role check before hit Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You are not logged in. Please sign in on the Account page to save layout drafts.');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        throw new Error(`Your database profile role is "${profile?.role || 'customer'}". You must be promoted to "admin" to save layout drafts.`);
      }

      // 2. Perform DELETE operations for removed database records
      if (deletedSectionIds.length > 0) {
        const { error: deleteErr } = await supabase
          .from('homepage_sections')
          .delete()
          .in('id', deletedSectionIds);
        if (deleteErr) throw deleteErr;
      }

      // 3. Loop and execute explicit INSERT or UPDATE operations
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        const isNew = !section.id || section.id.startsWith('sec-') || section.id.startsWith('new-') || section.id.startsWith('clone-');
        
        const payload: any = {
          type: section.type,
          sort_order: index,
          is_visible: section.is_visible,
          draft_content: section.draft_content,
          updated_at: new Date().toISOString()
        };

        if (isNew) {
          // INSERT new record (let database generate UUID)
          const { error: insertErr } = await supabase
            .from('homepage_sections')
            .insert({
              type: section.type,
              sort_order: index,
              is_visible: section.is_visible,
              draft_content: section.draft_content,
              published_content: section.published_content || {}
            });
          if (insertErr) throw insertErr;
        } else {
          // UPDATE existing record in-place by ID (preserves created_at)
          const { error: updateErr } = await supabase
            .from('homepage_sections')
            .update(payload)
            .eq('id', section.id);
          if (updateErr) throw updateErr;
        }
      }

      // 4. Reload from database to synchronize the IDs and clean states
      const { data, error: reloadError } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (reloadError) throw reloadError;

      setSections(data || []);
      setDeletedSectionIds([]); // clear delete tracker

      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString());
      setSuccessMsg('All canvas section drafts saved successfully.');
      setIsDirty(false);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('unsaved');
      setErrorMsg(err.message || 'Failed to save layout configurations.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- API ROUTINES: PUBLISH ALL DRAFTS TO LIVE STORE ---
  const handlePublishLive = async () => {
    if (!confirm('Are you sure you want to publish the draft homepage live? This will instantly overwrite the public storefront catalog layout.')) {
      return;
    }
    setPublishing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Client-side authentication and role check before hit Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You are not logged in. Please sign in on the Account page to save layout drafts.');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        throw new Error(`Your database profile role is "${profile?.role || 'customer'}". You must be promoted to "admin" to save layout drafts.`);
      }

      // 2. Clear deleted ones first
      if (deletedSectionIds.length > 0) {
        const { error: deleteErr } = await supabase
          .from('homepage_sections')
          .delete()
          .in('id', deletedSectionIds);
        if (deleteErr) throw deleteErr;
      }

      // 3. Write drafts and publish them
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        const isNew = !section.id || section.id.startsWith('sec-') || section.id.startsWith('new-') || section.id.startsWith('clone-');
        
        const payload: any = {
          type: section.type,
          sort_order: index,
          is_visible: section.is_visible,
          draft_content: section.draft_content,
          published_content: section.draft_content, // copy draft directly to live
          updated_at: new Date().toISOString()
        };

        if (isNew) {
          const { error: insertErr } = await supabase
            .from('homepage_sections')
            .insert(payload);
          if (insertErr) throw insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('homepage_sections')
            .update(payload)
            .eq('id', section.id);
          if (updateErr) throw updateErr;
        }
      }

      // 4. Reload clean list
      const { data, error: reloadError } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (reloadError) throw reloadError;

      setSections(data || []);
      setDeletedSectionIds([]); // clear delete tracker

      const copy = JSON.parse(JSON.stringify(data || []));
      updateSectionsState(copy, 'Publish Live');

      setSuccessMsg('Congratulations! Homepage published live successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Publish operations failed.');
    } finally {
      setPublishing(false);
    }
  };

  // --- AUTOSAVE PROCESS TIMER ---
  useEffect(() => {
    if (!isDirty || saveStatus !== 'unsaved') return;

    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 15000); // Trigger autosave after 15s of idle/dirty changes

    return () => clearTimeout(timer);
  }, [isDirty, sections]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <span className="font-display text-xs tracking-widest text-muted uppercase animate-pulse">
          INITIALIZING ELEMENTOR INTERACTIVE LAYER...
        </span>
      </div>
    );
  }

  // Viewport framing metrics
  let canvasFrameWidth = 'w-full';
  let canvasOuterWrapper = '';
  
  if (viewport === 'tablet') {
    canvasFrameWidth = 'max-w-[768px]';
    canvasOuterWrapper = 'border-x border-y border-zinc-900 rounded-lg p-2 bg-[#060606] shadow-2xl transition-all duration-300';
  } else if (viewport === 'mobile') {
    canvasFrameWidth = 'max-w-[375px]';
    canvasOuterWrapper = 'border-[12px] border-zinc-800 rounded-[2.5rem] p-3 bg-[#060606] shadow-2xl relative transition-all duration-300 min-h-[700px]';
  }

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-300 min-h-screen pb-20">
      
      {/* 1. TOP CONTROL BAR (WordPress / Elementor Layout style) */}
      <div className="sticky top-[74px] z-40 bg-[#0c0c0e] border border-zinc-900 px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 rounded">
        
        {/* Left Side: Modes & Indicators */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex border border-zinc-800 rounded p-0.5">
            <button
              onClick={() => setEditMode(true)}
              className={`px-3 py-1 font-display text-[9px] uppercase tracking-wider font-bold transition-all rounded ${
                editMode ? 'bg-accent text-black' : 'text-zinc-400 hover:text-foreground'
              }`}
            >
              EDIT MODE
            </button>
            <button
              onClick={() => setEditMode(false)}
              className={`px-3 py-1 font-display text-[9px] uppercase tracking-wider font-bold transition-all rounded ${
                !editMode ? 'bg-accent text-black' : 'text-zinc-400 hover:text-foreground'
              }`}
            >
              PREVIEW MODE
            </button>
          </div>

          {/* Viewport switch controls */}
          {editMode && (
            <div className="flex items-center gap-1 bg-[#121214] border border-zinc-800 p-0.5 rounded">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1.5 rounded transition-all ${viewport === 'desktop' ? 'text-accent bg-background' : 'text-zinc-500 hover:text-foreground'}`}
                title="Desktop View"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`p-1.5 rounded transition-all ${viewport === 'tablet' ? 'text-accent bg-background' : 'text-zinc-500 hover:text-foreground'}`}
                title="Tablet View"
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1.5 rounded transition-all ${viewport === 'mobile' ? 'text-accent bg-background' : 'text-zinc-500 hover:text-foreground'}`}
                title="Mobile View"
              >
                <Phone className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Undo/Redo tools */}
          {editMode && (
            <div className="flex items-center gap-1 bg-[#121214] border border-zinc-800 p-0.5 rounded">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded text-zinc-500 hover:text-foreground disabled:opacity-30 transition-all"
                title="Undo"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded text-zinc-500 hover:text-foreground disabled:opacity-30 transition-all"
                title="Redo"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Version Logs Checkpoints Dropdown */}
          {editMode && history.length > 1 && (
            <div className="relative">
              <select
                value={historyIndex}
                onChange={(e) => handleRollback(parseInt(e.target.value))}
                className="h-8 bg-[#121214] border border-zinc-800 px-2 rounded font-display text-[9px] tracking-wider uppercase text-foreground focus:outline-none focus:border-accent"
              >
                {historyTimestamps.map((t, idx) => (
                  <option key={idx} value={idx}>
                    {idx === historyIndex ? `• ${t}` : t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Status indicators and Actions */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                saveStatus === 'saved' ? 'bg-green-400' : saveStatus === 'saving' ? 'bg-amber-400' : 'bg-red-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                saveStatus === 'saved' ? 'bg-green-500' : saveStatus === 'saving' ? 'bg-amber-500' : 'bg-red-500'
              }`}></span>
            </span>
            <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
              {saveStatus === 'saved' ? (
                `DRAFT SAVED ${lastSavedTime ? `@ ${lastSavedTime}` : ''}`
              ) : saveStatus === 'saving' ? (
                'AUTOSAVING DRAFT...'
              ) : (
                'UNSAVED CHANGES (AUTOSAVE IN 15S)'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveDraft}
              disabled={submitting}
              className="h-9 px-3 border border-zinc-800 hover:border-accent text-zinc-400 hover:text-accent font-display text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              SAVE DRAFT
            </button>
            <button
              onClick={handlePublishLive}
              disabled={publishing}
              className="h-9 px-3 bg-accent text-black font-display text-[9px] font-bold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Globe className="h-3.5 w-3.5" />
              PUBLISH LIVE
            </button>
          </div>
        </div>

      </div>

      {/* Notifications overlays */}
      {currentUserRole !== 'admin' && (
        <div className="p-3.5 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs flex items-start gap-2.5 rounded">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong className="uppercase font-bold block mb-1">Row-Level Security Role Block</strong>
            You are logged in as <span className="underline font-semibold">{currentUser?.email || 'Guest'}</span> but your database role is <strong className="uppercase">"{currentUserRole || 'customer'}"</strong>.
            <p className="mt-1 text-zinc-500 leading-relaxed">
              To write to database tables or save drafts, run the update SQL scripts in your Supabase SQL Editor and make sure to Sign Out & Sign In again to refresh your session credentials.
            </p>
          </div>
        </div>
      )}
      
      {successMsg && (
        <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-500 font-sans text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
          {errorMsg}
        </div>
      )}

      {/* Quick Visual Editor Help Alert */}
      {editMode && (
        <div className="p-3 bg-[#0c0c0e] border border-zinc-900 rounded flex gap-2.5 items-start text-zinc-500 text-[10px] leading-relaxed">
          <HelpCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p>
            <strong className="text-foreground uppercase tracking-wider text-[9px]">How to Edit Visually:</strong> Click directly on any text element to edit headings, descriptions, and CTA links inline. Hover over any image placeholder to drop a new file or click to select an image from your device. Hover sections to reorder, duplicate, show/hide, or delete them directly.
          </p>
        </div>
      )}

      {/* 2. THE VISUAL EDITOR CANVAS FRAME WRAPPER */}
      <div className="w-full flex justify-center py-4 bg-background-subtle rounded border border-zinc-900 min-h-[600px] overflow-x-auto">
        
        <div className={`${canvasOuterWrapper} ${canvasFrameWidth} transition-all duration-300 relative`}>
          
          {/* Mobile phone notch decorative indicator */}
          {viewport === 'mobile' && editMode && (
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-800 rounded-full z-50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
            </div>
          )}

          {/* CANVAS CONTENT AREA */}
          <div className="w-full flex flex-col space-y-0 relative">
            
            {/* Top Empty State Anchor insert trigger */}
            {editMode && sections.length === 0 && (
              <div className="py-12 border-2 border-dashed border-zinc-800 rounded flex flex-col items-center justify-center space-y-3 bg-[#0c0c0e]">
                <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                  Easel is empty
                </span>
                <button
                  onClick={() => {
                    setPickerInsertIndex(0);
                    setIsPickerOpen(true);
                  }}
                  className="px-4 py-2 bg-accent text-black border border-accent hover:bg-transparent hover:text-accent text-[9px] font-display uppercase tracking-widest font-bold rounded transition-colors"
                >
                  + Add Section Component
                </button>
              </div>
            )}

            {/* Loop through sections */}
            {sections.map((section, idx) => {
              const content = section.draft_content || {};
              const isSectionVisible = section.is_visible;

              return (
                <div 
                  key={section.id} 
                  className={`relative group/section transition-all ${
                    editMode ? 'border border-transparent hover:border-accent/40' : ''
                  }`}
                >
                  
                  {/* --- EDIT MODE SECTION TOOLBAR OVERLAY --- */}
                  {editMode && (
                    <div className="absolute -top-3 left-4 z-30 hidden group-hover/section:flex items-center gap-1.5 bg-[#0c0c0e] border border-accent/40 px-2 py-0.5 rounded shadow-lg text-[9px]">
                      <span className="font-mono text-zinc-500 uppercase font-semibold text-[8px] mr-1.5">
                        #{idx + 1} &bull; {section.type}
                      </span>
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 hover:text-accent disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === sections.length - 1}
                        className="p-1 hover:text-accent disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => toggleVisibility(idx)}
                        className={`p-1 transition-colors ${isSectionVisible ? 'hover:text-amber-500 text-zinc-400' : 'text-amber-500'}`}
                        title={isSectionVisible ? 'Hide Section' : 'Show Section'}
                      >
                        {isSectionVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => duplicateSection(idx)}
                        className="p-1 hover:text-accent text-zinc-400 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSection(idx)}
                        className="p-1 hover:text-red-500 text-zinc-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Hidden Overlay stripes indicator */}
                  {!isSectionVisible && editMode && (
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#121214,#121214_10px,#0c0c0e_10px,#0c0c0e_20px)] opacity-50 pointer-events-none z-10 border border-amber-500/20" />
                  )}

                  {/* SECTION CANVAS RENDER CORES */}
                  <div className={`transition-all ${!isSectionVisible && !editMode ? 'hidden' : ''} ${!isSectionVisible && editMode ? 'opacity-40' : ''}`}>
                    
                    {/* TYPE 1: CAMPAIGN HERO BANNER */}
                    {(section.type === 'hero' || section.type === 'banner') && (
                      <div className="w-full py-0">
                        <div className="relative w-full overflow-hidden">
                          
                          {/* Image Dropzone Layer */}
                          {editMode ? (
                            <ImageDropzone
                              imageUrl={content.image_url}
                              ratioClass={content.ratio || 'aspect-[2/1]'}
                              label={content.label || 'CAMPAIGN COVER'}
                              onUploadSuccess={(url) => {
                                const newDraft = { ...content, image_url: url };
                                updateSectionDraft(section.id, newDraft);
                              }}
                            />
                          ) : (
                            content.image_url ? (
                              <div className={`w-full ${content.ratio || 'aspect-[2/1]'} relative`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={content.image_url} 
                                  alt={content.heading} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            ) : (
                              <div className={`w-full ${content.ratio || 'aspect-[2/1]'} bg-[#0c0c0e] flex items-center justify-center border border-zinc-900`}>
                                <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500">{content.label || 'HERO BANNER'}</span>
                              </div>
                            )
                          )}

                          {/* Centered Campaign Content details */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent flex flex-col justify-end items-center text-center p-8 sm:p-12 md:p-16 space-y-3 sm:space-y-4">
                            <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-[0.15em] text-foreground max-w-3xl leading-none">
                              {editMode ? (
                                <InlineText
                                  value={content.heading || 'HERO HEADING'}
                                  onChange={(val) => {
                                    updateSectionDraft(section.id, { ...content, heading: val });
                                  }}
                                />
                              ) : (
                                content.heading
                              )}
                            </h2>

                            <p className="font-sans text-[10px] sm:text-xs text-foreground/80 max-w-md tracking-wider leading-relaxed">
                              {editMode ? (
                                <InlineText
                                  value={content.description || 'Campaign description details...'}
                                  type="textarea"
                                  onChange={(val) => {
                                    updateSectionDraft(section.id, { ...content, description: val });
                                  }}
                                />
                              ) : (
                                content.description
                              )}
                            </p>

                            <div className="flex items-center gap-3">
                              <span className="btn-kith-outline mt-2 opacity-50 select-none">
                                {content.cta_text || 'DISCOVER'}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* TYPE 2: LOOKBOOK SECTIONS & COLLECTIONS */}
                    {(section.type === 'lookbook' || section.type === 'collection') && (
                      <div className="w-full py-12 md:py-16">
                        {editMode && (
                          <div className="text-center mb-4">
                            <span className="font-display text-[8px] uppercase tracking-widest text-zinc-500">COLLECTION TITLE: </span>
                            <InlineText
                              value={section.title || content.title || 'THE CAMPAIGN GRID'}
                              onChange={(val) => {
                                const items = sections.map(item => item.id === section.id ? { ...item, title: val } : item);
                                updateSectionsState(items, 'Collection Title Edit');
                              }}
                              className="font-display text-[9px] font-bold text-accent uppercase tracking-[0.2em]"
                            />
                          </div>
                        )}

                        {!editMode && (section.title || content.title) && (
                          <h3 className="font-display text-[10px] font-extrabold uppercase tracking-[0.25em] text-foreground/55 mb-6 md:mb-8 text-center">
                            {section.title || content.title}
                          </h3>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(content.items || []).map((item: any, itemIdx: number) => (
                            <div key={itemIdx} className="group relative overflow-hidden flex flex-col space-y-2">
                              
                              {/* Image upload area */}
                              {editMode ? (
                                <ImageDropzone
                                  imageUrl={item.image_url}
                                  ratioClass={item.ratio || 'aspect-[5/7]'}
                                  label={item.label || `Card ${itemIdx+1}`}
                                  onUploadSuccess={(url) => {
                                    const updatedItems = [...content.items];
                                    updatedItems[itemIdx] = { ...item, image_url: url };
                                    updateSectionDraft(section.id, { ...content, items: updatedItems });
                                  }}
                                />
                              ) : (
                                item.image_url ? (
                                  <div className="w-full aspect-[5/7] relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                      src={item.image_url} 
                                      alt={item.heading} 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full aspect-[5/7] bg-[#0c0c0e] flex items-center justify-center border border-zinc-900">
                                    <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500">{item.label || 'CARD'}</span>
                                  </div>
                                )
                              )}

                              {/* Overlaid Title and CTA inputs */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/0 to-transparent flex flex-col justify-end items-center p-4 pb-6 text-center">
                                <h4 className="font-display text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground mb-1">
                                  {editMode ? (
                                    <InlineText
                                      value={item.heading || 'ITEM TITLE'}
                                      onChange={(val) => {
                                        const updatedItems = [...content.items];
                                        updatedItems[itemIdx] = { ...item, heading: val };
                                        updateSectionDraft(section.id, { ...content, items: updatedItems });
                                      }}
                                    />
                                  ) : (
                                    item.heading
                                  )}
                                </h4>

                              </div>

                            </div>
                          ))}
                        </div>

                      </div>
                    )}

                    {/* TYPE 3: FEATURED PRODUCTS SECTION */}
                    {section.type === 'featured_products' && (
                      <div className="w-full py-12 md:py-16">
                        <div className="flex flex-col lg:flex-row gap-6">
                          
                          {/* Left Side: Campaign Banner */}
                          <div className="w-full lg:w-1/3 relative overflow-hidden group min-h-[350px]">
                            {editMode ? (
                              <ImageDropzone
                                imageUrl={content.image_url}
                                ratioClass="aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[400px]"
                                label={content.label || 'FEATURED COLLECTION'}
                                onUploadSuccess={(url) => {
                                  updateSectionDraft(section.id, { ...content, image_url: url });
                                }}
                              />
                            ) : (
                              content.image_url ? (
                                <div className="w-full lg:h-full lg:min-h-[400px] relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={content.image_url} 
                                    alt={content.heading} 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                              ) : (
                                <div className="w-full aspect-[4/5] bg-[#0c0c0e] flex items-center justify-center border border-zinc-900">
                                  <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500">{content.label || 'FEATURED COLLECTION'}</span>
                                </div>
                              )
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent flex flex-col justify-end p-6 space-y-2 pointer-events-none">
                              <h4 className="font-display text-[13px] font-bold uppercase tracking-wider text-foreground pointer-events-auto">
                                {editMode ? (
                                  <InlineText
                                    value={content.heading || 'FEATURED COLLECTION'}
                                    onChange={(val) => {
                                      updateSectionDraft(section.id, { ...content, heading: val });
                                    }}
                                  />
                                ) : (
                                  content.heading
                                )}
                              </h4>
                              <p className="font-sans text-[10px] text-zinc-300 tracking-wider pointer-events-auto">
                                {editMode ? (
                                  <InlineText
                                    value={content.description || 'Explore the curated selection.'}
                                    type="textarea"
                                    onChange={(val) => {
                                      updateSectionDraft(section.id, { ...content, description: val });
                                    }}
                                  />
                                ) : (
                                  content.description
                                )}
                              </p>
                              
                            </div>
                          </div>
                          
                          {/* Right Side: 4 Mock Cards Grid */}
                          <div className="w-full lg:w-2/3 grid grid-cols-2 gap-4 opacity-75 animate-pulse">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="flex flex-col space-y-3 border border-zinc-900 bg-[#060607] p-3 select-none">
                                <div className="relative aspect-[4/5] w-full bg-[#0c0c0e] flex items-center justify-center">
                                  <span className="font-display text-[9px] tracking-wider text-zinc-700 uppercase">MOCK PRODUCT {i}</span>
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">ART CATEGORY</span>
                                  <h4 className="font-display text-[10px] tracking-wider text-zinc-400 font-semibold truncate">Featured Product Item Name</h4>
                                  <span className="font-mono text-[9px] text-zinc-500">₹1,999</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TYPE 4: TEXT SECTION */}
                    {section.type === 'text' && (
                      <div className={`w-full py-12 px-6 text-center border-y border-zinc-900/50 bg-zinc-950/20`}>
                        <h3 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-accent mb-2">
                          {editMode ? (
                            <InlineText
                              value={content.heading || 'LATEST RELEASE ANNOUNCEMENT'}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, heading: val })}
                            />
                          ) : (
                            content.heading
                          )}
                        </h3>
                        <p className="font-sans text-xs text-zinc-400 max-w-2xl mx-auto leading-relaxed tracking-wide">
                          {editMode ? (
                            <InlineText
                              value={content.body || 'Configure your text block content here...'}
                              type="textarea"
                              onChange={(val) => updateSectionDraft(section.id, { ...content, body: val })}
                            />
                          ) : (
                            content.body
                          )}
                        </p>
                      </div>
                    )}

                    {/* TYPE 5: SINGLE PRODUCT BANNER */}
                    {section.type === 'product' && (
                      <div className="w-full py-12 flex justify-center">
                        <div className="w-full max-w-[450px] border border-zinc-900 bg-[#060607] p-4 flex flex-col space-y-4">
                          {editMode ? (
                            <ImageDropzone
                              imageUrl={content.image_url}
                              ratioClass="aspect-[4/5]"
                              label={content.label || 'PRODUCT CARD COVER'}
                              onUploadSuccess={(url) => updateSectionDraft(section.id, { ...content, image_url: url })}
                            />
                          ) : (
                            content.image_url && (
                              <div className="w-full aspect-[4/5] relative">
                                <img src={content.image_url} alt={content.heading} className="w-full h-full object-cover" />
                              </div>
                            )
                          )}
                          <div className="flex flex-col space-y-1">
                            <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">FEATURED PRODUCT EDITION</span>
                            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                              {editMode ? (
                                <InlineText
                                  value={content.heading || 'ORIGINAL TEXTURED IMPASTO'}
                                  onChange={(val) => updateSectionDraft(section.id, { ...content, heading: val })}
                                />
                              ) : (
                                content.heading
                              )}
                            </h4>
                            <p className="font-sans text-[10px] text-zinc-400">
                              {editMode ? (
                                <InlineText
                                  value={content.description || 'Impasto heavy acrylic palette work.'}
                                  onChange={(val) => updateSectionDraft(section.id, { ...content, description: val })}
                                />
                              ) : (
                                content.description
                              )}
                            </p>
                            {editMode && (
                              <div className="mt-2 text-[8px] bg-black/60 p-2 rounded border border-zinc-900 flex flex-col space-y-1">
                                <span className="text-zinc-500">PRODUCT SLUG/LINK:</span>
                                <InlineText
                                  value={content.product_slug || ''}
                                  onChange={(val) => updateSectionDraft(section.id, { ...content, product_slug: val })}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TYPE 6: PRODUCT GRID CATALOG */}
                    {section.type === 'product_grid' && (
                      <div className="w-full py-12 text-center">
                        <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground/75 mb-6">
                          {editMode ? (
                            <InlineText
                              value={content.heading || 'LATEST FINE ART PRINTS'}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, heading: val })}
                            />
                          ) : (
                            content.heading
                          )}
                        </h4>
                        {editMode && (
                          <div className="max-w-md mx-auto mb-6 text-[8px] bg-[#0c0c0e] p-3 border border-zinc-900 text-left flex flex-col space-y-2">
                            <div>
                              <span className="text-zinc-500">PRODUCT SLUGS (COMMA SEPARATED):</span>
                              <InlineText
                                value={content.product_slugs || ''}
                                onChange={(val) => updateSectionDraft(section.id, { ...content, product_slugs: val })}
                              />
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <span className="text-zinc-500">COLUMNS ({content.columns || 4}):</span>
                                <select 
                                  value={content.columns || 4} 
                                  onChange={(e) => updateSectionDraft(section.id, { ...content, columns: parseInt(e.target.value) })}
                                  className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] mt-1 block"
                                >
                                  <option value={2}>2 Columns</option>
                                  <option value={3}>3 Columns</option>
                                  <option value={4}>4 Columns</option>
                                </select>
                              </div>
                              <div>
                                <span className="text-zinc-500">LIMIT ({content.limit || 4}):</span>
                                <input 
                                  type="number"
                                  value={content.limit || 4} 
                                  onChange={(e) => updateSectionDraft(section.id, { ...content, limit: parseInt(e.target.value) || 4 })}
                                  className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] mt-1 block w-16"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <div className={`grid gap-4 ${content.columns === 2 ? 'grid-cols-2' : content.columns === 3 ? 'grid-cols-3' : 'grid-cols-4'} opacity-75`}>
                          {[1, 2, 3, 4].slice(0, content.limit || 4).map((i) => (
                            <div key={i} className="flex flex-col space-y-3 border border-zinc-900 bg-[#060607] p-3 animate-pulse">
                              <div className="relative aspect-[4/5] bg-[#0c0c0e] flex items-center justify-center">
                                <span className="font-display text-[8px] tracking-wider text-zinc-700">GRID PRODUCT {i}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TYPE 7: IMAGE COMPONENT */}
                    {section.type === 'image' && (
                      <div className="w-full py-8 max-w-3xl mx-auto text-center">
                        {editMode ? (
                          <ImageDropzone
                            imageUrl={content.image_url}
                            ratioClass={content.ratio || 'aspect-[16/9]'}
                            label={content.label || 'STUDIO PHOTOGRAPH'}
                            onUploadSuccess={(url) => updateSectionDraft(section.id, { ...content, image_url: url })}
                          />
                        ) : (
                          content.image_url && (
                            <div className={`w-full ${content.ratio || 'aspect-[16/9]'} relative`}>
                              <img src={content.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )
                        )}
                        <p className="font-sans text-[9px] text-zinc-500 mt-2 italic">
                          {editMode ? (
                            <InlineText
                              value={content.caption || 'Studio environment detail.'}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, caption: val })}
                            />
                          ) : (
                            content.caption
                          )}
                        </p>
                      </div>
                    )}

                    {/* TYPE 8: VIDEO COMPONENT */}
                    {section.type === 'video' && (
                      <div className="w-full py-8 max-w-3xl mx-auto text-center">
                        <div className={`w-full ${content.ratio || 'aspect-[16/9]'} bg-[#0c0c0e] flex items-center justify-center border border-zinc-900 relative`}>
                          <span className="font-display text-[9px] uppercase tracking-widest text-zinc-500 z-10">
                            🎞️ Video Stream Placeholder ({content.video_url || 'No URL'})
                          </span>
                        </div>
                        {editMode && (
                          <div className="max-w-md mx-auto mt-3 text-[8px] bg-[#0c0c0e] p-3 border border-zinc-900 text-left">
                            <span className="text-zinc-500">MP4 VIDEO STREAM URL:</span>
                            <InlineText
                              value={content.video_url || ''}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, video_url: val })}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* TYPE 9: PROMO BANNER COMPONENT */}
                    {section.type === 'promo_banner' && (
                      <div className="w-full py-8 bg-[#0c0c0e] border border-zinc-900 rounded p-6 flex flex-col items-center justify-center space-y-3">
                        <h4 className="font-display text-[10px] uppercase tracking-widest text-accent font-bold">
                          {editMode ? (
                            <InlineText
                              value={content.heading || 'PROMOTIONAL VOUCHER'}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, heading: val })}
                            />
                          ) : (
                            content.heading
                          )}
                        </h4>
                        <div className="font-mono text-xs md:text-sm font-bold border-2 border-dashed border-zinc-800 px-4 py-1.5 rounded tracking-widest text-foreground select-all bg-black">
                          {editMode ? (
                            <InlineText
                              value={content.promo_code || 'CODE'}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, promo_code: val })}
                            />
                          ) : (
                            content.promo_code
                          )}
                        </div>
                        <p className="font-sans text-[9px] text-zinc-500 tracking-wider">
                          {editMode ? (
                            <InlineText
                              value={content.discount || 'Apply on checkout to redeem discount.'}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, discount: val })}
                            />
                          ) : (
                            content.discount
                          )}
                        </p>
                      </div>
                    )}

                    {/* TYPE 10: FEATURED CONTENT BANNER */}
                    {section.type === 'featured_content' && (
                      <div className="w-full py-16 bg-[#0c0c0e] border border-zinc-900 rounded p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center items-center text-center space-y-4">
                        {editMode ? (
                          <ImageDropzone
                            imageUrl={content.image_url}
                            ratioClass="absolute inset-0 aspect-auto w-full h-full opacity-20"
                            label={content.label || 'CONTENT BG'}
                            onUploadSuccess={(url) => updateSectionDraft(section.id, { ...content, image_url: url })}
                          />
                        ) : (
                          content.image_url && (
                            <div className="absolute inset-0 z-0 opacity-20">
                              <img src={content.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )
                        )}
                        <div className="z-10 flex flex-col justify-center items-center space-y-4 max-w-xl">
                          <h3 className="font-display text-sm md:text-base font-bold uppercase tracking-[0.15em] text-foreground">
                            {editMode ? (
                              <InlineText
                                value={content.heading || 'Featured Story Heading'}
                                onChange={(val) => updateSectionDraft(section.id, { ...content, heading: val })}
                              />
                            ) : (
                              content.heading
                            )}
                          </h3>
                          <p className="font-sans text-[10px] sm:text-xs text-zinc-400 tracking-wider leading-relaxed">
                            {editMode ? (
                              <InlineText
                                value={content.body || 'Detailed textual story configured here...'}
                                type="textarea"
                                onChange={(val) => updateSectionDraft(section.id, { ...content, body: val })}
                              />
                            ) : (
                              content.body
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TYPE 11: ANNOUNCEMENT BULLETIN */}
                    {section.type === 'announcement' && (
                      <div className="w-full bg-accent text-black text-center py-2 px-4 uppercase tracking-[0.2em] font-display text-[8px] font-bold">
                        {editMode ? (
                          <InlineText
                            value={content.text || 'ANNOUNCEMENT BULLETIN STRIP'}
                            onChange={(val) => updateSectionDraft(section.id, { ...content, text: val })}
                          />
                        ) : (
                          content.text
                        )}
                      </div>
                    )}

                    {/* TYPE 12: CTA BUTTON BLOCK */}
                    {section.type === 'cta' && (
                      <div className="w-full py-12 text-center bg-[#0c0c0e] border border-zinc-900 flex flex-col items-center justify-center p-8 space-y-4">
                        <h3 className="font-display text-xs md:text-sm font-bold uppercase tracking-wider">
                          {editMode ? (
                            <InlineText
                              value={content.heading || 'Bespoke custom commissions.'}
                              onChange={(val) => updateSectionDraft(section.id, { ...content, heading: val })}
                            />
                          ) : (
                            content.heading
                          )}
                        </h3>
                        {editMode ? (
                          <div className="flex gap-4 text-[8px] bg-black/80 p-2 rounded border border-zinc-900">
                            <div>
                              <span className="text-zinc-500">BUTTON LABEL:</span>
                              <InlineText
                                value={content.button_text || 'BOOK FREE CONSULTATION'}
                                onChange={(val) => updateSectionDraft(section.id, { ...content, button_text: val })}
                              />
                            </div>
                            <div>
                              <span className="text-zinc-500">BUTTON LINK:</span>
                              <InlineText
                                value={content.cta_link || '/customize-art'}
                                onChange={(val) => updateSectionDraft(section.id, { ...content, cta_link: val })}
                              />
                            </div>
                          </div>
                        ) : (
                          <button className="btn-kith-outline tracking-widest text-[9px] font-bold py-2 px-4 pointer-events-none">
                            {content.button_text || 'CLICK'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* TYPE 13: SPACER COMPONENT */}
                    {section.type === 'spacer' && (
                      <div className="w-full flex items-center justify-center py-4 bg-zinc-950/20 border border-zinc-900/10 min-h-[48px] relative group/spacer select-none">
                        <span className="font-mono text-[7px] text-zinc-800 tracking-widest uppercase absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          📐 Spacer ({content.height || 'h-12'})
                        </span>
                        {editMode && (
                          <div className="absolute right-4 text-[8px] bg-[#0c0c0e] p-1.5 rounded border border-zinc-800 text-left z-20">
                            <select 
                              value={content.height || 'h-12'}
                              onChange={(e) => updateSectionDraft(section.id, { ...content, height: e.target.value })}
                              className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px]"
                            >
                              <option value="h-4">h-4 (16px)</option>
                              <option value="h-8">h-8 (32px)</option>
                              <option value="h-12">h-12 (48px)</option>
                              <option value="h-16">h-16 (64px)</option>
                              <option value="h-24">h-24 (96px)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TYPE 14: CUSTOM HTML SECTION */}
                    {section.type === 'custom_section' && (
                      <div className="w-full py-6">
                        {editMode ? (
                          <div className="space-y-2">
                            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded font-mono text-[7px] text-zinc-500 uppercase tracking-widest">
                              🧩 Custom Raw HTML Output preview
                            </div>
                            <textarea
                              value={content.html || ''}
                              onChange={(e) => updateSectionDraft(section.id, { ...content, html: e.target.value })}
                              className="w-full bg-[#121214] border border-zinc-800 text-foreground text-[10px] p-3 rounded focus:outline-none font-mono focus:border-accent"
                              rows={4}
                              placeholder="Write raw custom HTML elements..."
                            />
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: content.html || '' }} />
                        )}
                      </div>
                    )}

                    {/* TYPE 15: PRODUCT CAROUSEL SWIPER */}
                    {section.type === 'product_swiper' && (
                      <div className="w-full py-8 border-y border-zinc-900/50 bg-[#0c0c0e]/30 px-4">
                        <div className="flex justify-between items-end mb-6">
                          <h3 className="font-display text-[10px] font-extrabold uppercase tracking-[0.25em] text-foreground/55">
                            {editMode ? (
                              <InlineText
                                value={content.heading || 'LATEST RELEASES'}
                                onChange={(val) => updateSectionDraft(section.id, { ...content, heading: val })}
                              />
                            ) : (
                              content.heading
                            )}
                          </h3>
                          <span className="font-display text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:underline">
                            VIEW ALL
                          </span>
                        </div>
                        {editMode && (
                          <div className="max-w-md mx-auto mb-6 text-[8px] bg-black/60 p-3 border border-zinc-900 text-left flex flex-col space-y-1">
                            <span className="text-zinc-500">MAX ITEMS TO DISPLAY:</span>
                            <input 
                              type="number"
                              value={content.limit || 10} 
                              onChange={(e) => updateSectionDraft(section.id, { ...content, limit: parseInt(e.target.value) || 10 })}
                              className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] mt-1 w-20"
                            />
                          </div>
                        )}
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="min-w-[150px] sm:min-w-[200px] border border-zinc-900 bg-[#060607] p-3 flex flex-col space-y-2 select-none">
                              <div className="aspect-[4/5] bg-zinc-950 flex items-center justify-center">
                                <span className="font-display text-[8px] tracking-wider text-zinc-700">MOCK PRODUCT {i}</span>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">ART RELEASES</span>
                                <h4 className="font-display text-[10px] tracking-wider text-zinc-400 font-semibold truncate">Swiper Product Title</h4>
                                <span className="font-mono text-[9px] text-zinc-500">₹1,999</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Dedicated Settings Panel to avoid overlays on visual canvas */}
                  {editMode && (
                    <div className="w-full bg-[#0c0c0e]/85 border-t border-zinc-900/50 p-4 flex flex-wrap items-center gap-6 text-[9px] font-display uppercase tracking-widest text-zinc-500 select-none">
                      <div className="flex items-center gap-1.5 font-extrabold text-accent">
                        <span>⚙️ settings</span>
                      </div>

                      {/* 1. Hero / Banner Ratio & CTA configuration */}
                      {(section.type === 'hero' || section.type === 'banner') && (
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span>CTA Button text:</span>
                            <input
                              type="text"
                              value={content.cta_text || 'DISCOVER'}
                              onChange={(e) => updateSectionDraft(section.id, { ...content, cta_text: e.target.value })}
                              className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] uppercase tracking-widest w-24 focus:outline-none focus:border-accent"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Redirect URL:</span>
                            <input
                              type="text"
                              value={content.cta_link || '/shop'}
                              onChange={(e) => updateSectionDraft(section.id, { ...content, cta_link: e.target.value })}
                              className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] tracking-normal w-36 focus:outline-none focus:border-accent"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Height / Aspect Ratio:</span>
                            <select
                              value={content.ratio || 'aspect-[2/1] aspect-[1/1]'}
                              onChange={(e) => updateSectionDraft(section.id, { ...content, ratio: e.target.value })}
                              className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] focus:outline-none focus:border-accent"
                            >
                              <option value="aspect-[2/1] aspect-[1/1]">Wide Desktop / Square Mobile (Kith Style)</option>
                              <option value="aspect-[21/9]">Cinematic Ultra-Wide (21:9)</option>
                              <option value="aspect-[16/9]">Standard Landscape (16:9)</option>
                              <option value="aspect-[4/3]">Traditional Photo (4:3)</option>
                              <option value="aspect-[1/1]">Perfect Square (1:1)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* 2. Featured campaign redirect link */}
                      {section.type === 'featured_products' && (
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span>Campaign Redirect URL:</span>
                            <input
                              type="text"
                              value={content.cta_link || '/shop'}
                              onChange={(e) => updateSectionDraft(section.id, { ...content, cta_link: e.target.value })}
                              className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] tracking-normal w-48 focus:outline-none focus:border-accent"
                            />
                          </div>
                        </div>
                      )}

                      {/* 3. Lookbook item specific links & texts */}
                      {(section.type === 'lookbook' || section.type === 'collection') && (
                        <div className="flex flex-col space-y-2.5 w-full">
                          <span className="text-zinc-600">Grid Card Configurations:</span>
                          <div className="flex flex-wrap gap-4">
                            {(content.items || []).map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="flex flex-col space-y-1.5 bg-black/40 border border-zinc-900/60 p-2.5 rounded">
                                <span className="font-mono text-[7px] text-zinc-600 uppercase">Card #{itemIdx + 1}</span>
                                <div className="flex items-center gap-2">
                                  <span>TITLE:</span>
                                  <input
                                    type="text"
                                    value={item.heading || ''}
                                    onChange={(e) => {
                                      const updatedItems = [...content.items];
                                      updatedItems[itemIdx] = { ...item, heading: e.target.value };
                                      updateSectionDraft(section.id, { ...content, items: updatedItems });
                                    }}
                                    className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[8px] tracking-wide w-28 focus:outline-none focus:border-accent"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>LINK:</span>
                                  <input
                                    type="text"
                                    value={item.cta_link || '/shop'}
                                    onChange={(e) => {
                                      const updatedItems = [...content.items];
                                      updatedItems[itemIdx] = { ...item, cta_link: e.target.value };
                                      updateSectionDraft(section.id, { ...content, items: updatedItems });
                                    }}
                                    className="bg-black text-foreground border border-zinc-800 rounded p-1 text-[7px] tracking-normal w-28 focus:outline-none focus:border-accent"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Section inter-block helper UI */}
                  {editMode && (
                    <div className="absolute -bottom-3 inset-x-0 z-30 h-6 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-full border-t border-dashed border-accent/40 absolute" />
                      
                      <div className="relative flex gap-2 bg-background border border-accent/40 px-3 py-1 rounded-full shadow-md">
                        <button
                          onClick={() => {
                            setPickerInsertIndex(idx + 1);
                            setIsPickerOpen(true);
                          }}
                          className="flex items-center gap-1 font-display text-[8px] uppercase tracking-widest text-accent font-extrabold hover:underline animate-pulse"
                        >
                          <Plus className="h-3 w-3" />
                          Add Section
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Elementor-style Slide-Out Component Selector Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-[380px] bg-[#0c0c0e] border-l border-zinc-800 h-full flex flex-col shadow-2xl p-6 relative animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setIsPickerOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-foreground transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              [ Close ]
            </button>
            
            <h3 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-accent mb-1 mt-6">
              Add New Section
            </h3>
            <p className="font-sans text-[10px] text-zinc-500 tracking-wider mb-6">
              Select a component to insert at position #{pickerInsertIndex + 1}
            </p>
            
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
              {Object.keys(PREDEFINED_SECTIONS).map((key) => {
                return (
                  <button
                    key={key}
                    onClick={() => {
                      addNewSection(key, pickerInsertIndex);
                      setIsPickerOpen(false);
                    }}
                    className="w-full text-left p-3.5 border border-zinc-900 hover:border-accent bg-[#060607] hover:bg-accent/5 rounded flex items-center justify-between group transition-all"
                  >
                    <div className="flex flex-col space-y-1">
                      <span className="font-display text-[10px] font-bold uppercase tracking-wider text-foreground group-hover:text-accent transition-colors">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="font-sans text-[8px] text-zinc-500 uppercase tracking-widest">
                        PRESETS LOADED
                      </span>
                    </div>
                    <span className="font-mono text-zinc-600 group-hover:text-accent transition-colors text-[9px] font-bold">
                      + ADD
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
