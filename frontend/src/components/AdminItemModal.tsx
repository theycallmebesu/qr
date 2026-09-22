import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, Tag as TagIcon, Plus, Check, AlertCircle, ImageIcon } from 'lucide-react';
import { HardwareItem, Tag } from '../types';

interface AdminItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<HardwareItem>) => Promise<void>;
  editItem?: HardwareItem | null;
  tags: Tag[];
  onAddNewTag: (name: string) => Promise<Tag | null>;
  onOpenTagManager: () => void;
}

export const AdminItemModal: React.FC<AdminItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  tags,
  onAddNewTag,
  onOpenTagManager,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('piece');
  const [tag, setTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);

  // New tag inline state
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '');
      setPrice(String(editItem.price || ''));
      setUnit(editItem.unit || 'piece');
      setTag(editItem.tag || (tags[0]?.name || 'Pipes'));
      setImageUrl(editItem.imageUrl || '');
      setDescription(editItem.description || '');
      setInStock(editItem.inStock ?? true);
    } else {
      setName('');
      setPrice('');
      setUnit('piece');
      setTag(tags[0]?.name || 'Pipes');
      setImageUrl('');
      setDescription('');
      setInStock(true);
    }
    setError('');
    setShowNewTagInput(false);
  }, [editItem, isOpen, tags]);

  if (!isOpen) return null;

  // Handle Photo / Gallery Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image is too large (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;
    setIsAddingTag(true);
    try {
      const created = await onAddNewTag(newTagName.trim());
      if (created) {
        setTag(created.name);
        setNewTagName('');
        setShowNewTagInput(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add tag');
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setError('Please enter a valid price');
      return;
    }
    if (!tag) {
      setError('Please select or add a tag/category');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        price: Number(price),
        unit: unit.trim() || 'piece',
        tag: tag.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim(),
        inStock,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-red-100 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/20">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {editItem ? 'Edit Hardware Item' : 'Add New Hardware Item'}
              </h2>
              <p className="text-xs text-red-100">
                Shree Pashupatinath Hardware Inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Photo / Gallery Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              1. Product Photo / Gallery Upload
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Image Preview */}
              <div className="relative w-28 h-24 sm:w-32 sm:h-28 rounded-2xl bg-red-50 border-2 border-dashed border-red-200 overflow-hidden flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-red-300">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-[10px] font-semibold">No Image</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload from Gallery / Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                    title="Take photo from camera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Or paste Image URL */}
                <input
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste online image URL (https://...)"
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Item Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              2. Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shivam OPC Cement 53 Grade, TMT Rod 12mm, CPVC Pipe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm font-semibold outline-none"
            />
          </div>

          {/* 3. Price & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                3. Price (in Rs.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-red-600">Rs.</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm font-bold text-gray-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Unit / Measurement
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 text-sm font-medium bg-white outline-none"
              >
                <option value="piece">piece (थान)</option>
                <option value="bag">bag (बोरा - 50kg)</option>
                <option value="kg">kg (किलो)</option>
                <option value="quintal">quintal (क्विन्टल)</option>
                <option value="ton">ton (टन)</option>
                <option value="Tipper (450 cu.ft)">Tipper (टिपर)</option>
                <option value="Tractor (150 cu.ft)">Tractor (ट्र्याक्टर)</option>
                <option value="piece (10ft)">piece (10ft pipe)</option>
                <option value="piece (20ft)">piece (20ft pipe)</option>
                <option value="bucket (20L)">bucket (20L paint)</option>
                <option value="liter">liter (लिटर)</option>
                <option value="box">box (बक्स)</option>
                <option value="meter">meter (मिटर)</option>
                <option value="foot">foot (फिट)</option>
                <option value="bundle">bundle (मुठा)</option>
              </select>
            </div>
          </div>

          {/* 4. Tag / Category Selection & Inline Add Tag */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5 text-red-500" />
                <span>4. Tag / Category</span> <span className="text-red-500">*</span>
              </label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTagInput(!showNewTagInput)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 underline"
                >
                  {showNewTagInput ? 'Cancel' : '+ Add New Tag'}
                </button>
                <button
                  type="button"
                  onClick={onOpenTagManager}
                  className="text-xs font-medium text-gray-500 hover:text-red-600 underline"
                >
                  Manage Tags
                </button>
              </div>
            </div>

            {/* Inline Add New Tag Input */}
            {showNewTagInput && (
              <div className="p-3 mb-2 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 animate-fadeIn">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter new category (e.g. Baluwa, Gitti, Pipes)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleCreateNewTag}
                  disabled={isAddingTag || !newTagName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {isAddingTag ? 'Adding...' : 'Save Tag'}
                </button>
              </div>
            )}

            {/* Tag Selection Dropdown */}
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm font-semibold text-gray-800 bg-white outline-none"
            >
              {tags.map((t) => (
                <option key={t._id || t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Description (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description / Specs (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brand specifications, thickness, grade, warranty..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs text-gray-800 outline-none resize-none"
            />
          </div>

          {/* 6. Stock Availability */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-800 block">Stock Availability</span>
              <span className="text-[11px] text-gray-500">Show whether this item is currently in shop</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-500/25 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : editItem ? 'Update Item' : 'Add Item to Catalog'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
