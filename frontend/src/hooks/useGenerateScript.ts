import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { api } from '../api/client';
import type { Project, CreateProjectRequest } from '../types';
import toast from 'react-hot-toast';

export function useCreateProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      api.post<Project>('/projects', data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate({ to: '/projects/$projectId', params: { projectId: project.id } });
      toast.success('Scenariusz wygenerowany!');
    },
    onError: (error) => {
      toast.error(`Blad: ${error.message}`);
    },
  });
}

export function useRegenerateScript(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { styleHints?: string; numScenes?: number }) =>
      api.post<Project>(`/projects/${projectId}/generate-script`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Scenariusz zregenerowany!');
    },
    onError: (error) => {
      toast.error(`Blad: ${error.message}`);
    },
  });
}
