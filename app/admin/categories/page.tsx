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

  // Delete Category with safety product count check & auto-uncategorize
  const handleDelete = async (catId: string, catName: string) => {
    try {
      // 1. Check assigned products count
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', catId);

      const assignedCount = count || 0;

      const confirmMsg = assignedCount > 0
        ? `WARNING: "${catName}" has ${assignedCount} assigned product(s).\n\nIf you delete this category, these ${assignedCount} product(s) will become "Uncategorized".\n\nAre you sure you want to proceed?`
        : `Are you sure you want to delete the category "${catName}"?`;

      if (!confirm(confirmMsg)) return;

      // 2. Unassign products first (set category_id = null)
      if (assignedCount > 0) {
        await supabase
          .from('products')
          .update({ category_id: null })
          .eq('category_id', catId);
      }

      // 3. Delete category row
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId);

      if (error) throw error;
      setSuccessMsg(`Category "${catName}" deleted successfully.`);
      handleSelectNew();
      await loadCategories();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete category.');
    }
  };

  // Seed default categories into database
  const handleSeedDefaultCategories = async () => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const seedParents = [
        { id: 'c1000000-0000-0000-0000-000000000001', name: 'Original Art', slug: 'original-art', description: 'Hand-painted textured canvas original artworks', parent_id: null, is_visible: true, sort_order: 1 },
        { id: 'c2000000-0000-0000-0000-000000000002', name: 'Art Prints', slug: 'art-prints', description: 'High quality giclée fine art prints', parent_id: null, is_visible: true, sort_order: 2 },
        { id: 'c3000000-0000-0000-0000-000000000003', name: 'Calendar', slug: 'calendar', description: 'Textured palette aesthetic calendars', parent_id: null, is_visible: true, sort_order: 3 },
        { id: 'c4000000-0000-0000-0000-000000000004', name: 'Art Products', slug: 'art-products', description: 'Collectible art merchandise and accessories', parent_id: null, is_visible: true, sort_order: 4 }
      ];

      const seedChildren = [
        { id: 'b0000000-0000-0000-0000-000000000001', name: 'Bookmarks', slug: 'bookmarks', description: 'Hand-painted cardstock bookmarks', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 1 },
        { id: 'b0000000-0000-0000-0000-000000000002', name: 'Stationery', slug: 'stationery', description: 'Aesthetic notebooks, post-it pads & journals', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 2 },
        { id: 'b0000000-0000-0000-0000-000000000003', name: 'Fridge Magnets', slug: 'fridge-magnets', description: 'Textured mini canvas magnets', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 3 },
        { id: 'b0000000-0000-0000-0000-000000000004', name: 'Stickers', slug: 'stickers', description: 'Waterproof vinyl art stickers', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 4 },
        { id: 'b0000000-0000-0000-0000-000000000005', name: 'Badges', slug: 'badges', description: 'Aesthetic enamel & button art pins', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 5 },
        { id: 'b0000000-0000-0000-0000-000000000006', name: 'Apparels', slug: 'apparels', description: 'Wearable art apparel & organic totes', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 6 },
        { id: 'b0000000-0000-0000-0000-000000000007', name: 'Mugs', slug: 'mugs', description: 'Ceramic art prints & impasto mugs', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 7 },
        { id: 'b0000000-0000-0000-0000-000000000008', name: 'Phone Cases', slug: 'phone-cases', description: 'Textured art protective phone covers', parent_id: 'c4000000-0000-0000-0000-000000000004', is_visible: true, sort_order: 8 }
      ];

      const { error: err1 } = await supabase.from('categories').upsert(seedParents);
      if (err1) throw err1;

      const { error: err2 } = await supabase.from('categories').upsert(seedChildren);
      if (err2) throw err2;

      setSuccessMsg('All 12 default categories seeded into database successfully!');
      await loadCategories();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to seed categories.');
    } finally {
      setSubmitting(false);
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSeedDefaultCategories}
                disabled={submitting}
                className="h-8 px-2.5 border border-accent/40 text-accent hover:bg-accent hover:text-black font-display text-[8px] font-bold uppercase tracking-widest transition-all rounded"
                title="Populate 12 standard art store categories into database"
              >
                SEED DEFAULTS
              </button>
              <button
                onClick={handleSelectNew}
                className="h-8 px-3 border border-zinc-800 hover:border-accent text-zinc-500 hover:text-accent font-display text-[9px] uppercase tracking-widest flex items-center gap-1 transition-all rounded"
              >
                <Plus className="h-3 w-3" />
                ADD NEW
              </button>
            </div>
          </div>

          {parents.length === 0 ? (
            <div className="py-12 border border-zinc-900 text-center space-y-3">
              <span className="font-display text-[9px] text-zinc-600 tracking-widest uppercase block">No categories registered in database</span>
              <button
                type="button"
                onClick={handleSeedDefaultCategories}
                disabled={submitting}
                className="px-4 py-2 bg-accent text-black font-display text-[9px] font-bold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-colors"
              >
                SEED 12 DEFAULT STORE CATEGORIES
              </button>
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
                          onClick={() => handleDelete(parent.id, parent.name)}
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
                                  onClick={() => handleDelete(sub.id, sub.name)}
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
