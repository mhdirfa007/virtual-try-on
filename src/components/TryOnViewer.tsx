'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Download, 
  Share2, 
  RotateCcw, 
  Sliders,
  Eye,
  EyeOff,
  Maximize2,
  ShoppingCart,
  Heart,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { TryOnViewerProps, TryOnResult } from '@/types';

// Mock result for demonstration
const mockResult: TryOnResult = {
  id: 'result-1',
  requestId: 'request-1',
  resultImage: '/api/placeholder/400/600',
  confidence: 0.92,
  processingTime: 25,
  metadata: {
    modelUsed: 'IDM-VTON',
    processingSteps: [
      { step: 'Image preprocessing', duration: 3, success: true },
      { step: 'Pose estimation', duration: 8, success: true },
      { step: 'Garment segmentation', duration: 5, success: true },
      { step: 'Virtual try-on generation', duration: 9, success: true },
    ],
    qualityMetrics: {
      realism: 0.89,
      fitAccuracy: 0.94,
      colorAccuracy: 0.91,
      textureQuality: 0.88,
      overallScore: 0.91,
    },
    generatedAt: new Date(),
  },
  variations: [
    {
      id: 'var-1',
      type: 'lighting',
      image: '/api/placeholder/400/600',
      description: 'Natural lighting',
    },
    {
      id: 'var-2',
      type: 'lighting',
      image: '/api/placeholder/400/600',
      description: 'Studio lighting',
    },
  ],
};

const TryOnViewer: React.FC<TryOnViewerProps> = ({
  result = mockResult,
  isLoading = false,
  onRetry,
  showComparison = true,
  className = '',
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    result?.resultImage,
    ...(result?.variations?.map(v => v.image) || [])
  ].filter(Boolean);

  useEffect(() => {
    if (result) {
      toast.success(`Virtual try-on completed! Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
    }
  }, [result]);

  const handleDownload = async () => {
    if (!result?.resultImage) return;
    
    try {
      const response = await fetch(result.resultImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `virtual-try-on-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShare = async () => {
    if (!result?.resultImage) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Virtual Try-On',
          text: 'Check out how this garment looks on me!',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      toast.info('Generating new try-on result...');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="card p-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <Sparkles className="w-16 h-16 text-primary-600" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-4">Creating Your Virtual Try-On</h3>
            <p className="text-luxury-600 mb-6">
              Our AI is processing your image and applying the selected garment...
            </p>
            
            {/* Processing Steps */}
            <div className="max-w-md mx-auto space-y-3">
              {['Analyzing your photo', 'Detecting body pose', 'Applying garment', 'Enhancing quality'].map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.5 }}
                  className="flex items-center justify-between p-3 bg-luxury-50 rounded-lg"
                >
                  <span className="text-sm font-medium">{step}</span>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-4 h-4 text-primary-600" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6">
              <div className="w-full bg-luxury-200 rounded-full h-2">
                <motion.div
                  className="bg-primary-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 30, ease: "easeInOut" }}
                />
              </div>
              <p className="text-sm text-luxury-500 mt-2">
                Estimated time: 20-30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`w-full ${className}`}>
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-luxury-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-luxury-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ready for Virtual Try-On</h3>
          <p className="text-luxury-600 mb-6">
            Upload your photo and select a garment to see the magic happen
          </p>
          <button className="btn-primary" onClick={handleRetry}>
            Start Try-On
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Main Viewer */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-luxury-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Virtual Try-On Result</h3>
            <p className="text-sm text-luxury-600">
              Confidence: {Math.round((result.confidence || 0) * 100)}% • 
              Processing time: {result.processingTime}s
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showComparison && (
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`p-2 rounded-lg transition-colors ${
                  showOriginal 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-luxury-100 text-luxury-600 hover:bg-luxury-200'
                }`}
                title={showOriginal ? 'Show result' : 'Show original'}
              >
                {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-luxury-100 text-luxury-600 hover:bg-luxury-200 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="relative aspect-[2/3] bg-luxury-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={showOriginal ? 'original' : 'result'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {showOriginal ? (
                <div className="w-full h-full bg-gradient-to-br from-luxury-200 to-luxury-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-luxury-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <p className="text-luxury-600">Original Photo</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-primary-600" />
                    </div>
                    <p className="text-primary-700 font-medium">Virtual Try-On Result</p>
                    <p className="text-sm text-primary-600 mt-1">
                      {Math.round((result.confidence || 0) * 100)}% Confidence
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows for variations */}
          {images.length > 1 && !showOriginal && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-luxury-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="btn-secondary flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={handleShare}
                className="btn-secondary flex items-center"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              {onRetry && (
                <button
                  onClick={handleRetry}
                  className="btn-secondary flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </button>
              <button className="btn-primary flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Order Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variations */}
      {result.variations && result.variations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h4 className="text-lg font-semibold mb-4">Style Variations</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {result.variations.map((variation, index) => (
              <motion.div
                key={variation.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`card-hover cursor-pointer ${
                  selectedVariation === variation.id ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => setSelectedVariation(variation.id)}
              >
                <div className="aspect-[3/4] bg-luxury-100 rounded-t-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-luxury-200 to-primary-200 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium capitalize">{variation.type}</p>
                  <p className="text-xs text-luxury-600">{variation.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quality Metrics */}
      {result.metadata?.qualityMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 card p-6"
        >
          <h4 className="text-lg font-semibold mb-4">Quality Analysis</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(result.metadata.qualityMetrics).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-luxury-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - (value as number))}`}
                      className="text-primary-600"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {Math.round((value as number) * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TryOnViewer;