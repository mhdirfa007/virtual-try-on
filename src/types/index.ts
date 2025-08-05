// User and Session Types
export interface User {
  id: string;
  email?: string;
  preferences: UserPreferences;
  measurements?: BodyMeasurements;
}

export interface UserPreferences {
  favoriteStyles: string[];
  preferredFit: 'slim' | 'regular' | 'relaxed';
  colorPreferences: string[];
  fabricPreferences: string[];
}

export interface BodyMeasurements {
  chest: number;
  waist: number;
  hips: number;
  shoulders: number;
  armLength: number;
  inseam: number;
  height: number;
  weight: number;
  units: 'metric' | 'imperial';
}

// Image and Upload Types
export interface UploadedImage {
  id: string;
  url: string;
  file: File;
  type: 'user_photo' | 'fabric_sample';
  dimensions: {
    width: number;
    height: number;
  };
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  size: number;
  format: string;
  quality: number;
  uploadedAt: Date;
  processedAt?: Date;
}

// Garment and Template Types
export interface GarmentTemplate {
  id: string;
  name: string;
  category: GarmentCategory;
  type: GarmentType;
  description: string;
  basePrice: number;
  images: string[];
  customizationOptions: CustomizationOption[];
  availableSizes: Size[];
  tags: string[];
}

export type GarmentCategory = 'shirts' | 'suits' | 'trousers' | 'outerwear' | 'accessories';

export type GarmentType = 
  | 'dress_shirt' 
  | 'casual_shirt' 
  | 'polo_shirt' 
  | 't_shirt'
  | 'two_piece_suit'
  | 'three_piece_suit'
  | 'blazer'
  | 'waistcoat'
  | 'formal_pants'
  | 'chinos'
  | 'jeans'
  | 'coat'
  | 'jacket'
  | 'vest'
  | 'tie'
  | 'pocket_square'
  | 'cufflinks';

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'color' | 'fabric' | 'style' | 'fit' | 'details';
  options: OptionValue[];
  defaultValue: string;
  priceModifier: number;
}

export interface OptionValue {
  id: string;
  label: string;
  value: string;
  image?: string;
  priceModifier: number;
}

export interface Size {
  id: string;
  label: string;
  measurements: Partial<BodyMeasurements>;
}

// Fabric Types
export interface Fabric {
  id: string;
  name: string;
  type: FabricType;
  composition: string;
  weight: number;
  texture: string;
  care: string[];
  colors: FabricColor[];
  patterns: FabricPattern[];
  pricePerMeter: number;
  images: string[];
  inStock: boolean;
}

export type FabricType = 
  | 'cotton'
  | 'wool'
  | 'silk'
  | 'linen'
  | 'polyester'
  | 'blend'
  | 'cashmere'
  | 'tweed'
  | 'denim';

export interface FabricColor {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export interface FabricPattern {
  id: string;
  name: string;
  type: 'solid' | 'stripe' | 'check' | 'plaid' | 'herringbone' | 'paisley' | 'floral' | 'geometric';
  image: string;
}

// Virtual Try-On Types
export interface TryOnRequest {
  id: string;
  userImage: UploadedImage;
  garmentTemplate: GarmentTemplate;
  fabric?: Fabric | UploadedImage;
  customizations: Record<string, string>;
  preferences: TryOnPreferences;
}

export interface TryOnPreferences {
  lighting: 'natural' | 'studio' | 'indoor' | 'outdoor';
  pose: 'front' | 'side' | 'three_quarter';
  background: 'transparent' | 'neutral' | 'original';
  quality: 'fast' | 'balanced' | 'high';
}

export interface TryOnResult {
  id: string;
  requestId: string;
  resultImage: string;
  confidence: number;
  processingTime: number;
  metadata: TryOnMetadata;
  variations?: TryOnVariation[];
}

export interface TryOnMetadata {
  modelUsed: string;
  processingSteps: ProcessingStep[];
  qualityMetrics: QualityMetrics;
  generatedAt: Date;
}

export interface ProcessingStep {
  step: string;
  duration: number;
  success: boolean;
  details?: string;
}

export interface QualityMetrics {
  realism: number;
  fitAccuracy: number;
  colorAccuracy: number;
  textureQuality: number;
  overallScore: number;
}

export interface TryOnVariation {
  id: string;
  type: 'lighting' | 'pose' | 'fit';
  image: string;
  description: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Hugging Face API Types
export interface HuggingFaceRequest {
  inputs: string | Record<string, any>;
  parameters?: Record<string, any>;
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

export interface HuggingFaceResponse {
  generated_text?: string;
  image?: string;
  score?: number;
  label?: string;
  error?: string;
}

// Store Types (Zustand)
export interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Upload state
  uploadedImages: UploadedImage[];
  addUploadedImage: (image: UploadedImage) => void;
  removeUploadedImage: (id: string) => void;
  clearUploadedImages: () => void;
  
  // Try-on state
  currentTryOn: TryOnRequest | null;
  setCurrentTryOn: (tryOn: TryOnRequest | null) => void;
  tryOnResults: TryOnResult[];
  addTryOnResult: (result: TryOnResult) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ImageUploadProps extends BaseComponentProps {
  onUpload: (image: UploadedImage) => void;
  acceptedTypes: string[];
  maxSize: number;
  multiple?: boolean;
  preview?: boolean;
}

export interface GarmentSelectorProps extends BaseComponentProps {
  templates: GarmentTemplate[];
  selectedTemplate: GarmentTemplate | null;
  onSelect: (template: GarmentTemplate) => void;
  category?: GarmentCategory;
}

export interface TryOnViewerProps extends BaseComponentProps {
  result: TryOnResult | null;
  isLoading: boolean;
  onRetry?: () => void;
  showComparison?: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;