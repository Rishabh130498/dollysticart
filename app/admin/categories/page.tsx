'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Save, Trash2, Edit, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States (Create / Edit)
  const [selectedCat, setSelectedCat] = useState<any>(null); // Null means Create Mode
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabase = createClient();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Sync edit details when selecting category
  const handleSelectEdit = (cat: any) => {
    setSelectedCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setParentId(cat.parent_id || '');
    setIsVisible(cat.is_visible);
    setSortOrder(cat.sort_order.toString());
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Toggle to Create Mode
  const handleSelectNew = () => {
    setSelectedCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setParentId('');
    setIsVisible(true);
    setSortOrder('0');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!selectedCat) {
      setSlug(val.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      );
    }
  };

  // Submit category details
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !slug) {
      setErrorMsg('Please populate all required fields.');
      setSubmitting(false);
      return;
    }

    const orderInt = parseInt(sortOrder);
    if (isNaN(orderInt)) {
      setErrorMsg('Sort order must be a valid integer.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name,
        slug,
        description,
        parent_id: parentId || null,
        is_visible: isVisible,
        sort_order: orderInt,
        updated_at: new Date().toISOString()
      };

      if (selectedCat) {
        // Edit Mode
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', selectedCat.id);

        if (error) throw error;
        setSuccessMsg('Category updated successfully.');
      } else {
        // Create Mode
        const { error } = await supabase
          .from('categories')
          .insert([payload]);

        if (error) throw error;
        setSuccessMsg('Category created successfully.');
        handleSelectNew();
      }

      await loadCategories();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDelete = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will become uncategorized.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId);

      if (error) throw error;
      setSuccessMsg('Category deleted.');
      handleSelectNew();
      await loadCategories();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete category.');
    }
  };

  // Render tree layout helpers
  const parents = categories.filter(c => c.parent_id === null);

  if (loading) {
    return (
      <div className="text-center py-20">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING HIERARCHIES...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-border-subtle pb-6">
        <div>
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">Hierarchies Panel</span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide">Category Management</h1>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-500 font-sans text-xs">
          {successMsg}
        </div>
      )}

      {/* Two Columns panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        
        {/* Left column: Categories Hierarchy Tree */}
        <div className="lg:col-span-6 border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-accent" />
              Category Tree
            </h2>
            <button
              onClick={handleSelectNew}
              className="h-8 px-3 border border-zinc-800 hover:border-accent text-zinc-500 hover:text-accent font-display text-[9px] uppercase tracking-widest flex items-center gap-1 transition-all rounded"
            >
              <Plus className="h-3 w-3" />
              ADD NEW
            </button>
          </div>

          {parents.length === 0 ? (
            <div className="py-12 border border-zinc-900 text-center">
              <span className="font-display text-[9px] text-zinc-600 tracking-widest uppercase">No categories registered</span>
            </div>
          ) : (
            <div className="space-y-4">
              {parents.map(parent => {
                const subcats = categories.filter(c => c.parent_id === parent.id);
                const isSelected = selectedCat?.id === parent.id;
                
                return (
                  <div key={parent.id} className="space-y-2">
                    
                    {/* Parent category row */}
                    <div className={`p-3 border flex items-center justify-between transition-colors ${
                      isSelected ? 'border-accent bg-accent/5' : 'border-zinc-900 hover:border-zinc-700 bg-background'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground truncate">
                          {parent.name}
                        </span>
                        {!parent.is_visible && <EyeOff className="h-3.5 w-3.5 text-zinc-600 shrink-0" />}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectEdit(parent)}
                          className="text-zinc-500 hover:text-accent"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(parent.id)}
                          className="text-zinc-500 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories (Indented) */}
                    {subcats.length > 0 && (
                      <div className="pl-6 space-y-1.5 border-l border-zinc-900 ml-4">
                        {subcats.map(sub => {
                          const isSubSelected = selectedCat?.id === sub.id;
                          return (
                            <div key={sub.id} className={`p-2.5 border flex items-center justify-between text-xs transition-colors ${
                              isSubSelected ? 'border-accent bg-accent/5' : 'border-zinc-900 hover:border-zinc-800 bg-background/50'
                            }`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-display text-[11px] uppercase tracking-wider text-foreground/80 truncate">
                                  {sub.name}
                                </span>
                                {!sub.is_visible && <EyeOff className="h-3 w-3 text-zinc-600 shrink-0" />}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSelectEdit(sub)}
                                  className="text-zinc-500 hover:text-accent"
                                  title="Edit"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(sub.id)}
                                  className="text-zinc-500 hover:text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Form details panels */}
        <div className="lg:col-span-6 border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3">
            {selectedCat ? `Modify: ${selectedCat.name}` : 'Create Category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Name */}
            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Category Name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Art Prints"
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-700 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            {/* Slug */}
            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Slug (URL Keyword) <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. art-prints"
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-700 focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            {/* Parent Category */}
            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Parent Category (Optional hierarchy)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
              >
                <option value="">None (Top Level Category)</option>
                {/* Loop other top level categories only (prevent circular parent references) */}
                {parents
                  .filter(p => !selectedCat || p.id !== selectedCat.id)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Sort order & Visibilities */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                  Sort Order
                </label>
                <input
                  type="number"
                  required
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                  className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Visibility toggles */}
              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  id="visibility"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-800 bg-background text-accent focus:ring-accent"
                />
                <label htmlFor="visibility" className="font-display text-[9px] uppercase tracking-widest text-foreground/80 font-bold select-none cursor-pointer">
                  Visible in Store
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4 border-t border-zinc-900">
              <button
                type="submit"
                disabled={submitting}
                className="flex-grow h-11 bg-accent text-black font-display text-[10px] font-bold uppercase tracking-widest hover:bg-accent-dark transition-colors border border-accent flex items-center justify-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                {submitting ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
              
              {selectedCat && (
                <button
                  type="button"
                  onClick={handleSelectNew}
                  className="h-11 px-4 border border-zinc-800 text-zinc-500 hover:text-foreground font-display text-[9px] uppercase tracking-widest bg-transparent transition-colors rounded"
                >
                  CANCEL
                </button>
              )}
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
