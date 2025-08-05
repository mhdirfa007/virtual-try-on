'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  ArrowRight, 
  Play,
  Star,
  Shield,
  Zap,
  Users
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import GarmentSelector from '@/components/GarmentSelector';
import TryOnViewer from '@/components/TryOnViewer';
import { useCurrentStep, useSetCurrentStep } from '@/store/useAppStore';

const steps = [
  { id: 0, title: 'Upload Photo', icon: Upload },
  { id: 1, title: 'Choose Garment', icon: Camera },
  { id: 2, title: 'Virtual Try-On', icon: Sparkles },
];

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Fitting',
    description: 'Advanced computer vision technology ensures accurate virtual fitting',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your photos are processed securely and deleted after each session',
  },
  {
    icon: Star,
    title: 'Premium Quality',
    description: 'High-resolution results with realistic fabric draping and lighting',
  },
  {
    icon: Users,
    title: 'Trusted by Thousands',
    description: '40-60% reduction in returns for our partner brands',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Fashion Enthusiast',
    content: 'The virtual try-on is incredibly accurate. I ordered a custom suit and it fit perfectly!',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Business Executive',
    content: 'Saved me multiple trips to the tailor. The AI really understands how clothes should fit.',
    rating: 5,
  },
  {
    name: 'Emma Davis',
    role: 'Style Blogger',
    content: 'Game-changing technology. The fabric visualization is so realistic.',
    rating: 5,
  },
];

export default function HomePage() {
  const currentStep = useCurrentStep();
  const setCurrentStep = useSetCurrentStep();
  const [showDemo, setShowDemo] = useState(false);

  const handleStartTryOn = () => {
    setShowDemo(true);
    setCurrentStep(0);
  };

  if (showDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-luxury-50 to-primary-50">
        <div className="container mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      currentStep >= step.id
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-luxury-300 text-luxury-500'
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-primary-600' : 'text-luxury-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className={`w-5 h-5 mx-4 ${
                      currentStep > step.id ? 'text-primary-600' : 'text-luxury-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              {currentStep === 0 && (
                <div className="card p-8">
                  <h2 className="text-2xl font-bold text-center mb-6">
                    Upload Your Photo
                  </h2>
                  <p className="text-luxury-600 text-center mb-8">
                    Take or upload a clear photo of yourself for the best virtual try-on experience
                  </p>
                  <ImageUpload
                    onUpload={(image) => {
                      console.log('Image uploaded:', image);
                      setCurrentStep(1);
                    }}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    maxSize={10 * 1024 * 1024}
                    preview={true}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="card p-8">
                  <h2 className="text-2xl font-bold text-center mb-6">
                    Choose Your Garment
                  </h2>
                  <p className="text-luxury-600 text-center mb-8">
                    Select from our premium template collection or upload your own fabric
                  </p>
                  <GarmentSelector
                    templates={[]}
                    selectedTemplate={null}
                    onSelect={(template) => {
                      console.log('Template selected:', template);
                      setCurrentStep(2);
                    }}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="card p-8">
                  <h2 className="text-2xl font-bold text-center mb-6">
                    Your Virtual Try-On
                  </h2>
                  <p className="text-luxury-600 text-center mb-8">
                    See how your chosen garment looks and fits
                  </p>
                  <TryOnViewer
                    result={null}
                    isLoading={false}
                    showComparison={true}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Back Button */}
          {currentStep > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn-secondary"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-luxury-50 via-white to-primary-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold font-serif mb-6">
                Experience{' '}
                <span className="gradient-text">Perfect Fit</span>
                <br />
                Before You Commit
              </h1>
              <p className="text-xl lg:text-2xl text-luxury-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Our AI-powered virtual try-on technology lets you see exactly how custom tailored 
                garments will look and fit, using either our premium templates or your own fabric samples.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStartTryOn}
                  className="btn-primary text-lg px-8 py-4 group"
                >
                  Start Virtual Try-On
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="btn-secondary text-lg px-8 py-4 group">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif mb-4">
              Why Choose Our Virtual Try-On?
            </h2>
            <p className="text-xl text-luxury-600 max-w-2xl mx-auto">
              Cutting-edge AI technology meets premium fashion for an unparalleled online shopping experience
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-hover p-6 text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-luxury-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-luxury-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif mb-4">
              Loved by Fashion Enthusiasts
            </h2>
            <p className="text-xl text-luxury-600">
              See what our customers say about their virtual try-on experience
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent-500 fill-current" />
                  ))}
                </div>
                <p className="text-luxury-700 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-luxury-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold font-serif mb-4">
            Ready to Transform Your Shopping Experience?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who've discovered the perfect fit
          </p>
          <button
            onClick={handleStartTryOn}
            className="bg-white text-primary-600 hover:bg-luxury-50 font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Start Your Virtual Try-On
          </button>
        </div>
      </section>
    </div>
  );
}