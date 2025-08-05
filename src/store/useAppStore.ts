import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppState, User, UploadedImage, TryOnRequest, TryOnResult } from '@/types';

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // User state
        user: null,
        setUser: (user: User | null) => set({ user }, false, 'setUser'),

        // Upload state
        uploadedImages: [],
        addUploadedImage: (image: UploadedImage) =>
          set(
            (state) => ({
              uploadedImages: [...state.uploadedImages, image],
            }),
            false,
            'addUploadedImage'
          ),
        removeUploadedImage: (id: string) =>
          set(
            (state) => ({
              uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
            }),
            false,
            'removeUploadedImage'
          ),
        clearUploadedImages: () =>
          set({ uploadedImages: [] }, false, 'clearUploadedImages'),

        // Try-on state
        currentTryOn: null,
        setCurrentTryOn: (tryOn: TryOnRequest | null) =>
          set({ currentTryOn: tryOn }, false, 'setCurrentTryOn'),
        tryOnResults: [],
        addTryOnResult: (result: TryOnResult) =>
          set(
            (state) => ({
              tryOnResults: [result, ...state.tryOnResults],
            }),
            false,
            'addTryOnResult'
          ),

        // UI state
        isLoading: false,
        setIsLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, 'setIsLoading'),
        currentStep: 0,
        setCurrentStep: (step: number) =>
          set({ currentStep: step }, false, 'setCurrentStep'),
        sidebarOpen: false,
        setSidebarOpen: (open: boolean) =>
          set({ sidebarOpen: open }, false, 'setSidebarOpen'),
      }),
      {
        name: 'virtual-try-on-store',
        partialize: (state) => ({
          user: state.user,
          tryOnResults: state.tryOnResults.slice(0, 10), // Keep only last 10 results
        }),
      }
    ),
    {
      name: 'virtual-try-on-store',
    }
  )
);

// Selectors for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useSetUser = () => useAppStore((state) => state.setUser);

export const useUploadedImages = () => useAppStore((state) => state.uploadedImages);
export const useAddUploadedImage = () => useAppStore((state) => state.addUploadedImage);
export const useRemoveUploadedImage = () => useAppStore((state) => state.removeUploadedImage);
export const useClearUploadedImages = () => useAppStore((state) => state.clearUploadedImages);

export const useCurrentTryOn = () => useAppStore((state) => state.currentTryOn);
export const useSetCurrentTryOn = () => useAppStore((state) => state.setCurrentTryOn);
export const useTryOnResults = () => useAppStore((state) => state.tryOnResults);
export const useAddTryOnResult = () => useAppStore((state) => state.addTryOnResult);

export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useSetIsLoading = () => useAppStore((state) => state.setIsLoading);
export const useCurrentStep = () => useAppStore((state) => state.currentStep);
export const useSetCurrentStep = () => useAppStore((state) => state.setCurrentStep);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const useSetSidebarOpen = () => useAppStore((state) => state.setSidebarOpen);

export default useAppStore;