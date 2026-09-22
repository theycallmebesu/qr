import React from 'react';
import { Phone, Clock, MapPin, Sparkles } from 'lucide-react';

export const ShopBanner: React.FC = () => {
  return (
    <div className="bg-white border-b border-red-100 shadow-sm px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <Sparkles className="w-3 h-3 text-red-500" />
            आजको मूल्य सूची (Live Rates)
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-gray-500">
            <MapPin className="w-3 h-3 text-red-500" />
            Building Materials & Hardware Supplies
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-600">
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-3 h-3 text-red-500" />
            <span>Open: 7 AM - 7 PM</span>
          </div>
          <a
            href="tel:+9779800000000"
            className="flex items-center gap-1 font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition"
          >
            <Phone className="w-3 h-3 text-red-600" />
            <span>Call Shop</span>
          </a>
        </div>
      </div>
    </div>
  );
};
