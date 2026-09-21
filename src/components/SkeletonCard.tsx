import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-square w-full bg-gray-200" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-10" />
        </div>
      </div>
    </div>
  );
}
