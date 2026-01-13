import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Scene, GenerateImagesResponse } from '../types';
import toast from 'react-hot-toast';

export function useGenerateImages(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { model?: 'flash' | 'pro'; referenceImageUrl?: string }) =>
      api.post<GenerateImagesResponse>(`/projects/${projectId}/generate-images`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Generowanie obrazow rozpoczete!');
    },
    onError: (error) => {
      toast.error(`Blad: ${error.message}`);
    },
  });
}

export function useGenerateSingleImage(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sceneId, model }: { sceneId: string; model?: 'flash' | 'pro' }) =>
      api.post<Scene>(`/projects/${projectId}/scenes/${sceneId}/generate-image`, { model }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Obraz wygenerowany!');
    },
    onError: (error) => {
      toast.error(`Blad: ${error.message}`);
    },
  });
}

export function useUpdateScene(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sceneId, data }: { sceneId: string; data: Partial<Scene> }) =>
      api.patch<Scene>(`/projects/${projectId}/scenes/${sceneId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Scena zaktualizowana!');
    },
    onError: (error) => {
      toast.error(`Blad: ${error.message}`);
    },
  });
}
