'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Camera,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Tag as TagIcon,
} from 'lucide-react';
import { compressImage } from '@/lib/ImageCompressor';

const POPULAR_TAGS = [
  'PIPE',
  'BALUWA',
  'CEMENT',
  'ROD',
  'PAINT',
  'TOOLS',
  'SANITARY',
  'ELECTRICAL',
  'HARDWARE',
  'BRICK',
  'AGGREGATE',
  'STEEL',
  'FASTENERS',
];

const COMMON_UNITS = [
  'PIECE',
  'KG',
  'FT',
  'BAG',
  'TRIP',
  'TRACTOR',
  'BUNDLE',
  'ROLL',
  'SET',
  'BOX',
  'LITER',
  'METER',
];

type Step = 'camera' | 'confirm_photo' | 'ask_name' | 'ask_tag' | 'ask_price' | 'saving';

export default function AddItemWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('camera');

  // Form states
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const [compressedSizeKB, setCompressedSizeKB] = useState<number>(0);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('PIPE');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('PIECE');
  const [priority, setPriority] = useState('100');

  // Status & Progress
  const [uploadProgress, setUploadProgress] = useState<'compressing' | 'uploading_image' | 'saving_item' | 'done'>('compressing');
  const [errorMessage, setErrorMessage] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Trigger camera automatically when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'camera' && !capturedImageDataUrl && cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [step, capturedImageDataUrl]);

  // Handle image capture / file selection
  const handleImageSelected = async (file?: File) => {
    if (!file) return;

    try {
      setErrorMessage('');
      const { dataUrl, sizeKB } = await compressImage(file, 1200, 0.8);
      setCapturedImageDataUrl(dataUrl);
      setCompressedSizeKB(sizeKB);
      setStep('confirm_photo');
    } catch {
      setErrorMessage('Could not process captured photo. Please try again.');
    }
  };

  // Final Save Execution
  const handleFinalSave = async () => {
    try {
      setStep('saving');
      setErrorMessage('');
      setUploadProgress('compressing');

      let uploadedImageUrl = '';
      let uploadedImagePublicId = '';

      // Upload image to Cloudinary if captured
      if (capturedImageDataUrl) {
        setUploadProgress('uploading_image');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: capturedImageDataUrl }),
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload photo to Cloudinary');
        }

        const uploadData = await uploadRes.json();
        uploadedImageUrl = uploadData.imageUrl;
        uploadedImagePublicId = uploadData.imagePublicId;
      }

      // Save to MongoDB
      setUploadProgress('saving_item');
      const itemRes = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.toUpperCase().trim(),
          price: parseFloat(price) || 0,
          unit: unit.toUpperCase().trim(),
          category: (tag || 'GENERAL').toUpperCase().trim(),
          priority: parseInt(priority, 10) || 100,
          imageUrl: uploadedImageUrl,
          imagePublicId: uploadedImagePublicId,
          inStock: true,
        }),
      });

      if (!itemRes.ok) {
        const errData = await itemRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save item to database');
      }

      setUploadProgress('done');
      setTimeout(() => {
        router.push('/admin?success=Item added successfully');
      }, 600);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error adding item');
      setStep('ask_price'); // allow retry
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleImageSelected(e.target.files[0]);
        }}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleImageSelected(e.target.files[0]);
        }}
      />

      {/* Top Navigation Bar with Step Progress */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            if (step === 'confirm_photo') setStep('camera');
            else if (step === 'ask_name') setStep('confirm_photo');
            else if (step === 'ask_tag') setStep('ask_name');
            else if (step === 'ask_price') setStep('ask_tag');
            else router.push('/admin');
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>{step === 'camera' ? 'Cancel & Return' : 'Back'}</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
            {step === 'camera' && 'Step 1 of 5: Capture Photo'}
            {step === 'confirm_photo' && 'Step 2 of 5: Confirm Photo'}
            {step === 'ask_name' && 'Step 3 of 5: Item Name'}
            {step === 'ask_tag' && 'Step 4 of 5: Select Tag'}
            {step === 'ask_price' && 'Step 5 of 5: Price & Unit'}
            {step === 'saving' && 'Saving to Catalog...'}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="my-3 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl animate-fade-in">
          {errorMessage}
        </div>
      )}

      {/* STEP 1: CAMERA PROMPT SCREEN */}
      {step === 'camera' && (
        <div className="my-auto w-full max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-xl text-center flex flex-col items-center animate-fade-in">
          <div className="w-20 h-20 bg-red-50 text-[#D32F2F] rounded-3xl flex items-center justify-center mb-4 shadow-inner ring-8 ring-red-50/60">
            <Camera size={42} />
          </div>

          <h2 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">
            Take Photo of Item
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-6 max-w-xs">
            Directly capture the hardware product using your device camera.
          </p>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#B71C1C] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[50px]"
          >
            <Camera size={18} />
            <span>Open Camera Now</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="mt-3 text-xs font-bold text-gray-600 hover:text-[#D32F2F] flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ImageIcon size={16} />
            <span>Or choose from gallery</span>
          </button>

          <button
            type="button"
            onClick={() => setStep('ask_name')}
            className="mt-4 text-[11px] font-semibold text-gray-400 hover:underline"
          >
            Skip photo & enter details only →
          </button>
        </div>
      )}

      {/* STEP 2: CONFIRM PHOTO */}
      {step === 'confirm_photo' && capturedImageDataUrl && (
        <div className="my-auto w-full max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 p-5 shadow-xl flex flex-col items-center animate-fade-in">
          <h2 className="text-base font-black uppercase tracking-tight text-[#1A1A1A] mb-3 text-center">
            Confirm Captured Photo
          </h2>

          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner mb-2">
            <Image
              src={capturedImageDataUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>

          <div className="text-[11px] font-semibold text-gray-500 mb-4 flex items-center gap-1">
            <Sparkles size={12} className="text-green-600" />
            <span>Compressed for fast loading (~{compressedSizeKB} KB)</span>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setStep('ask_name')}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Check size={18} />
              <span>Use This Photo</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 min-h-[42px]"
            >
              <RotateCcw size={15} />
              <span>Retake Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ASK NAME (FORCED UPPERCASE) */}
      {step === 'ask_name' && (
        <div className="my-auto w-full max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-xl flex flex-col animate-fade-in">
          <div className="text-center mb-5">
            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full uppercase">
              Step 3 of 5
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A] mt-2">
              Item Name
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter the exact item name (e.g. CPVC PIPE 1/2 INCH, BALUWA SAND 1 TRIP)
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setStep('ask_tag');
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label
                htmlFor="item-name-input"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5"
              >
                Name (Always Uppercase) *
              </label>
              <input
                id="item-name-input"
                type="text"
                autoFocus
                required
                maxLength={60}
                placeholder="TYPE ITEM NAME..."
                style={{ textTransform: 'uppercase' }}
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 bg-gray-50 focus:bg-white border-2 border-gray-300 focus:border-[#D32F2F] text-base text-[#1A1A1A] rounded-xl outline-none font-black tracking-tight"
              />
              <span className="text-[10px] text-gray-400 mt-1 block text-right font-medium">
                {name.length}/60 characters
              </span>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[48px] mt-2 cursor-pointer"
            >
              <span>Next: Select Tag</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* STEP 4: ASK TAG (PIPE, BALUWA, CEMENT, ETC.) */}
      {step === 'ask_tag' && (
        <div className="my-auto w-full max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-xl flex flex-col animate-fade-in">
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full uppercase">
              Step 4 of 5
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A] mt-2">
              Select Tag / Category
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate font-bold text-gray-700">
              For: {name}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tag.trim()) setStep('ask_price');
            }}
            className="flex flex-col gap-4"
          >
            {/* Quick Tag Chips */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                Popular Tags (Tap to Select)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                {POPULAR_TAGS.map((t) => {
                  const isSelected = tag.toUpperCase() === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#D32F2F] text-white shadow-sm ring-2 ring-red-200'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div>
              <label
                htmlFor="custom-tag-input"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-1"
              >
                <TagIcon size={13} />
                <span>Custom Tag (or edit selection) *</span>
              </label>
              <input
                id="custom-tag-input"
                type="text"
                required
                maxLength={30}
                placeholder="e.g. BALUWA, PIPE, CEMENT..."
                style={{ textTransform: 'uppercase' }}
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-gray-50 focus:bg-white border-2 border-gray-300 focus:border-[#D32F2F] text-sm text-[#1A1A1A] rounded-xl outline-none font-black tracking-tight"
              />
            </div>

            <button
              type="submit"
              disabled={!tag.trim()}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[48px] mt-1 cursor-pointer"
            >
              <span>Next: Set Price & Unit</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* STEP 5: ASK PRICE & UNIT */}
      {step === 'ask_price' && (
        <div className="my-auto w-full max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-xl flex flex-col animate-fade-in">
          <div className="text-center mb-5">
            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full uppercase">
              Step 5 of 5
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A] mt-2">
              Price & Unit
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-xs text-gray-700 font-bold truncate max-w-[160px]">{name}</span>
              <span className="text-[10px] font-bold bg-red-50 text-[#D32F2F] px-2 py-0.5 rounded uppercase">
                {tag}
              </span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (price && parseFloat(price) >= 0) handleFinalSave();
            }}
            className="flex flex-col gap-4"
          >
            {/* Price Input with numeric keypad */}
            <div>
              <label
                htmlFor="item-price-input"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5"
              >
                Price in NPR (Rs.) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-black text-gray-500">
                  Rs.
                </span>
                <input
                  id="item-price-input"
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  autoFocus
                  required
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-11 pr-3.5 py-3 bg-gray-50 focus:bg-white border-2 border-gray-300 focus:border-[#D32F2F] text-lg font-black text-[#D32F2F] rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Unit Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Pricing Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-[#1A1A1A] outline-none focus:border-[#D32F2F]"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    PER {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Priority Rank
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#D32F2F]"
              />
              <span className="text-[10px] text-gray-400">Lower = shown higher on customer list</span>
            </div>

            <button
              type="submit"
              disabled={!price || parseFloat(price) < 0}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 min-h-[48px] mt-2 cursor-pointer"
            >
              <UploadCloud size={18} />
              <span>Save & Publish Item</span>
            </button>
          </form>
        </div>
      )}

      {/* STEP 6: SAVING PROGRESS OVERLAY */}
      {step === 'saving' && (
        <div className="my-auto w-full max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-xl text-center flex flex-col items-center animate-fade-in">
          <div className="w-16 h-16 bg-red-50 text-[#D32F2F] rounded-full flex items-center justify-center mb-4">
            <span className="w-8 h-8 border-3 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
          </div>

          <h3 className="text-base font-black uppercase text-[#1A1A1A] mb-1">
            {uploadProgress === 'compressing' && 'Compressing Photo...'}
            {uploadProgress === 'uploading_image' && 'Uploading Photo to Cloudinary...'}
            {uploadProgress === 'saving_item' && 'Saving Item to Database...'}
            {uploadProgress === 'done' && 'Item Saved!'}
          </h3>

          <p className="text-xs text-gray-500 max-w-xs">
            Optimizing image and updating live shop catalog...
          </p>
        </div>
      )}

      {/* Footer step indicators */}
      <div className="flex items-center justify-center gap-2 pt-3">
        {['camera', 'confirm_photo', 'ask_name', 'ask_tag', 'ask_price'].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              step === s
                ? 'w-8 bg-[#D32F2F]'
                : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
