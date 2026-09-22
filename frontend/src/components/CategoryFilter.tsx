import React from 'react';
import { Tag as TagIcon, Sparkles } from 'lucide-react';
import { Tag } from '../types';

interface CategoryFilterProps {
  tags: Tag[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  tagCounts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  tags,
  selectedTag,
  onSelectTag,
  tagCounts,
}) => {
  const allTags = [{ _id: 'all', name: 'All' }, ...tags];

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-2 px-1 text-xs font-bold text-gray-600 uppercase tracking-wider">
        <TagIcon className="w-3.5 h-3.5 text-red-500" />
        <span>Categories & Tags</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {allTags.map((tag) => {
          const isSelected = selectedTag.toLowerCase() === tag.name.toLowerCase() || (tag.name === 'All' && selectedTag === 'All');
          const count = tag.name === 'All' 
            ? Object.values(tagCounts).reduce((a, b) => a + b, 0)
            : tagCounts[tag.name] || 0;

          return (
            <button
              key={tag._id || tag.name}
              onClick={() => onSelectTag(tag.name)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/25 ring-2 ring-red-600 ring-offset-1'
                  : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-700 border border-gray-200'
              }`}
            >
              {tag.name === 'All' && <Sparkles className="w-3.5 h-3.5" />}
              <span>{tag.name}</span>
              <span
                className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
