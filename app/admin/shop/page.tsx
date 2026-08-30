'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Eye, EyeOff, RotateCcw, Monitor, CheckCircle, ArrowLeft, ArrowUpDown, Tag, Plus, Edit, Archive, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InlineText from '@/components/admin/InlineText';

const DEFAULT_SHOP_CONTENT = {
  hero_title: "ALL RELEASES"
};

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

export default function AdminShopDashboard() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetCatId, setTargetCatId] = useState<string>('uncategorized');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkStatusMsg, setBulkStatusMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  const supabase = createClient();

  const loadDashboardData = async () => {
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

      // 1. Fetch categories for bulk action dropdown
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .order('sort_order', { ascending: true });
      setCategories(catData || []);

      // 2. Fetch products list
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;
      setProducts(prodData || []);

      // 2. Fetch Shop Page Title Content settings
      const { data: secData } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('type', 'shop_page')
        .maybeSingle();

      if (secData) {
        setContent(secData.draft_content || DEFAULT_SHOP_CONTENT);
      } else {
        const { data: newRow, error: insertError } = await supabase
          .from('homepage_sections')
          .insert([
            {
              type: 'shop_page',
              sort_order: 103,
              is_visible: false,
              draft_content: DEFAULT_SHOP_CONTENT,
              published_content: DEFAULT_SHOP_CONTENT
            }
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        setContent(newRow.draft_content);
      }
    } catch (err) {
      console.error('Error loading shop dashboard details:', err);
      setContent(DEFAULT_SHOP_CONTENT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
        .eq('type', 'shop_page');

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving shop page draft.');
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
        .eq('type', 'shop_page');

      if (error) throw error;
      setSaveStatus('saved');
      alert('Shop Page published successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing shop page.');
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
        .eq('type', 'shop_page')
        .single();
      
      if (data) {
        setContent(data.published_content || DEFAULT_SHOP_CONTENT);
        setSaveStatus('idle');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Archive action trigger
  const handleArchive = async (productId: string) => {
    if (!confirm('Are you sure you want to archive this product? This will hide it from the storefront.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived' })
        .eq('id', productId);
      
      if (error) throw error;
      
      setProducts(items => items.map(item => item.id === productId ? { ...item, status: 'archived' } : item));
    } catch (e) {
      console.error(e);
      alert('Failed to archive product.');
    }
  };

  // Bulk selection helper handlers
  const handleToggleSelectAll = (filteredItems: any[]) => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(item => item.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkCategoryAssign = async () => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    setBulkStatusMsg('');
    try {
      const categoryIdVal = targetCatId === 'uncategorized' ? null : targetCatId;
      const { error } = await supabase
        .from('products')
        .update({ category_id: categoryIdVal })
        .in('id', selectedIds);

      if (error) throw error;

      const targetCatObj = categories.find(c => c.id === targetCatId);
      const catLabel = targetCatId === 'uncategorized' ? 'Uncategorized' : (targetCatObj?.name || 'Selected Category');

      setBulkStatusMsg(`Successfully assigned ${selectedIds.length} product(s) to "${catLabel}".`);
      setSelectedIds([]);
      await loadDashboardData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to assign category to selected products.');
    } finally {
      setBulkUpdating(false);
    }
  };

  // Filter products list
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (product.categories?.name && product.categories.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && product.status === activeTab;
  });

  if (loading || !content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse">Loading Shop Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      
      {/* Dynamic Saving Chip */}
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

      {/* 1. VISUAL SHOP TITLE EDITOR SECTION */}
      <div className="border border-border-subtle bg-[#0c0c0e] p-6 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold flex items-center gap-1.5">
            ✏️ SHOP PAGE VISUAL TITLE EDITOR
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(true)}
              className={`px-2.5 py-1 text-[8px] font-display uppercase tracking-widest font-semibold rounded-sm transition-all ${
                editMode ? 'bg-accent text-black shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Edit Mode
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
        </div>

        <div className="max-w-xl py-4">
          <span className="font-mono text-[8px] text-zinc-600 block uppercase tracking-widest mb-2">Shop Storefront Header Title</span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-foreground">
            {editMode ? (
              <InlineText
                value={content.hero_title || 'ALL RELEASES'}
                onChange={(val) => updateDraft({ hero_title: val })}
              />
            ) : (
              content.hero_title || 'ALL RELEASES'
            )}
          </h1>
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t border-zinc-900 pt-4">
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

      {/* 2. PRODUCTS INVENTORY CATALOG SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-6">
          <div>
            <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">Inventory Panel</span>
            <h2 className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-wide">Products Catalog</h2>
          </div>

          <Link
            href="/admin/shop/new"
            className="h-10 px-4 bg-accent text-black flex items-center justify-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            ADD NEW PRODUCT
          </Link>
        </div>

        {/* Filter and Search controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-zinc-900 pb-4">
          {/* Tab Filters */}
          <div className="flex gap-4 font-display text-[9px] tracking-widest uppercase">
            {['all', 'published', 'draft', 'archived'].map((tab: any) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-1.5 border-b font-bold transition-all ${
                  activeTab === tab 
                    ? 'border-accent text-accent' 
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="w-full sm:w-64 relative flex items-center border border-zinc-800 bg-[#0c0c0e] h-10 px-3">
            <Search className="h-4 w-4 text-zinc-650 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent font-display text-xs text-foreground focus:outline-none placeholder:text-zinc-700"
            />
          </div>
        </div>

        {/* Bulk Action Notification */}
        {bulkStatusMsg && (
          <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-500 font-sans text-xs flex items-center justify-between">
            <span>{bulkStatusMsg}</span>
            <button onClick={() => setBulkStatusMsg('')} className="text-zinc-500 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-[#0c0c0e] border border-accent/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-accent" />
              <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                {selectedIds.length} Product(s) Selected
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="font-display text-[9px] uppercase tracking-widest text-muted hidden sm:inline">Assign Category:</span>
              <select
                value={targetCatId}
                onChange={(e) => setTargetCatId(e.target.value)}
                className="h-9 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
              >
                <option value="uncategorized">Uncategorized (Clear Category)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <button
                onClick={handleBulkCategoryAssign}
                disabled={bulkUpdating}
                className="h-9 px-4 bg-accent text-black font-display text-[9px] font-bold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {bulkUpdating ? 'UPDATING...' : 'APPLY BULK CATEGORY'}
              </button>
            </div>
          </div>
        )}

        {/* Table list view */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-900">
            <span className="font-display text-xs text-muted tracking-widest uppercase">No products found</span>
          </div>
        ) : (
          <div className="border border-border-subtle bg-[#0c0c0e] overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-border-subtle font-display text-[9px] uppercase tracking-widest text-muted bg-black/40">
                  <th className="p-4 sm:p-5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={() => handleToggleSelectAll(filteredProducts)}
                      className="h-4 w-4 rounded border-zinc-800 bg-background text-accent focus:ring-accent cursor-pointer"
                    />
                  </th>
                  <th className="p-4 sm:p-5">Product Details</th>
                  <th className="p-4 sm:p-5">Category</th>
                  <th className="p-4 sm:p-5">Unit Price</th>
                  <th className="p-4 sm:p-5">Status</th>
                  <th className="p-4 sm:p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <tr key={product.id} className={`transition-colors ${isSelected ? 'bg-accent/5' : 'hover:bg-zinc-950/40'}`}>
                      <td className="p-4 sm:p-5 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(product.id)}
                          className="h-4 w-4 rounded border-zinc-800 bg-background text-accent focus:ring-accent cursor-pointer"
                        />
                      </td>

                      {/* Name detail */}
                      <td className="p-4 sm:p-5">
                        <div className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                          {product.name}
                        </div>
                        <span className="font-mono text-[9px] text-zinc-600 block mt-0.5">{product.slug}</span>
                      </td>

                    {/* Category */}
                    <td className="p-4 sm:p-5 text-muted">
                      {product.categories?.name || 'Uncategorized'}
                    </td>

                    {/* Price */}
                    <td className="p-4 sm:p-5 font-mono">
                      {product.discounted_price ? (
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">
                            {formatPrice(product.discounted_price)}
                          </span>
                          <span className="text-zinc-600 line-through text-[10px]">
                            {formatPrice(product.regular_price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-foreground">
                          {formatPrice(product.regular_price)}
                        </span>
                      )}
                    </td>

                    {/* Status tag */}
                    <td className="p-4 sm:p-5">
                      <span className={`inline-flex items-center gap-1 text-[8px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                        product.status === 'published'
                          ? 'border-green-500/20 bg-green-500/5 text-green-500'
                          : product.status === 'draft'
                          ? 'border-amber-500/20 bg-amber-500/5 text-amber-500'
                          : 'border-zinc-800 bg-background text-muted'
                      }`}>
                        {product.status}
                      </span>
                    </td>

                    {/* Action items */}
                    <td className="p-4 sm:p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/shop/${product.id}`}
                          className="h-8 w-8 flex items-center justify-center border border-zinc-800 hover:border-accent text-zinc-500 hover:text-accent transition-all rounded"
                          title="Edit Product"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        
                        {product.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(product.id)}
                            className="h-8 w-8 flex items-center justify-center border border-zinc-800 hover:border-red-500 text-zinc-500 hover:text-red-500 transition-all rounded"
                            title="Archive Product"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
