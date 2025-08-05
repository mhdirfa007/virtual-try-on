'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  X, 
  Check, 
  AlertCircle,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { validateImageFile, getImageDimensions } from '@/lib/api';
import { useAddUploadedImage } from '@/store/useAppStore';
import type { ImageUploadProps, UploadedImage } from '@/types';

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  preview = true,
  className = '',
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const addUploadedImage = useAddUploadedImage();

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      
      // Check minimum dimensions
      if (dimensions.width < 512 || dimensions.height < 512) {
        toast.error('Image must be at least 512x512 pixels');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Create uploaded image object
      const uploadedImage: UploadedImage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: previewUrl,
        file,
        type: 'user_photo',
        dimensions,
        metadata: {
          size: file.size,
          format: file.type,
          quality: 1,
          uploadedAt: new Date(),
        },
      };

      // Add to store
      addUploadedImage(uploadedImage);
      
      // Call onUpload callback
      onUpload(uploadedImage);
      
      // Update local state for preview
      if (preview) {
        setUploadedFiles(prev => multiple ? [...prev, file] : [file]);
        setPreviews(prev => multiple ? [...prev, previewUrl] : [previewUrl]);
      }

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  }, [onUpload, multiple, preview, addUploadedImage]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(processFile);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  }, []);

  const captureFromCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
              processFile(file);
            }
          }, 'image/jpeg', 0.9);
        }
        
        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera');
    }
  }, [processFile]);

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive || dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-luxury-300 hover:border-primary-400 hover:bg-luxury-50'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence>
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-primary-600">Processing image...</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop your image here' : 'Upload your photo'}
              </h3>
              <p className="text-luxury-600 mb-4">
                Drag and drop your image, or click to browse
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.querySelector('input[type="file"]')?.click();
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choose File
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    captureFromCamera();
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Use Camera
                </button>
              </div>
              <p className="text-sm text-luxury-500 mt-4">
                Supported: JPEG, PNG, WebP • Max size: {Math.round(maxSize / (1024 * 1024))}MB • Min: 512x512px
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* File Validation Messages */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-luxury-600">
          <Check className="w-4 h-4 text-green-500 mr-2" />
          High-quality images work best for accurate virtual try-on
        </div>
        <div className="flex items-center text-sm text-luxury-600">
          <AlertCircle className="w-4 h-4 text-amber-500 mr-2" />
          Ensure good lighting and clear view of your body
        </div>
      </div>

      {/* Preview Section */}
      {preview && previews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <h4 className="text-lg font-semibold mb-4">Uploaded Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-luxury-100">
                  <img
                    src={preview}
                    alt={`Upload preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white">
                    {uploadedFiles[index]?.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageUpload;