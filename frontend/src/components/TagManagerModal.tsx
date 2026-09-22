import React, { useState } from 'react';
import { X, Tag as TagIcon, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Tag } from '../types';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  onAddTag: (name: string) => Promise<Tag | null>;
  onDeleteTag: (idOrName: string) => Promise<void>;
  tagCounts: Record<string, number>;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  tags,
  onAddTag,
  onDeleteTag,
  tagCounts,
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await onAddTag(newTagName.trim());
      setNewTagName('');
    } catch (err: any) {
      setError(err.message || 'Failed to add tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    const idOrName = tag._id || tag.name;
    const count = tagCounts[tag.name] || 0;
    
    if (
      confirm(
        count > 0
          ? `Tag "${tag.name}" is used by ${count} item(s). Are you sure you want to remove this tag?`
          : `Delete tag "${tag.name}"?`
      )
    ) {
      setDeletingId(idOrName);
      try {
        await onDeleteTag(idOrName);
      } catch (err: any) {
        setError(err.message || 'Failed to delete tag');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-red-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/20">
              <TagIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Category & Tag Manager</h2>
              <p className="text-xs text-red-100">Add or remove product categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Tag Form */}
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. Baluwa, Cement, Steel Rod, Rod, Pipes..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-semibold outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newTagName.trim()}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Tag'}</span>
            </button>
          </form>

          {/* Tags List */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Existing Tags ({tags.length})
            </span>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {tags.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No tags added yet. Create one above!
                </div>
              ) : (
                tags.map((t) => {
                  const count = tagCounts[t.name] || 0;
                  const tagKey = t._id || t.name;
                  const isDeleting = deletingId === tagKey;

                  return (
                    <div
                      key={tagKey}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-red-50/50 border border-gray-100 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-bold text-gray-800">{t.name}</span>
                        <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        disabled={isDeleting}
                        title={`Delete tag ${t.name}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Close Footer */}
          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition"
            >
              Done
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
