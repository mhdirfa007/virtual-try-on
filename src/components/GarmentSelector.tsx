'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shirt, 
  Square, 
  Palette, 
  Sparkles, 
  Filter,
  Search,
  Plus,
  Tag,
  Star,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import type { GarmentSelectorProps, GarmentTemplate, GarmentCategory } from '@/types';

// Mock data for demonstration
const mockTemplates: GarmentTemplate[] = [
  {
    id: '1',
    name: 'Classic Business Shirt',
    category: 'shirts',
    type: 'dress_shirt',
    description: 'Timeless professional shirt with perfect tailoring',
    basePrice: 89,
    images: ['/api/placeholder/300/400'],
    customizationOptions: [],
    availableSizes: [],
    tags: ['business', 'classic', 'cotton'],
  },
  {
    id: '2',
    name: 'Modern Slim Fit Suit',
    category: 'suits',
    type: 'two_piece_suit',
    description: 'Contemporary two-piece suit with modern cut',
    basePrice: 450,
    images: ['/api/placeholder/300/400'],
    customizationOptions: [],
    availableSizes: [],
    tags: ['modern', 'slim', 'formal'],
  },
  {
    id: '3',
    name: 'Casual Chinos',
    category: 'trousers',
    type: 'chinos',
    description: 'Versatile chinos for smart-casual occasions',
    basePrice: 75,
    images: ['/api/placeholder/300/400'],
    customizationOptions: [],
    availableSizes: [],
    tags: ['casual', 'versatile', 'cotton'],
  },
  {
    id: '4',
    name: 'Premium Blazer',
    category: 'outerwear',
    type: 'blazer',
    description: 'Sophisticated blazer for business and social events',
    basePrice: 280,
    images: ['/api/placeholder/300/400'],
    customizationOptions: [],
    availableSizes: [],
    tags: ['premium', 'blazer', 'wool'],
  },
];

const categories: { id: GarmentCategory; label: string; icon: React.ElementType }[] = [
  { id: 'shirts', label: 'Shirts', icon: Shirt },
  { id: 'suits', label: 'Suits', icon: Square },
  { id: 'trousers', label: 'Trousers', icon: Square },
  { id: 'outerwear', label: 'Outerwear', icon: Square },
  { id: 'accessories', label: 'Accessories', icon: Square },
];

const GarmentSelector: React.FC<GarmentSelectorProps> = ({
  templates = mockTemplates,
  selectedTemplate,
  onSelect,
  category,
  className = '',
}) => {
  const [filteredTemplates, setFilteredTemplates] = useState<GarmentTemplate[]>(templates);
  const [selectedCategory, setSelectedCategory] = useState<GarmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFabricUpload, setShowFabricUpload] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price' | 'newest'>('popular');

  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort templates
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.basePrice - b.basePrice;
        case 'newest':
          return b.id.localeCompare(a.id); // Mock: using ID as date proxy
        case 'popular':
        default:
          return 0; // Mock: no actual popularity data
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery, sortBy]);

  const handleTemplateSelect = (template: GarmentTemplate) => {
    onSelect(template);
    toast.success(`Selected ${template.name}`);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-bold mb-2">Choose Your Garment</h3>
          <p className="text-luxury-600">
            Select from our premium collection or upload your own fabric pattern
          </p>
        </div>
        <button
          onClick={() => setShowFabricUpload(!showFabricUpload)}
          className="btn-secondary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Custom Fabric
        </button>
      </div>

      {/* Custom Fabric Upload */}
      <AnimatePresence>
        {showFabricUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="card p-6">
              <h4 className="text-lg font-semibold mb-4">Upload Your Fabric Sample</h4>
              <ImageUpload
                onUpload={(image) => {
                  console.log('Fabric uploaded:', image);
                  toast.success('Fabric sample uploaded!');
                  setShowFabricUpload(false);
                }}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                maxSize={10 * 1024 * 1024}
                preview={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-luxury-400" />
          <input
            type="text"
            placeholder="Search garments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-luxury-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'popular' | 'price' | 'newest')}
          className="px-4 py-3 border border-luxury-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="popular">Most Popular</option>
          <option value="price">Price: Low to High</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            selectedCategory === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-luxury-100 text-luxury-700 hover:bg-luxury-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-luxury-100 text-luxury-700 hover:bg-luxury-200'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`card-hover cursor-pointer group ${
                selectedTemplate?.id === template.id
                  ? 'ring-2 ring-primary-500 ring-offset-2'
                  : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* Image */}
              <div className="aspect-[3/4] bg-luxury-100 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-luxury-200 to-luxury-300 flex items-center justify-center">
                  <Shirt className="w-16 h-16 text-luxury-400" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg group-hover:text-primary-600 transition-colors">
                    {template.name}
                  </h4>
                  {selectedTemplate?.id === template.id && (
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <p className="text-luxury-600 text-sm mb-3 line-clamp-2">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-luxury-100 text-luxury-600 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 2 && (
                    <span className="px-2 py-1 bg-luxury-100 text-luxury-600 text-xs rounded-md">
                      +{template.tags.length - 2}
                    </span>
                  )}
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary-600">
                    ${template.basePrice}
                  </span>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent-500 fill-current" />
                    <span className="text-sm text-luxury-600">4.8</span>
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 text-luxury-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-luxury-600 mb-2">
            No garments found
          </h3>
          <p className="text-luxury-500 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Selected Template Info */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 card p-6 bg-primary-50 border-primary-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-primary-900 mb-1">
                Selected: {selectedTemplate.name}
              </h4>
              <p className="text-primary-700">
                Ready for virtual try-on with your uploaded photo
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">
                ${selectedTemplate.basePrice}
              </p>
              <p className="text-sm text-primary-600">Base price</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GarmentSelector;