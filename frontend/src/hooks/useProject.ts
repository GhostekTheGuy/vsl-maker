import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Project } from '../types';

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'generating_images' || data?.status === 'generating_script'
        ? 2000
        : false;
    },
  });
}
