import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { SettingsResponse, UserSettings, ValidateKeysResponse } from '../types';
import toast from 'react-hot-toast';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<SettingsResponse>('/settings'),
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      api.put<{ success: boolean }>('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Ustawienia zapisane!');
    },
    onError: (error) => {
      toast.error(`Blad: ${error.message}`);
    },
  });
}

export function useValidateKeys() {
  return useMutation({
    mutationFn: (data: { anthropicApiKey?: string; nanobananaApiKey?: string }) =>
      api.post<ValidateKeysResponse>('/settings/validate-keys', data),
  });
}
