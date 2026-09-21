'use client';

import React from 'react';

interface CategoryChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export default function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryChipsProps) {
  const allCategories = ['ALL', ...categories.filter((c) => c !== 'ALL')];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-4 -mx-4">
      {allCategories.map((cat) => {
        const isSelected = selectedCategory.toUpperCase() === cat.toUpperCase();
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 min-h-[36px] flex items-center justify-center ${
              isSelected
                ? 'bg-[#D32F2F] text-white shadow-sm ring-2 ring-red-200 scale-[1.02]'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
