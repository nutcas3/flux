'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FilterState {
  search: string;
  minVram: number;
  maxPrice: number;
  availableOnly: boolean;
  sortBy: 'price' | 'reputation' | 'vram';
}

interface GPUFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export function GPUFilter({ onFilterChange }: GPUFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    minVram: 0,
    maxPrice: 1000,
    availableOnly: false,
    sortBy: 'price',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search GPU models..."
            value={filters.search}
            onChange={(e) => handleChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] placeholder-[#6B2850] focus:outline-none focus:border-[#A926B6]"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Min VRAM (GB)
            </label>
            <input
              type="number"
              value={filters.minVram}
              onChange={(e) => handleChange({ minVram: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Max Price (SOL/hour)
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleChange({ maxPrice: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="w-full px-4 py-2 bg-white border-2 border-[#E8D1AB] rounded-lg text-[#331018] focus:outline-none focus:border-[#A926B6]"
            >
              <option value="price">Price (Low to High)</option>
              <option value="reputation">Reputation</option>
              <option value="vram">VRAM</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="availableOnly"
              checked={filters.availableOnly}
              onChange={(e) => handleChange({ availableOnly: e.target.checked })}
              className="w-4 h-4 bg-white border-[#E8D1AB] rounded focus:ring-[#A926B6]"
            />
            <label htmlFor="availableOnly" className="text-sm text-gray-300">
              Show available only
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
