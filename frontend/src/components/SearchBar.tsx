import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  totalResults: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, totalResults }) => {
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-red-500">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="खोज्नुहोस् / Search item (e.g. Cement, Rod, Pipe, Baluwa)..."
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border-2 border-red-100 focus:border-red-500 focus:ring-4 focus:ring-red-100 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none transition-all shadow-sm"
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3.5 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {value && (
        <div className="mt-1.5 px-2 text-xs text-gray-500 font-medium">
          Found <span className="font-bold text-red-600">{totalResults}</span> item{totalResults !== 1 ? 's' : ''} matching &quot;{value}&quot;
        </div>
      )}
    </div>
  );
};
