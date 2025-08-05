import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  ApiResponse, 
  TryOnRequest, 
  TryOnResult, 
  GarmentTemplate, 
  Fabric,
  HuggingFaceRequest,
  HuggingFaceResponse 
} from '@/types';

// Base API client
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return client;
};

// Backend API client
export const backendApi = createApiClient(
  process.env.BACKEND_URL || 'http://localhost:8000'
);

// Hugging Face API client
export const huggingFaceApi = axios.create({
  baseURL: 'https://api-inference.huggingface.co',
  timeout: 60000,
  headers: {
    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// API response wrapper
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data.error?.message || 'API request failed');
};

// Backend API methods
export const api = {
  // Image upload
  uploadImage: async (file: File, type: 'user_photo' | 'fabric_sample') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await backendApi.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return handleApiResponse(response);
  },

  // Garment templates
  getGarmentTemplates: async (category?: string) => {
    const response = await backendApi.get<ApiResponse<GarmentTemplate[]>>(
      `/api/garments${category ? `?category=${category}` : ''}`
    );
    return handleApiResponse(response);
  },

  getGarmentTemplate: async (id: string) => {
    const response = await backendApi.get<ApiResponse<GarmentTemplate>>(
      `/api/garments/${id}`
    );
    return handleApiResponse(response);
  },

  // Fabrics
  getFabrics: async (type?: string) => {
    const response = await backendApi.get<ApiResponse<Fabric[]>>(
      `/api/fabrics${type ? `?type=${type}` : ''}`
    );
    return handleApiResponse(response);
  },

  getFabric: async (id: string) => {
    const response = await backendApi.get<ApiResponse<Fabric>>(`/api/fabrics/${id}`);
    return handleApiResponse(response);
  },

  // Virtual try-on
  createTryOnRequest: async (request: TryOnRequest) => {
    const response = await backendApi.post<ApiResponse<TryOnResult>>(
      '/api/try-on',
      request
    );
    return handleApiResponse(response);
  },

  getTryOnResult: async (id: string) => {
    const response = await backendApi.get<ApiResponse<TryOnResult>>(
      `/api/try-on/${id}`
    );
    return handleApiResponse(response);
  },

  getTryOnHistory: async (limit = 10) => {
    const response = await backendApi.get<ApiResponse<TryOnResult[]>>(
      `/api/try-on/history?limit=${limit}`
    );
    return handleApiResponse(response);
  },
};

// Hugging Face API methods
export const huggingFaceModels = {
  // Fashion-CLIP for garment understanding
  analyzeGarment: async (imageUrl: string) => {
    const request: HuggingFaceRequest = {
      inputs: imageUrl,
      parameters: {
        candidate_labels: [
          'shirt', 'pants', 'dress', 'jacket', 'suit', 'casual', 'formal', 'business'
        ]
      }
    };

    const response = await huggingFaceApi.post<HuggingFaceResponse>(
      '/models/openai/clip-vit-large-patch14',
      request
    );
    return response.data;
  },

  // Human pose estimation
  estimatePose: async (imageUrl: string) => {
    const request: HuggingFaceRequest = {
      inputs: imageUrl,
      options: { wait_for_model: true }
    };

    const response = await huggingFaceApi.post<HuggingFaceResponse>(
      '/models/microsoft/DialoGPT-medium',
      request
    );
    return response.data;
  },

  // Image segmentation
  segmentImage: async (imageUrl: string) => {
    const request: HuggingFaceRequest = {
      inputs: imageUrl,
      parameters: {
        threshold: 0.5
      }
    };

    const response = await huggingFaceApi.post<HuggingFaceResponse>(
      '/models/facebook/detr-resnet-50-panoptic',
      request
    );
    return response.data;
  },

  // Virtual try-on (using VITON-HD style model)
  generateTryOn: async (personImage: string, garmentImage: string, mask?: string) => {
    const request: HuggingFaceRequest = {
      inputs: {
        person_image: personImage,
        garment_image: garmentImage,
        ...(mask && { mask })
      },
      parameters: {
        num_inference_steps: 20,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 1000000)
      },
      options: { 
        wait_for_model: true,
        use_cache: false
      }
    };

    const response = await huggingFaceApi.post<HuggingFaceResponse>(
      '/models/yisol/IDM-VTON',
      request
    );
    return response.data;
  },

  // Style transfer for fabric patterns
  transferStyle: async (contentImage: string, styleImage: string) => {
    const request: HuggingFaceRequest = {
      inputs: {
        content_image: contentImage,
        style_image: styleImage
      },
      parameters: {
        style_strength: 0.8,
        preserve_content: true
      }
    };

    const response = await huggingFaceApi.post<HuggingFaceResponse>(
      '/models/pytorch/pytorch_neural_style_transfer',
      request
    );
    return response.data;
  },

  // Background removal
  removeBackground: async (imageUrl: string) => {
    const request: HuggingFaceRequest = {
      inputs: imageUrl
    };

    const response = await huggingFaceApi.post<HuggingFaceResponse>(
      '/models/briaai/RMBG-1.4',
      request
    );
    return response.data;
  },

  // Image enhancement
  enhanceImage: async (imageUrl: string) => {
    const request: HuggingFaceRequest = {
      inputs: imageUrl,
      parameters: {
        scale: 2,
        face_enhance: true
      }
    };

    const response = await huggingFaceApi.post<HuggingFaceResponse>(
      '/models/microsoft/DialoGPT-medium',
      request
    );
    return response.data;
  }
};

// Utility functions
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, WebP' };
  }

  return { valid: true };
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};